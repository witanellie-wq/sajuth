"""Streamlit front-end for the Saju Thai mini-site.

Deployment target: Streamlit Community Cloud (free).  A single URL can be
linked from an Instagram bio and the app runs without user accounts.
"""

from __future__ import annotations

import sys
from datetime import date, datetime, time
from pathlib import Path

import streamlit as st

# Make sibling packages importable when Streamlit runs app.py directly.
sys.path.insert(0, str(Path(__file__).parent))

from data.cities import CITY_DB, cities_for_lang, get_city
from data.i18n import t
from saju import compute_saju
from saju.nobles import NOBLE_META
from saju.tables import (
    ELEMENTS,
    branch as branch_info,
    life_stage as life_stage_info,
    stem as stem_info,
    ten_god as ten_god_info,
)

st.set_page_config(page_title="Saju Thai", page_icon="☯", layout="centered")


# ── Language picker ────────────────────────────────────────────────────────
def _init_lang() -> str:
    if "lang" not in st.session_state:
        st.session_state["lang"] = "th"
    return st.session_state["lang"]


lang = _init_lang()
col_title, col_lang = st.columns([3, 1])
with col_title:
    st.title(t("app.title", lang))
    st.caption(t("app.subtitle", lang))
with col_lang:
    st.session_state["lang"] = st.selectbox(
        t("lang.label", lang),
        options=["th", "en"],
        format_func=lambda x: "ไทย" if x == "th" else "English",
        index=0 if lang == "th" else 1,
        label_visibility="collapsed",
    )
    lang = st.session_state["lang"]


# ── Input form ─────────────────────────────────────────────────────────────
st.header(t("form.header", lang))

with st.form("saju_form"):
    c1, c2 = st.columns([2, 1])
    with c1:
        name = st.text_input(t("form.name", lang), max_chars=40)
    with c2:
        gender_label = st.radio(
            t("form.gender", lang),
            options=["female", "male"],
            format_func=lambda g: t(f"form.gender.{g}", lang),
            horizontal=True,
        )

    c3, c4 = st.columns(2)
    with c3:
        birth_date = st.date_input(
            t("form.date", lang),
            value=date(1990, 1, 1),
            min_value=date(1900, 1, 1),
            max_value=date.today(),
        )
    with c4:
        unknown_time = st.checkbox(t("form.time.unknown", lang), value=False)
        birth_time = st.time_input(
            t("form.time", lang),
            value=time(12, 0),
            disabled=unknown_time,
            step=60,
        )
        if unknown_time:
            birth_time = time(12, 0)

    city_key = st.selectbox(
        t("form.city", lang),
        options=[k for k, _ in cities_for_lang(lang)],
        format_func=lambda k: dict(cities_for_lang(lang))[k],
        index=[k for k, _ in cities_for_lang(lang)].index("bangkok"),
    )

    submitted = st.form_submit_button(t("form.submit", lang), type="primary")


if not submitted:
    st.stop()


# ── Compute ────────────────────────────────────────────────────────────────
city = get_city(city_key)
local_dt = datetime.combine(birth_date, birth_time)
result = compute_saju(
    local_dt=local_dt,
    gender=gender_label,
    longitude=city["lon"],
    tz_offset_hours=city["tz_offset"],
)


# ── Profile summary ────────────────────────────────────────────────────────
st.markdown("---")
st.subheader(t("result.profile", lang))

city_label = city["th_name"] if lang == "th" else city["en_name"]
prof_cols = st.columns(2)
with prof_cols[0]:
    if name:
        st.markdown(f"**{name}** — {t(f'form.gender.{gender_label}', lang)}")
    st.markdown(f"**{t('result.local', lang)}:** {local_dt.strftime('%Y-%m-%d %H:%M')}  \n*{city_label}*")
    st.markdown(f"**{t('result.lunar', lang)}:** {result.lunar_date}")
with prof_cols[1]:
    st.markdown(
        f"**{t('result.corrected', lang)}:** {result.corrected_dt.strftime('%Y-%m-%d %H:%M')}"
    )
    st.markdown(
        f"**{t('result.solar_shift', lang)}:** {result.solar_shift_minutes:+d} {t('result.minutes', lang)}"
    )
    st.markdown(
        f"**{t('result.total_shift', lang)}:** {result.total_shift_minutes:+d} {t('result.minutes', lang)}"
    )

dm = stem_info(result.day_master)
dm_el = ELEMENTS[dm["element"]]
dm_el_label = dm_el["th"] if lang == "th" else dm_el["en"]
st.info(
    f"**{t('result.day_master', lang)}:** {result.day_master} ({dm['ko']} / {dm['roman']}) "
    f"— {dm['en']} · {dm_el_label} {dm_el['hanzi']}"
)


# ── Four Pillars grid ──────────────────────────────────────────────────────
st.subheader(t("pillars.header", lang))

pos_labels = {
    "year":  t("pillars.year", lang),
    "month": t("pillars.month", lang),
    "day":   t("pillars.day", lang),
    "hour":  t("pillars.hour", lang),
}

# Header row
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        st.markdown(f"<div style='text-align:center; color:#777; font-size:0.85em'>{pos_labels[p.position]}</div>",
                    unsafe_allow_html=True)

# Ten-god of stem (top row, like Posteller)
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        tg = ten_god_info(p.ten_god_stem)
        label = tg["th"] if lang == "th" else tg["en"]
        st.markdown(f"<div style='text-align:center; font-size:0.8em; color:#555'>{label}<br/><span style='font-size:0.75em; opacity:0.6'>{p.ten_god_stem}</span></div>",
                    unsafe_allow_html=True)

# Stem (big hanzi + Korean + romanization)
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        s = stem_info(p.stem)
        color = ELEMENTS[s["element"]]["color"]
        st.markdown(
            f"<div style='text-align:center; background:{color}22; border:2px solid {color}; "
            f"border-radius:10px; padding:10px 4px; margin:4px 0'>"
            f"<div style='font-size:2.2em; font-weight:700; color:{color}'>{p.stem}</div>"
            f"<div style='font-size:0.9em'>{s['ko']} · {s['roman']}</div>"
            f"</div>",
            unsafe_allow_html=True,
        )

# Branch
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        b = branch_info(p.branch)
        color = ELEMENTS[b["element"]]["color"]
        st.markdown(
            f"<div style='text-align:center; background:{color}22; border:2px solid {color}; "
            f"border-radius:10px; padding:10px 4px; margin:4px 0'>"
            f"<div style='font-size:2.2em; font-weight:700; color:{color}'>{p.branch}</div>"
            f"<div style='font-size:0.9em'>{b['ko']} · {b['roman']}</div>"
            f"<div style='font-size:0.75em; opacity:0.7'>{b['en']}</div>"
            f"</div>",
            unsafe_allow_html=True,
        )

# Ten-god of branch primary (first hidden stem's ten-god is shown)
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        parts = []
        for tg_zhi in p.ten_god_branches:
            tg = ten_god_info(tg_zhi)
            label = tg["th"] if lang == "th" else tg["en"]
            parts.append(f"<span style='font-size:0.75em'>{label}</span>")
        st.markdown(f"<div style='text-align:center; color:#555'>{' · '.join(parts)}</div>",
                    unsafe_allow_html=True)

# Hidden stems
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        hide_ko = " ".join(stem_info(h)["ko"] for h in p.hidden_stems)
        hide_hz = " ".join(p.hidden_stems)
        st.markdown(
            f"<div style='text-align:center; font-size:0.85em; color:#333; "
            f"background:#fafafa; border-radius:6px; padding:4px'>"
            f"<div style='opacity:0.8'>{t('pillars.hidden', lang)}</div>"
            f"<div>{hide_hz}</div><div style='opacity:0.7'>{hide_ko}</div>"
            f"</div>",
            unsafe_allow_html=True,
        )

# 12 life stages
cols = st.columns(4)
for i, p in enumerate(result.pillars):
    with cols[i]:
        ls = life_stage_info(p.life_stage)
        label = ls["th"] if lang == "th" else ls["en"]
        st.markdown(
            f"<div style='text-align:center; font-size:0.85em; color:#333; margin-top:4px'>"
            f"<div style='opacity:0.7'>{t('pillars.life_stage', lang)}</div>"
            f"<div><b>{p.life_stage}</b> · {label}</div>"
            f"</div>",
            unsafe_allow_html=True,
        )


# ── Nobles & Stars ─────────────────────────────────────────────────────────
st.markdown("---")
st.subheader(t("nobles.header", lang))

nobles_cols = st.columns(4)
for i, p in enumerate(result.pillars):
    flags_here = [k for k, flags in result.nobles.items() if flags[i]]
    with nobles_cols[i]:
        st.markdown(
            f"<div style='text-align:center; color:#999; font-size:0.8em'>{pos_labels[p.position]}</div>",
            unsafe_allow_html=True,
        )
        if not flags_here:
            st.markdown(
                f"<div style='text-align:center; color:#bbb'>{t('nobles.none', lang)}</div>",
                unsafe_allow_html=True,
            )
            continue
        for k in flags_here:
            meta = NOBLE_META[k]
            label_ko = meta["ko"]
            label_loc = meta["th"] if lang == "th" else meta["en"]
            st.markdown(
                f"<div style='text-align:center; background:#fff3cd; border:1px solid #ffe69c; "
                f"border-radius:6px; padding:3px 6px; margin:3px 0; font-size:0.8em'>"
                f"<b>{label_loc}</b><br/><span style='opacity:0.7'>{label_ko}</span>"
                f"</div>",
                unsafe_allow_html=True,
            )


# ── Daewoon table ──────────────────────────────────────────────────────────
st.markdown("---")
st.subheader(t("daewoon.header", lang))

direction_key = "daewoon.forward" if result.direction == "forward" else "daewoon.backward"
st.caption(
    f"{t('daewoon.start', lang)}: {result.daewoon_start_age_years}y "
    f"{result.daewoon_start_age_months}m  ·  "
    f"{t('daewoon.direction', lang)}: {t(direction_key, lang)}"
)

daewoon_rows = []
for d in result.daewoon:
    s = stem_info(d.ganzhi[0])
    b = branch_info(d.ganzhi[1])
    tg_s = ten_god_info(d.ten_god_stem)
    tg_b = ten_god_info(d.ten_god_branch_primary)
    daewoon_rows.append({
        t("daewoon.age", lang): d.start_age,
        t("daewoon.year", lang): d.start_year,
        t("daewoon.pillar", lang): f"{d.ganzhi}  ({s['ko']}{b['ko']})",
        t("pillars.ten_god_stem", lang): tg_s["th"] if lang == "th" else tg_s["en"],
        t("pillars.ten_god_branch", lang): tg_b["th"] if lang == "th" else tg_b["en"],
    })

st.table(daewoon_rows)


# ── Footer ─────────────────────────────────────────────────────────────────
st.markdown("---")
st.caption(t("footer.disclaimer", lang))
