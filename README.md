# SajuTH — Duang Saju (ดวงซาจู)

Korean-style saju content pipeline for a Thai Instagram audience.
See [PLAN.md](./PLAN.md) for the full product & business plan.

## Pipeline

```
discover  →  theme pick  →  gather  →  synthesize  →  render  →  publish
(hashtag +   (cadence-     (rank by    (Claude:       (PIL       (IG Graph
 seed accts)  aware rota.)  keyword)    theme + N      carousel)   API)
                                        sources → TH)
```

See [CONTENT_STRATEGY.md](./CONTENT_STRATEGY.md) for the content approach.

## Layout

```
collector/   Pull posts from whitelisted Korean accounts
rewriter/    Claude-powered Korean → Thai slide rewriting
imagegen/    PIL-based carousel renderer
publisher/   Instagram Graph API publisher
scripts/     Orchestration entry points
data/        Local JSON / image artifacts (gitignored)
assets/      Fonts and static assets (checked in)
```

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in ANTHROPIC_API_KEY etc.
```

### Fonts

Place Noto Sans Thai font files in `assets/fonts/`:

- `NotoSansThai-Regular.ttf`
- `NotoSansThai-Bold.ttf`

Download from https://fonts.google.com/noto/specimen/Noto+Sans+Thai.

## Run

Each stage independently:

```bash
python -m collector.instagram_collector   # pull from seed accounts
python -m collector.discovery             # pull from Korean saju hashtags
python -m rewriter.synthesizer            # pick theme + synthesize Thai post
python scripts/daily_run.py               # full dry-run pipeline
python scripts/daily_run.py --skip-discovery    # reuse existing collected posts
python scripts/daily_run.py --publish     # actual IG publish (needs hosted images)
```

## Status

Phase 0 — skeletons in place. Next: wire real credentials, fetch 3-5 test posts,
tune Thai rewrite prompt, and validate slide rendering with Thai fonts.
