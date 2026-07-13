# SajuTH Web App — ดวงซาจู

The self-reading web app (사주 자가진단 웹) — the "사주아이 본체" for the Thai
market. Covers PLAN.md Phase 1, Steps 8–13.

User flow: enter birth date/time → Four Pillars (사주팔자) are computed → a
Thai-language report is returned. Free sections hook the user; premium sections
are blurred behind a DM/PromptPay paywall.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **lunar-javascript** — validated 만세력 (절기 month boundaries, 子시 rollover)
- Thai font: Noto Sans Thai

## Architecture

```
src/lib/saju.ts        만세력 engine — birth → Four Pillars
                       + true-solar-time (진태양시) longitude correction
                       + five-element (오행) distribution
src/lib/interpret.ts   Chart → Thai report sections (template layer;
                       Claude rewrite happens on top in production)
src/app/api/saju/      POST endpoint: compute + interpret
src/app/page.tsx       Thai input form + result view with paywall
src/lib/saju.test.ts   Regression snapshots (confirm vs 천을귀인 → 99%+)
```

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:saju    # verify the engine
npm run build
```

## What's stubbed (next steps)

- **Interpretation copy** is first-pass Thai — refine with a native editor /
  Claude rewrite (PLAN.md 6.3).
- **Verification**: expand `saju.test.ts` to ~100 cases confirmed against the
  천을귀인 app (PLAN.md 6.2), targeting 99%+ match.
- **Payment**: locked sections currently link to Instagram DM. Wire PromptPay
  QR (Phase 0) → Omise (Phase 1).
- **Persistence**: results are ephemeral. Add Supabase + shareable
  `/result/:id` URLs for the viral share loop that carried 사주아이.
- **Claude API**: connect for on-the-fly natural Thai prose over the templates.
