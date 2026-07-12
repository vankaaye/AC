# Astro Care — design version history

Every design direction lives at its own URL and maps to a git commit,
so any version can be restored exactly with:
`git checkout <commit> -- src/ public/` (or by reverting to the commit).

| Version | Status  | URL       | Commit    | Notes |
|---------|---------|-----------|-----------|-------|
| v3 — Modern slate & blue | **LIVE** | `/` | (this commit) | Complete revamp per owner: ocean-blue + slate palette (green/gold retired), Schibsted Grotesk + Instrument Sans, compact 16px UI designed for adult-children researchers, professional-carers-only footage (hero + 4 service loops, no family/kids clips), visible nav from 640px, quiet phone chip, small icon-only chat + accessibility buttons, WCAG pause control on hero video. |
| v2 — AU Modern | Archived | — | `fac7429` | White + petrol + eucalyptus teal, Figtree, full-bleed hero video with family/park clips, big CTAs. Restore: `git checkout fac7429 -- src/ public/`. |
| v1 — Sunny & senior-first | Archived | — | `f64d649` | Warm eucalyptus/sand/sunflower, 20px+ text, oversized senior-first UI, HCP-CHSP funding guide, fee calculator, chat helper, logo No. 181. Restore: `git checkout f64d649 -- src/ public/`. |
| Test 1 — White minimal + animations | Concept | `/test1` | `ef8c342` | Apple-inspired: primary white, oversized type, scroll reveals with blur, scroll-driven image zoom, parallax, count-ups, dark gradient-number CTA. |
| Test 2 — Corporate light (ktechify style) | Concept | `/test2` | `2157a7e` | White corporate, Space Grotesk, electric blue #1a56f0, photo hero, floating stats, marquee strip, gradient CTA. |
| Test 3 — Calm (Apple-style, phone-first) | Concept | `/test3` | (this commit) | Pure white, Apple system fonts, one green accent, phone-first spacing, full-screen chat sheet, real AI chat + working callback form. |

Earlier full-site iterations (before the Astro rebuild) also live in history:

| Design | Commit | Notes |
|--------|--------|-------|
| Static v3 — senior-first HTML | `41b6b2b` | Yellow/eucalyptus static HTML site with text-size toggle. |
| Static v2 — teal & coral "warm friendly" | `c9fbf22` | Rounded cards, pill buttons. |
| Static v1 — midnight navy & gold | `44773a3` | Dark premium "constellation" design. |
