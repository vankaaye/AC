# Astro Care AI chat — switch-on guide

The website chat currently answers from a built-in list. To make it a
full AI helper (answers anything about aged care), deploy this tiny
proxy and paste its URL into the widget. Total time: ~5 minutes.
Estimated running cost with Claude Haiku: a few dollars per month at
typical small-business traffic.

## What you need
1. An **Anthropic API key** — create at https://console.anthropic.com
   (Billing → add a payment method, then API Keys → Create Key).
2. A **free Cloudflare account** — https://dash.cloudflare.com/sign-up

## Deploy
```bash
cd worker
npm install -g wrangler
wrangler login                        # opens browser to authorise
wrangler secret put ANTHROPIC_API_KEY # paste the key when prompted
wrangler deploy                       # prints your worker URL
```

## Connect the website
In `src/components/AccessibilityToggle.astro`'s sibling
`src/components/ChatWidget.astro`, set:

```js
var AI_ENDPOINT = 'https://astrocare-chat.<your-subdomain>.workers.dev';
```

Commit and push — done. If the AI is ever unreachable, the chat
automatically falls back to the built-in answers, so it never breaks.

## Guardrails already built in
- API key lives only in Cloudflare, never in the browser
- CORS locked to astrocare.com.au
- Conversations trimmed (last 12 turns) and answers capped in length
- System prompt: plain English, aged-care scope, no personal medical
  advice, no invented business facts
