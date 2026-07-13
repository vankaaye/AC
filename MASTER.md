# Astro Care — Master Document

**The single source of truth for the astrocare.com.au website project.**
Everything we've built, how it works, what's decided, what's pending, and a
run sheet of every change — so anyone can pick this up cold.

*Last updated: 12 July 2026 (evening)*

---

## 1. The business

| | |
|---|---|
| Trading name | **Astro Care Group Pty Ltd** |
| ABN | 99 700 192 981 |
| Business | Health care at home — starting with aged care (Support at Home / HCP / CHSP) |
| Website | https://www.astrocare.com.au |
| Phone (site-wide) | 1800 ASTRO (1800 278 762) |
| Email | info@astrocare.com.au |
| Note | "Astro" is a brand name only — branding speaks to health care broadly, not stars, not aged-care-only |

## 2. How the website works (architecture)

```
GitHub repo (vankaaye/AC)
   └─ push to main ──► GitHub Actions (.github/workflows/deploy.yml)
                          └─ npm run build ──► GitHub Pages
                                                 └─ www.astrocare.com.au (public/CNAME)

Website chat widget ──► Cloudflare Worker (astrocare-chat.astrocare.workers.dev)
                           └─ Anthropic API (Claude Haiku) — key stored ONLY in Cloudflare
```

- **Framework:** Astro 5 (static site) + Tailwind CSS 4. Source in `src/`, builds to `dist/`.
- **Deploys automatically** on every push to `main` — live in ~2–3 minutes. No manual step.
- **Custom domain:** `public/CNAME` = `www.astrocare.com.au`. (GitHub Settings → Pages must also say `www.astrocare.com.au` for www to stick in the address bar.)
- **AI chat:** the widget calls a tiny Cloudflare Worker proxy (`worker/`), which calls Claude. If the AI is unreachable, the chat falls back to built-in answers automatically — it never goes silent.

## 3. Key files — where to change what

| Want to change… | Edit this |
|---|---|
| Header, footer, help bar, phone number | `src/layouts/Layout.astro` |
| Homepage content (hero, services, funding, contact) | `src/pages/index.astro` |
| Fee calculator numbers (15% / 10% fees, subsidy levels) | `src/components/PricingCalculator.astro` |
| Chat: built-in answers / AI endpoint | `src/components/ChatWidget.astro` |
| Accessibility panel (text size, contrast, read aloud) | `src/components/AccessibilityToggle.astro` |
| Colours, fonts, design tokens | `src/styles/global.css` |
| Browser-tab logo (favicon) | `public/favicon.svg` |
| AI behaviour, tone, guardrails | `worker/chat-worker.js` (then redeploy worker) |

## 4. Pages on the site

| URL | What it is | Status |
|---|---|---|
| `/` | The live website (Version 3 — modern slate & blue) | **LIVE** |
| `/brand` | Logo chooser: 350 numbered options + 30 taglines | Design studio |
| `/hero` | Hero background chooser: 30 numbered images (H1–H30) | Design studio |
| `/test1` | Design concept: Apple-style white minimal with animations | Concept |
| `/test2` | Design concept: corporate light (ktechify style) | Concept |
| `/test3` | Design concept: Calm — Apple-style, phone-first (full-screen chat, working form) | Concept |
| `/test4` | Design concept: Commission — gov health design language (agedcarequality.gov.au style) | Concept |
| `/versions` | Index of every design version, with restore info | Reference |

Full restore instructions and commit hashes: see `VERSIONS.md`.

## 5. Decisions made

| Decision | Choice | Where |
|---|---|---|
| Live design direction | **Version 3 — Modern slate & blue**: ocean-blue/slate palette, compact 16px UI, Schibsted Grotesk + Instrument Sans, professional-carers-only footage, WCAG hero pause control. Designed for adult-children researchers (per deep research). v2 archived `fac7429`, v1 archived `f64d649`. | `/` |
| Logo | **No. 181** — Monogram "A" with heartbeat crossbar, Eucalyptus colourway | Header, footer, favicon |
| Accessibility bar | WCAG 2.2 AAA target: 20px+ base text, 200% text toggle, high contrast, read aloud, 56px targets | Site-wide |
| Voice | Plain Australian English, warm, no invented facts, no fake reviews (new business) | Site-wide |
| Help persona | Generic "We're here to help" (no invented staff names) | Help bar & chat |
| AI model | Claude Haiku (claude-haiku-4-5) — fast, ~a few $/month at small-business traffic | Worker |

## 6. Decisions still pending (your picks)

- [ ] **Tagline** — pick T1–T30 from `/brand` (footer currently shows "Where every day shines" as placeholder)
- [ ] **Hero background image** — pick H1–H30 from `/hero`
- [ ] **Final logo confirmation** — No. 181 in use "for now"; confirm or pick another from `/brand`
- [ ] **GitHub Pages domain setting** — change to `www.astrocare.com.au` in repo Settings → Pages so "www" always shows (owner-only setting)

## 7. Enquiries (callback form)

- Both callback forms (live site `/#contact` and `/test3`) deliver by email via [FormSubmit](https://formsubmit.co) — a free relay, no account needed (temporary setup).
- **Currently delivering to gopi@ktechify.com directly.** Discovered 12 Jul: astrocare.com.au has **no MX records** — the domain cannot receive email at all yet, so info@astrocare.com.au bounces and the intended alias doesn't exist.
- [ ] **TODO (owner):** set up free email forwarding in GoDaddy (both domains use GoDaddy DNS): GoDaddy → Domain → Email Forwarding → create `info@astrocare.com.au` → `gopi@ktechify.com` (GoDaddy adds the MX records). Then we switch the forms to info@ (one-line change + one activation click).
- [ ] **TODO (owner):** click the FormSubmit **"Activate Form"** email sent to gopi@ktechify.com — enquiries flow only after this one click. Check spam/junk if missing.
- Spam protection: hidden honeypot field. Delivery failure shows the visitor a fallback message with email + phone.
- Note: FormSubmit blocks calls relayed from Cloudflare Workers, so forms post to it directly from the browser (address assembled at runtime to deter scrapers).

## 8. AI chat — operations guide

- **Worker URL:** `https://astrocare-chat.astrocare.workers.dev` (Cloudflare account: gopi_kv2004@yahoo.com)
- **Secrets:** the Anthropic API key lives ONLY in Cloudflare (Workers & Pages → astrocare-chat → Settings → Variables and Secrets). **Never put keys in this repo.**
- **Rotate the API key:** create a new key at console.anthropic.com → update the `ANTHROPIC_API_KEY` secret in the Cloudflare dashboard → delete the old key.
- **Redeploy the worker** (after editing `worker/chat-worker.js`):
  `CLOUDFLARE_API_TOKEN=<token> ANTHROPIC_API_KEY=<key> ./worker/deploy.sh` (see `worker/README.md`)
- **Costs:** Anthropic — pay-per-use, a few dollars/month expected; Cloudflare — free tier (100k requests/day).
- **Web search:** the AI can search the internet (health-care topics only, max 3 searches per answer, Australian results) and cites sources as clickable links. Anthropic charges US$10 per 1,000 searches on top of normal usage — still expected to total a few dollars/month.
- **Tone:** answers fully in chat; points to the callback form (/#contact) rather than pushing phone calls (no 24/7 line yet).
- **Guardrails built in:** health-care scope (won't search or answer off-topic), plain English, no personal medical advice, no invented business facts or numbers, conversation trimmed to last 12 turns, answers capped, CORS locked to astrocare.com.au.
- **Kill switch:** set `AI_ENDPOINT = ''` in `src/components/ChatWidget.astro` and push — chat instantly reverts to built-in answers only.

## 9. Run sheet — everything done so far

| Date | What happened | Commit |
|---|---|---|
| 30 Jun 2026 | Repo created; first "Thrive Aged Care" single-page site | `0d0cd7e` |
| 30 Jun 2026 | GitHub Pages auto-deploy pipeline set up and fixed | `46825fc`–`287fa7d` |
| 11 Jul 2026 | Rebrand to **Astro Care Group Pty Ltd**, correct ABN, contact email, custom domain CNAME | `6bb9f34`–`ab5fde7` |
| 11 Jul 2026 | Full revamp v1: midnight navy & gold "constellation" design | `44773a3` |
| 11 Jul 2026 | Aged-care-focused rebuild of content and identity | `4307df6` |
| 11 Jul 2026 | Start-over v2: warm teal/coral design | `c9fbf22` |
| 12 Jul 2026 | Senior-first redesign: 24px+ text, size toggle, HCP/CHSP guide | `ef6558f` |
| 12 Jul 2026 | **Rebuilt on Astro + Tailwind** with WCAG 2.2 AAA framework (current platform) | `16367f6` |
| 12 Jul 2026 | Mobile sizing fixes; `/brand` chooser page; chat helper widget | `7a3c87d` |
| 12 Jul 2026 | Mobile card readability; chat layout; generic help bar; removed fake reviews | `41b6b2b` |
| 12 Jul 2026 | Brand reworked to health-care-wide (star concept dropped) | `7ee9b6a` |
| 12 Jul 2026 | Brand chooser: 10 colourways = 200 options; authentic tagline rewrite | `f5f3761` |
| 12 Jul 2026 | Monogram-A studio added: options 201–350 | `1e98b80` |
| 12 Jul 2026 | **Logo No. 181 adopted** (header, footer, browser tab) | `f4f0387` |
| 12 Jul 2026 | Design concept Test 1 (white minimal + animations); `/versions` index | `ef8c342` |
| 12 Jul 2026 | Version tracking (`VERSIONS.md`); AI chat scaffolding (worker + widget wiring) | `9712402` |
| 12 Jul 2026 | `/hero` chooser (30 images); Test 2 concept (ktechify style); smarter chat answers | `2157a7e` |
| 12 Jul 2026 | One-shot worker deploy script | `98522b9` |
| 12 Jul 2026 | **AI chat switched ON** — worker deployed to Cloudflare, tested live, widget connected | `15e41cf` |
| 12 Jul 2026 | `MASTER.md` created (this file) | `ba00b4d` |
| 12 Jul 2026 | **AI upgraded: internet search + sources** — answers budget/eligibility-type questions fully with cited links; callback form promoted over phone calls; chat renders links & bold properly | `e42f425` |
| 12 Jul 2026 | **Callback form now emails info@astrocare.com.au** (FormSubmit relay — one-time activation email must be clicked); live chat goes full-screen on phones; new concept `/test3` Calm (Apple-style, phone-first) | `84e15e9` |
| 12 Jul 2026 | Chat: voice dictation mic, rich formatting (tables/bold/emoji), links fixed; enquiries temporarily to gopi@ktechify.com (no MX on astrocare.com.au) | `56b1308` |
| 12 Jul 2026 | **Hero video** — 13s montage of support workers with a client, from one professional Pexels shoot; service-card photos upgraded to matching stills | `f64d649` |
| 12 Jul 2026 | New concept `/test4` "Commission" — agedcarequality.gov.au-style: purple brand band, "I want to…" task tiles, alert banner, updates list, formal gov footer | (this commit) |
| 12 Jul 2026 | **Media quality overhaul**: hero rebuilt at native 1080p from a single cohesive Pexels shoot (uniformed carer + elderly couple, luxury interiors — greeting, consult, flowers, reassurance; branded "DONATE" props found in one scene and cut), social loop upgraded to 1080p, all encodes high-bitrate. Note: free libraries cap at 1080p (Mixkit 720p, this Pexels shoot 1080p) — true 4K needs paid stock (~$50-100/clip, iStock/Getty) | (this commit) |
| 12 Jul 2026 | **Rich-interaction pass**: scroll-linked media zoom on every video tile (ktechify-style), live video thumbnails on the 3 "How it works" steps, "Everything in one place" resources hub (8 official links: My Aged Care, eligibility checker, Support at Home, Services Australia, Carer Gateway, Dementia Australia, Quality Commission, OPAN); chat made mobile-first: slim header, no keyboard popup on open, small two-row chips, **AI now returns 3 tappable follow-up suggestions after every answer** | (this commit) |
| 12 Jul 2026 | v3 polish: media re-encoded at native 720p high quality (sharper), stronger scroll animations (blur+rise reveals, hero parallax, stats count-ups), whole service/funding tiles clickable, labelled "Chat with us" pill restored above the accessibility button | (this commit) |
| 12 Jul 2026 | **Design v3 "Modern slate & blue" goes LIVE** — owner feedback revamp: green/gold retired for ocean-blue + slate, everything compacted (16px body, slim header, small floating buttons), nav visible on desktop widths, professional-carers-only footage (no family/kid clips, no camera-stares), WCAG pause button on hero video. Research findings applied: design for adult-children researchers; fee transparency stays front and centre. | (this commit) |
| 12 Jul 2026 | **DESIGN v2 "AU Modern" goes LIVE** — full redesign in the Australian style (per owner's samples: My Aged Care, health.gov.au, Regis): full-bleed hero video (older couple in park, nurse helping, family hug, home visit — Mixkit free commercial licence), ambient care videos in all four service cards, scroll-reveal animations, Figtree type at normal sizes, slim hide-on-scroll glassy nav, My Aged Care-blue funding band, floating chat button. v1 archived at `f64d649`. | (this commit) |
| 13 Jul 2026 | **Owner punch list #2** — header now stays visible while scrolling (was hide-on-scroll); accessibility launcher recoloured amber so it stands out; amber "Ask our AI helper — instant answers" button added to the Contact section; VR-headset divider replaced with a crisp consult scene (7475237 later window); calculator card halved in visual size (duplicate heading/intro removed, compact controls) and every package level now shows a real-life example of what it covers; the same "what that looks like" examples added to the three funding cards; logo fixes — sharper 256px My Aged Care mark, ACQSC's real favicon (gov.au green "g"), Eligibility checker gets its own check icon instead of duplicating My Aged Care's. | (this commit) |
| 13 Jul 2026 | **iPhone playback + media quality fixes** (owner: "quality bad, no animations, videos not playing") — every ambient video now carries the `autoplay` attribute (the only way iOS Safari reliably starts them; JS `play()` alone was being refused) with a retry-on-canplay fallback, and playback no longer disabled by Reduce Motion (reveals/Ken Burns still respect it, as they should). Media re-encoded sharper and bigger: clinical card now a TRUE 4K source (blood-pressure monitor close-up, Pexels 8088983), meals now 4K dish-handover (7963171), first divider now 4K couple health-check (8088986), service loops up to 1440×810, steps to 1280×720, dividers to 1920×1080, remaining 720p Mixkit sources upscaled with sharpening. Note: if reveals still look absent on the owner's iPhone, check Settings → Accessibility → Motion → Reduce Motion — when it's on, the site correctly shows everything without animation. | (this commit) |
| 13 Jul 2026 | **ktechify-style animation pass + hero videos woven through the page** — three full-bleed animated video divider bands added between sections (flowers visit, mobility support, plain-English consult) with drifting Ken Burns motion; media tiles now drift on three varied Ken Burns paths (scale up to 1.2, ktechify-strength); service cards and contact columns slide in from left/right; funding cards take turns in a self-playing spotlight (Stripe-style auto-cycle, pauses on hover). Groceries clip (7475251) cut everywhere — close-up review found the same "DONATE"-branded props the owner rejected before; `/hero-videos` now lists 10 clean candidates. | (this commit) |
| 12 Jul 2026 | **12-item fix batch + `/hero-videos` chooser** — steps 1 & 2 videos replaced (care-bed and paperwork clips swapped for sit-down chat + tablet consult, matching the shoot style); calculator fits phones; real organisation logos on all 8 resource tiles; heartbeat in logo now gold and bolder (header, footer, favicon); whole sections reveal on scroll + gentle Ken Burns drift on every media tile; in-page links update the URL (`/#fees` etc.) and the back button returns correctly; desktop chat text reduced; AI answers now default to tables + emoji-keyed bullets + indented sub-points (worker redeployed, tested live); chat scrolls to the START of each answer; footer contrast lifted. New **`/hero-videos`**: 12 autoplaying candidates (V1–V12, current hero marked) — owner picks a V-number. | (this commit) |

## 10. How to work with this site (quick recipes)

- **See any change live:** edit → commit → push to `main` → wait 2–3 minutes.
- **Restore an old design:** find its commit in `VERSIONS.md` → `git checkout <commit> -- src/ public/` → commit & push.
- **Pick a logo/tagline/hero:** browse `/brand` or `/hero` on the live site, then just say the number (e.g. "logo 181", "hero H19", "tagline T7").
- **Update this document:** whenever something meaningful changes, add a run-sheet row and update the pending list. Keep it honest — this file is the memory of the project.
