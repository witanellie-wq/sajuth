# Content Strategy — Duang Saju (ดวงซาจู)

> Research findings + content generation approach for the Thai market.
> Last updated: 2026-04-22

---

## 1. Market Research Findings

### 1.1 Korean Saju on Global Social (2024–2026)

Saju (사주) is having a global viral moment, driven by:

- **TikTok creators teaching saju to non-Koreans** — `@ahnestkitchen` (Sarah Ahn),
  `@jewelsjpj` (Jewel), `@tingssam`, `@jiyongskorean`. They already figured out how to
  package 4-pillar content for audiences without Korean cultural context.
- **"Saju is the new MBTI" framing** — SJPJ (Saju Palja) personality types resonate with
  Gen Z used to personality-test content.
- **ChatGPT Saju prompt trend** — viral how-to videos teaching people to use AI for
  their own reading. Lowers the barrier, raises curiosity.
- **Short format dominates** — 15–90s Reels/Shorts with hook + single insight + CTA.

> **Implication**: the "non-Korean audience saju explainer" format is pre-validated.
> We're not inventing — we're porting it to Thai.

### 1.2 Thailand Market Context

- Thailand already has massive `ดูดวง` (duang / fortune-telling) culture via
  Thai astrology, tarot, moo-bin (numerology).
- **"ดูดวงเกาหลี" (Korean-style fortune) is a near-empty niche on Thai IG/TikTok** —
  no single dominant creator. Blue ocean.
- Korean culture (K-pop, K-drama) = premium in Thailand → "한국식 사주" carries
  automatic prestige.
- Thai audience overlaps with K-pop fandom demographics (20–35F).

### 1.3 Viral Content Formats (to steal)

| Format | Example | Why it works |
|---|---|---|
| Day Master archetype | "You're a Yang Fire person — here's what that means for love" | Self-diagnostic, shareable |
| Compatibility drop | "These 2 Day Masters have explosive chemistry" | Tag-a-friend bait |
| Missing element | "You don't have Water — here's how to balance" | Actionable, specific |
| Monthly forecast | "April's vibe for each Day Master" | Recurring, habit-forming |
| Myth-busting | "No, your saju doesn't mean you'll divorce" | Controversial, engagement |
| Celebrity saju breakdown | "Lisa's saju explained" | Traffic from fandom |

---

## 2. Content Generation Approach: Multi-Source Synthesis

### Old (v0): 1-to-1 translation
```
korean_post → thai_translation → publish
```
Problem: legal grey zone, quality tied to one source, limited variety.

### New (v1): Theme-driven synthesis
```
theme (from library, rotating)
    + 3-5 relevant source snippets (multi-platform, multi-creator)
    + Claude synthesizer
    → original Thai post
```

### Why this is better
- **Legal**: synthesis of multiple sources + original expression is fair use.
- **Quality**: not bottlenecked by any single creator's post quality.
- **Variety**: theme rotation prevents the "all posts look the same" trap.
- **Defensibility**: the actual output is original — can't be DMCA'd.
- **Scalable**: once the theme library is rich, content never runs out.

---

## 3. Theme Library (Phase 0 Seed)

Categorized for rotation scheduling:

### A. Identity / "Know Yourself" (high shareability)
1. Day Master archetypes × 10 (甲乙丙丁戊己庚辛壬癸)
2. Missing element diagnosis
3. 5-element balance reading
4. SJPJ-style type framing ("the new MBTI")

### B. Love / Compatibility (highest DM conversion)
1. Day Master × Day Master attraction
2. Red flag combos
3. Ideal partner element
4. Breakup-recovery timing

### C. Career / Money (evergreen)
1. Best industries by Day Master
2. Wealth element (재성) explainer
3. Career pivot timing
4. Boss vs freelancer fit

### D. Timing / Seasonal (recurring habit-builder)
1. Monthly energy shift (매월 발행)
2. Year-in-review / year-ahead
3. Lunar new year specials
4. Birthday month deep-dive

### E. Culture / Myth-busting (trust-building)
1. "Saju ≠ destiny" explainer
2. Saju vs Western astrology
3. How saju compares to Thai astrology
4. Common misconceptions

---

## 4. Source Tiering

Sources are tiered by language and purpose:

### Tier A — Korean primary sources (breadth)
Korean-language saju accounts on IG. Collected via hashtag crawl:
`#사주`, `#운세`, `#신년운세`, `#오늘의운세`, `#사주팔자`, `#일간`, `#오행`.

We extract **concepts and angles**, not verbatim text.

### Tier B — Cross-cultural primary sources (gold)
English-language saju educators who already packaged the concepts for
non-Korean audiences. Closest to our target format:

- `@ahnestkitchen` (TikTok/IG)
- `@jewelsjpj` (TikTok/IG)
- `@tingssam` (TikTok/IG)
- `@jiyongskorean` (TikTok/IG)
- `sajumuse.com` blog

### Tier C — Thai reference (tone)
Popular Thai astrology/tarot creators — we study their **tone, emoji use,
caption length, CTA style** but never copy topics.

To be filled in as we discover them. Initial seed accounts to research:
search `#ดูดวงวันนี้` `#โหราศาสตร์` on IG/TikTok, sort by engagement.

---

## 5. Automation Target

```
cron daily:
  1. discovery.discover_hashtag_posts()   → pull new Tier-A posts
  2. themes.pick_today()                  → rotate theme queue
  3. sources.gather_for_theme(theme, n=4) → assemble source snippets
  4. synthesizer.synthesize(theme, src)   → Thai original draft
  5. qa.check(draft)                      → banned terms, length, sanity
  6. imagegen.render(draft)               → 1080×1350 slides
  7. publisher.publish(draft, images)     → IG Graph API
```

Human-in-the-loop for Phase 0: step 5 gets a Telegram ping with draft
preview for manual approval before publish. Full auto in Phase 1.
