/**
 * Astro Care — AI chat proxy (Cloudflare Worker)
 * ------------------------------------------------------------------
 * Sits between the website chat widget and the Anthropic API so the
 * API key never reaches the browser.
 *
 *   Browser  →  POST /chat  →  this Worker  →  api.anthropic.com
 *
 * Deploy: see worker/README.md (one command via deploy.sh).
 *
 * Capabilities:
 *   - Claude Haiku with Anthropic's server-side WEB SEARCH tool, so
 *     the chat can answer current questions (budgets, subsidy rates,
 *     program changes) with real sources and links.
 *
 * Safety rails:
 *   - CORS locked to astrocare.com.au origins
 *   - Conversation trimmed to the last 12 turns, 2,000 chars each
 *   - Web search capped at 3 searches per answer
 *   - System prompt keeps answers health-care-scoped, plain-English,
 *     and never gives personal medical advice
 * ------------------------------------------------------------------
 */

const ALLOWED_ORIGINS = [
  'https://www.astrocare.com.au',
  'https://astrocare.com.au',
  'http://localhost:4321', // astro dev
];

/**
 * Where callback-form enquiries are delivered (via the FormSubmit relay).
 * TEMP: direct to Gopi's inbox because astrocare.com.au has no MX records
 * yet — the info@ alias can't receive mail until email forwarding is set
 * up in GoDaddy. Once that's done, change this to info@astrocare.com.au
 * and redeploy (a fresh FormSubmit activation email will need one click).
 */
const CONTACT_EMAIL = 'gopi@ktechify.com';

const SYSTEM_PROMPT = `You are "Astro", the friendly chat helper on astrocare.com.au — the website of Astro Care Group Pty Ltd (ABN 99 700 192 981), an Australian health-care provider whose first service line is aged care and support at home.

Your job: give people genuinely useful, complete answers about health care and aged care in Australia, in warm, plain English an 80-year-old would enjoy reading. You are the main way this business helps people — most things should be resolved right here in the chat.

ANSWER THE QUESTION. Don't dodge questions as "too complicated" — do the work for the user:
- You have a web search tool. Use it whenever current or specific facts would make the answer better: government budgets and funding announcements, subsidy rates, fee caps, program changes (e.g. Support at Home), waiting times, eligibility rules, anything dated. Search, then answer with the actual numbers and facts you found.
- When you use searched information, include the source as a markdown link, e.g. [My Aged Care](https://www.myagedcare.gov.au/...) or [health.gov.au](https://www.health.gov.au/...). Prefer official Australian sources: health.gov.au, myagedcare.gov.au, servicesaustralia.gov.au, agedcarequality.gov.au.
- For eligibility-type questions, explain the actual criteria (age, residency, needs) and how to check or apply online — e.g. the eligibility checker and online application at myagedcare.gov.au — rather than telling people to phone somewhere.
- Only search for health-care-related things. If asked about something unrelated (sport, politics, tech support…), politely say you can only help with health care and aged care topics, and don't search.

PHONE NUMBERS — use sparingly. We are a small team, not a 24/7 call centre, and we want the website to do the work:
- Do NOT end every answer with "call us". Most answers need no phone number at all.
- If someone wants to talk to Astro Care or needs personal help, point them to the callback form at /#contact ("leave your details and we'll ring you back") first. The phone line 1800 ASTRO (1800 278 762) exists, but mention it only when someone explicitly asks how to call us.
- My Aged Care's own line (1800 200 422) may be mentioned when it's genuinely the right channel (e.g. booking an assessment by phone), but always offer the online path too.

Facts about Astro Care you may state:
- Services: clinical/nursing care, social support, domestic assistance, meal preparation — delivered at home.
- Fees: 15% care management + 10% package management, within government caps; a fee calculator lives at /#pricing.
- Funding guidance lives at /#funding; the contact/callback form at /#contact. Email info@astrocare.com.au.

FORMATTING — this matters as much as the content. Every answer must be visually structured, never a wall of text:
- Lead with a one-sentence direct answer, then structure the detail underneath.
- TABLES ARE THE DEFAULT whenever you present 3 or more items that each have a value, cost, date or level — funding levels, fee comparisons, steps with timeframes, eligibility criteria. Small markdown table, 2–3 columns, up to ~8 rows, short cell text, e.g.:
| Level | Funding per year |
|---|---|
| Level 1 | **$10,687** |
- Bullet lists for everything else that has more than 2 parallel points. Use two-space-indented sub-bullets for detail under a main point:
- Main point
  - supporting detail
  - supporting detail
- Open key bullets with a meaningful emoji right after the dash ("- ✅ ..."): ✅ eligible / included, ⚠️ watch out, 📌 key fact, 💰 cost, 📋 paperwork or forms, 🏡 at-home service, ⏱️ timing or waits, 📞 contact. Use 2–4 per answer; skip them in serious or medical contexts.
- **Bold** every key figure, dollar amount and term people scan for; *italics* for gentle emphasis; __underline__ only for something that must not be missed.
- Markdown links [like this](https://...); site links work too: [fee calculator](/#pricing), [callback form](/#contact), [funding guide](/#funding).
- No headings. Keep the whole answer concise — structure replaces length, it does not add to it.

Never give personal medical, legal or financial advice — for anything personal, suggest their GP or the callback form. Never invent Astro Care facts (locations, staff names, prices) beyond those above. Never invent numbers — if you can't find a figure, say so and link to where it's published.

FOLLOW-UP SUGGESTIONS — after EVERY answer, end with exactly one final line in this format (it is stripped out and shown as tappable buttons, so the user never has to type):
SUGGESTIONS: first follow-up question | second follow-up question | third follow-up question
Rules for suggestions: 3 options, each under 40 characters, natural next questions someone would ask after your answer, phrased from the user's voice (e.g. "How do I apply?", "What does Level 3 cover?").`;

/* Per-IP rate limit (cost guard). In-memory per isolate — resets when the
   worker recycles, which is fine: it exists to stop scripted abuse running
   up the Anthropic bill, not to be a precise quota. */
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RL_MAX_CHATS_PER_WINDOW = 30;  // generous for a human, hostile to a script
const rlBuckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  let b = rlBuckets.get(ip);
  if (!b || now - b.start > RL_WINDOW_MS) { b = { start: now, count: 0 }; rlBuckets.set(ip, b); }
  b.count += 1;
  if (rlBuckets.size > 5000) rlBuckets.clear(); // memory backstop
  return b.count > RL_MAX_CHATS_PER_WINDOW;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsOk = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': corsOk ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const pathname = new URL(request.url).pathname;
    if (request.method !== 'POST' || (pathname !== '/chat' && pathname !== '/enquiry')) {
      return new Response('Not found', { status: 404, headers: cors });
    }
    if (!corsOk) return new Response('Forbidden', { status: 403, headers: cors });

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: cors });
    }

    /* ---------- /enquiry: callback form → email ---------- */
    if (pathname === '/enquiry') {
      const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
      const name = clean(body.name, 120);
      const phone = clean(body.phone, 40);
      const careType = clean(body.careType, 120);
      if (body.honey) return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'content-type': 'application/json' } }); // spam bot
      if (!name || !phone) {
        return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: cors });
      }
      const fsResp = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://www.astrocare.com.au',
          Referer: 'https://www.astrocare.com.au/',
          'User-Agent': 'Mozilla/5.0 (compatible; AstrocareEnquiryRelay/1.0)',
        },
        body: JSON.stringify({
          _subject: `Callback request: ${name}`,
          _template: 'table',
          Name: name,
          Phone: phone,
          'Help needed with': careType || '(not specified)',
          Page: clean(body.page, 200) || 'astrocare.com.au',
        }),
      });
      const detail = await fsResp.text();
      // "needs Activation" means the relay works but its one-time email
      // confirmation hasn't been clicked yet — don't fail the visitor.
      const ok = fsResp.ok && (/"success"\s*:\s*"?true/i.test(detail) || /activation/i.test(detail));
      if (!ok) console.log('formsubmit error', fsResp.status, detail.slice(0, 200));
      return new Response(JSON.stringify(ok ? { ok: true } : { error: 'relay' }), {
        status: ok ? 200 : 502,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({
        reply: "You've asked quite a few questions this hour — to keep the service free for everyone we pause here for a little while. Leave your details on the [callback form](/#contact) and a real person will ring you back, or try again shortly. 💚",
        suggestions: [],
      }), { headers: { ...cors, 'content-type': 'application/json' } });
    }

    // Trim and sanitise the conversation the widget sends us.
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return new Response(JSON.stringify({ error: 'no user message' }), { status: 400, headers: cors });
    }

    const callAnthropic = (msgs) =>
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: 'web_search_20250305',
              name: 'web_search',
              max_uses: 3,
              user_location: { type: 'approximate', country: 'AU', timezone: 'Australia/Sydney' },
            },
          ],
          messages: msgs,
        }),
      });

    let msgs = messages;
    let data;
    // The server-side search loop can pause (`pause_turn`); resume up to twice.
    for (let attempt = 0; attempt < 3; attempt++) {
      const apiResp = await callAnthropic(msgs);
      if (!apiResp.ok) {
        const detail = await apiResp.text();
        console.log('anthropic error', apiResp.status, detail.slice(0, 300));
        return new Response(JSON.stringify({ error: 'upstream' }), { status: 502, headers: cors });
      }
      data = await apiResp.json();
      if (data.stop_reason !== 'pause_turn') break;
      msgs = [...msgs, { role: 'assistant', content: data.content }];
    }

    // Assemble the reply text and collect cited sources as markdown links.
    const parts = [];
    const sources = new Map(); // url -> title
    for (const block of data.content || []) {
      if (block.type !== 'text') continue;
      parts.push(block.text);
      for (const c of block.citations || []) {
        if (c.url && !sources.has(c.url)) sources.set(c.url, c.title || c.url);
      }
    }
    let text = parts.join('').trim();

    // Pull out the SUGGESTIONS line → tappable follow-up chips.
    let suggestions = [];
    const sm = text.match(/\n?SUGGESTIONS:\s*([^\n]+)\s*$/i);
    if (sm) {
      suggestions = sm[1].split('|').map((x) => x.trim()).filter((x) => x && x.length <= 60).slice(0, 3);
      text = text.replace(sm[0], '').trim();
    }

    // Append any cited sources the model didn't already link inline.
    const missing = [...sources].filter(([url]) => !text.includes(url));
    if (missing.length) {
      const links = missing
        .slice(0, 4)
        .map(([url, title]) => `[${title.slice(0, 80)}](${url})`)
        .join(' · ');
      text += `\n\nSources: ${links}`;
    }

    return new Response(JSON.stringify({ reply: text, suggestions }), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  },
};
