# Saju Thai — mini-site

A Korean Four-Pillars (사주팔자) calculator aimed at Thai readers, with English
toggle. Designed to be linked from an Instagram bio. The core computations
match the Korean **포스텔러 / 천을귀인 만세력** apps:

- Four pillars (년/월/일/시) with stems, branches, 지장간, 십성, 12운성
- Auspicious stars — 천을귀인, 문창귀인, 학당귀인, 역마살, 도화살, 화개살
- Great-luck cycles (대운) with direction and start age
- True-solar-time correction per birth city (e.g. Bangkok ≈ −22 min vs KST)

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r minisite/requirements.txt
streamlit run minisite/app.py
```

## Deploy to Streamlit Community Cloud (free)

1. Push this repo to GitHub.
2. Go to [streamlit.io/cloud](https://streamlit.io/cloud) → *New app*.
3. Main file: `minisite/app.py`.
4. Python 3.11+; Streamlit picks up `minisite/requirements.txt` automatically
   (or move it to repo root if the platform prompts you).
5. Resulting URL looks like `https://<name>.streamlit.app` — paste that into
   the Instagram bio.

## Project layout

```
minisite/
├── app.py                 Streamlit UI
├── saju/
│   ├── engine.py          compute_saju() — orchestrates everything
│   ├── tables.py          stems / branches / ten-gods / 12 stages dictionaries
│   ├── nobles.py          auspicious-star tables + compute_nobles()
│   └── correction.py      true-solar-time + KST reference shift
├── data/
│   ├── cities.py          curated Thai + Korean + ASEAN city database
│   └── i18n.py            EN / TH UI strings
└── requirements.txt
```

## Notes on calculation

- Uses `lunar_python` for the base calendar + ganzhi resolution, then overrides
  hidden stems with the full classical 초기/중기/정기 table used by Korean apps.
- True-solar-time correction: `(city_longitude − standard_meridian) × 4 min`.
  Then a second shift moves the clock to the KST (135° E) reference so the
  ganzhi match what a Korean manseryeok would report.
- Daewoon direction: yang-year male or yin-year female → forward; otherwise
  backward. Starting age is from `lunar_python`'s Yun API which implements the
  classical 3-day-per-year rule relative to the nearest 절기.

## Roadmap

- [ ] Paid-tier hand-off to astro-seek synastry chart
- [ ] Korean & Japanese UI toggles
- [ ] Share-ready image export for Instagram stories
