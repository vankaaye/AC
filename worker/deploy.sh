#!/usr/bin/env bash
# ------------------------------------------------------------------
# One-shot deploy for the Astro Care AI chat proxy.
#
# Secrets are passed via environment variables and are NEVER written
# to this repository:
#
#   CLOUDFLARE_API_TOKEN=<token> ANTHROPIC_API_KEY=<key> ./deploy.sh
#
# The Cloudflare token needs the "Edit Cloudflare Workers" template
# permissions (dash.cloudflare.com -> My Profile -> API Tokens).
# ------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (Edit Cloudflare Workers template)}"
: "${ANTHROPIC_API_KEY:?Set ANTHROPIC_API_KEY (from console.anthropic.com)}"

echo "==> Storing the Anthropic key as a Cloudflare secret (server-side only)"
printf '%s' "$ANTHROPIC_API_KEY" | npx --yes wrangler secret put ANTHROPIC_API_KEY

echo "==> Deploying the worker"
npx --yes wrangler deploy | tee /tmp/wrangler-deploy.log

URL=$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' /tmp/wrangler-deploy.log | tail -1 || true)
echo
echo "==> Done. Worker URL: ${URL:-check the output above}"
echo "    Next: set AI_ENDPOINT to this URL in src/components/ChatWidget.astro"
