/**
 * Astro Care — AI chat proxy (Cloudflare Worker)
 * ------------------------------------------------------------------
 * Sits between the website chat widget and the Anthropic API so the
 * API key never reaches the browser.
 *
 *   Browser  →  POST /chat  →  this Worker  →  api.anthropic.com
 *
 * Deploy (one-time, ~5 minutes):
 *   1. Free Cloudflare account → install wrangler (`npm i -g wrangler`)
 *   2. `wrangler secret put ANTHROPIC_API_KEY`   (paste the key)
 *   3. `wrangler deploy`                          (from this folder)
 *   4. Put the printed URL into AI_ENDPOINT in ChatWidget.astro
 *
 * Safety rails:
 *   - CORS locked to astrocare.com.au origins
 *   - Conversation trimmed to the last 12 turns, 2,000 chars each
 *   - max_tokens capped; system prompt keeps answers on-topic,
 *     plain-English, and never gives personal medical advice
 * ------------------------------------------------------------------
 */

const ALLOWED_ORIGINS = [
  'https://www.astrocare.com.au',
  'https://astrocare.com.au',
  'http://localhost:4321', // astro dev
];

const SYSTEM_PROMPT = `You are "Astro", the friendly chat helper on astrocare.com.au — the website of Astro Care Group Pty Ltd (ABN 99 700 192 981), an Australian health-care provider whose first service line is aged care and support at home.

Your job: answer questions about aged care in Australia and about Astro Care, in warm, plain English an 80-year-old would enjoy reading. Keep answers short (2–5 sentences), use everyday words, and be honest when unsure.

Facts about Astro Care you may state:
- Services: clinical/nursing care, social support, domestic assistance, meal preparation — delivered at home.
- Phone 1800 ASTRO (1800 278 762), Mon–Fri 8am–6pm, Sat 9am–4pm; care itself runs 24/7. Email info@astrocare.com.au.
- Fees: 15% care management + 10% package management, within government caps; a fee calculator lives at /#pricing.
- Funding guidance lives at /#funding; the contact/callback form at /#contact.

You know Australian aged-care topics: My Aged Care, assessments (Single Assessment System, formerly ACAT/RAS), Home Care Packages, the Support at Home program that is replacing Home Care Packages, CHSP, respite, dementia support, NDIS, residential care basics, carer support.

Rules:
- Never give personal medical, legal or financial advice — suggest calling 1800 ASTRO or seeing a GP for anything personal.
- Never invent Astro Care facts (locations, staff names, prices) beyond those above.
- If asked something unrelated to health/aged care or Astro Care, gently steer back or suggest the phone line.
- Plain text only: no markdown headings or bullets longer than a short list; no emojis.`;

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
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/chat') {
      return new Response('Not found', { status: 404, headers: cors });
    }
    if (!corsOk) return new Response('Forbidden', { status: 403, headers: cors });

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: cors });
    }

    // Trim and sanitise the conversation the widget sends us.
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return new Response(JSON.stringify({ error: 'no user message' }), { status: 400, headers: cors });
    }

    const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!apiResp.ok) {
      const detail = await apiResp.text();
      console.log('anthropic error', apiResp.status, detail.slice(0, 300));
      return new Response(JSON.stringify({ error: 'upstream' }), { status: 502, headers: cors });
    }

    const data = await apiResp.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  },
};
