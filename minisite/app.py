"""Streamlit front-end for the Saju Thai mini-site."""

from __future__ import annotations

import sys
from datetime import date, datetime, time
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent))

from data.cities import (
    cities_for_country,
    countries_for_lang,
    get_city,
)
from data.i18n import t
from saju import compute_saju
from saju.nobles import NOBLE_META
from saju.tables import (
    ELEMENTS,
    branch as branch_info,
    day_master_narrative,
    life_stage as life_stage_info,
    stem as stem_info,
    ten_god as ten_god_info,
)

st.set_page_config(page_title="Saju Thai", page_icon="☯", layout="centered")

# ── Light-touch CSS to make cards look closer to Posteller ─────────────────
st.markdown("""
<style>
.saju-cell { text-align:center; padding:8px 4px; border-radius:10px; margin:3px 0; }
.saju-big  { font-size:2.0em; font-weight:700; line-height:1.0; }
.saju-mid  { font-size:0.9em; }
.saju-tiny { font-size:0.72em; opacity:0.75; }
.saju-noble {
  display:inline-block; background:#fff3cd; border:1px solid #ffe69c;
  border-radius:6px; padding:2px 6px; margin:2px; font-size:0.72em;
  white-space:nowrap;
}
.saju-noble.danger { background:#fde7e7; border-color:#f5b8b8; }
.saju-stripe { background:#fafafa; padding:6px 4px; border-radius:6px; }
.saju-headcell { color:#888; font-size:0.85em; text-align:center; }
.saju-rowlabel { color:#666; font-size:0.78em; padding:6px 0; }
hr { margin:1.2em 0; }
</style>
""", unsafe_allow_html=True)


# ── Language toggle (set state before any title rendering) ─────────────────
if "lang" not in st.session_state:
    st.session_state["lang"] = "th"

# Render language picker first, then read updated state.
top_col_l, top_col_r = st.columns([4, 1])
with top_col_r:
    st.selectbox(
        t("lang.label", st.session_state["lang"]),
        options=["th", "en"],
        format_func=lambda x: "ไทย" if x == "th" else "English",
        key="lang",
        label_visibility="collapsed",
    )

lang = st.session_state["lang"]

with top_col_l:
    st.title(t("app.title", lang))
    st.caption(t("app.subtitle", lang))


# ── Input form ─────────────────────────────────────────────────────────────
st.header(t("form.header", lang))

# Country + City are placed outside of st.form so that changing the country
# immediately refilters the city list. Widgets inside a form only emit values
# on submit, which would leave the city dropdown stale.
c5, c6 = st.columns(2)
with c5:
    countries = countries_for_lang(lang)
    country_keys = [k for k, _ in countries]
    country_labels = dict(countries)
    country_code = st.selectbox(
        t("form.country", lang),
        options=country_keys,
        format_func=lambda k: country_labels[k],
        index=country_keys.index("TH"),
        key="country_code",
    )
with c6:
    cities = cities_for_country(country_code, lang)
    if not cities:
        st.warning("No cities listed for this country yet.")
        st.stop()
    city_keys = [k for k, _ in cities]
    city_labels = dict(cities)
    city_key = st.selectbox(
        t("form.city", lang),
        options=city_keys,
        format_func=lambda k: city_labels[k],
        key=f"city_key_{country_code}",
    )

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

# Display order: 시 - 일 - 월 - 년 (Korean tradition, rightmost = year)
DISPLAY_ORDER = [3, 2, 1, 0]   # indices into result.pillars
POSITION_KEYS = ["hour", "day", "month", "year"]


# ── Profile summary ────────────────────────────────────────────────────────
st.markdown("---")
st.subheader(t("result.profile", lang))

city_label = city["th_name"] if lang == "th" else city["en_name"]
prof_l, prof_r = st.columns(2)
with prof_l:
    if name:
        st.markdown(f"**{name}** — {t(f'form.gender.{gender_label}', lang)}")
    st.markdown(
        f"**{t('result.local', lang)}:** {local_dt.strftime('%Y-%m-%d %H:%M')}  \n*{city_label}*"
    )
    leap_tag = " (leap)" if result.lunar_is_leap else ""
    lunar_label = "Lunar" if lang == "en" else "จันทรคติ"
    st.markdown(
        f"**{t('result.lunar', lang)}:** "
        f"{result.lunar_year}-{result.lunar_month:02d}-{result.lunar_day:02d}{leap_tag} "
        f"({lunar_label})"
    )
with prof_r:
    st.markdown(
        f"**{t('result.corrected', lang)}:** {result.corrected_dt.strftime('%Y-%m-%d %H:%M')}"
    )
    st.markdown(
        f"**{t('result.solar_shift', lang)}:** {result.solar_shift_minutes:+d} "
        f"{t('result.minutes', lang)}"
    )
    st.markdown(
        f"**{t('result.total_shift', lang)}:** {result.total_shift_minutes:+d} "
        f"{t('result.minutes', lang)}"
    )

# Day master with narrative
dm = stem_info(result.day_master)
dm_el = ELEMENTS[dm["element"]]
dm_el_label = dm_el["th"] if lang == "th" else dm_el["en"]
narr = day_master_narrative(result.day_master, lang)
st.markdown(
    f"<div style='background:linear-gradient(135deg,{dm_el['color']}22,{dm_el['color']}08); "
    f"border-left:4px solid {dm_el['color']}; padding:14px 16px; border-radius:8px; margin-top:8px'>"
    f"<div style='font-size:0.78em; color:#888; letter-spacing:0.04em'>{t('result.day_master', lang)}</div>"
    f"<div style='font-size:1.4em; font-weight:700; color:{dm_el['color']}; margin-top:4px'>"
    f"{result.day_master} · {dm['ko']} ({dm['roman']}) — {narr['image']}"
    f"</div>"
    f"<div style='margin-top:6px; color:#444; line-height:1.5'>{narr['text']}</div>"
    f"<div style='margin-top:4px; font-size:0.78em; opacity:0.7'>"
    f"{dm['en']} · {dm_el_label} {dm_el['hanzi']}"
    f"</div>"
    f"</div>",
    unsafe_allow_html=True,
)


# ── Four Pillars grid (시-일-월-년 left→right) ─────────────────────────────
st.markdown("---")
st.subheader(t("pillars.header", lang))

pos_labels = {k: t(f"pillars.{k}", lang) for k in ["year", "month", "day", "hour"]}

def _pillar_columns(render):
    cols = st.columns(4)
    for slot, idx in enumerate(DISPLAY_ORDER):
        with cols[slot]:
            render(result.pillars[idx], idx)

# Position headers
def _hdr(p, _i): st.markdown(
    f"<div class='saju-headcell'>{pos_labels[p.position]}</div>", unsafe_allow_html=True)
_pillar_columns(_hdr)

# Ten-god of stem
def _tg_stem(p, _i):
    tg = ten_god_info(p.ten_god_stem)
    label = tg["th"] if lang == "th" else tg["en"]
    st.markdown(
        f"<div class='saju-cell'><div class='saju-tiny'>{label}</div>"
        f"<div class='saju-tiny' style='opacity:0.45'>{p.ten_god_stem}</div></div>",
        unsafe_allow_html=True)
_pillar_columns(_tg_stem)

# Stems (big, colored by element)
def _stem(p, _i):
    s = stem_info(p.stem)
    color = ELEMENTS[s["element"]]["color"]
    st.markdown(
        f"<div class='saju-cell' style='background:{color}22; border:2px solid {color}'>"
        f"<div class='saju-big' style='color:{color}'>{p.stem}</div>"
        f"<div class='saju-mid'>{s['ko']} · {s['roman']}</div></div>",
        unsafe_allow_html=True)
_pillar_columns(_stem)

# Branches
def _branch(p, _i):
    b = branch_info(p.branch)
    color = ELEMENTS[b["element"]]["color"]
    st.markdown(
        f"<div class='saju-cell' style='background:{color}22; border:2px solid {color}'>"
        f"<div class='saju-big' style='color:{color}'>{p.branch}</div>"
        f"<div class='saju-mid'>{b['ko']} · {b['roman']}</div>"
        f"<div class='saju-tiny'>{b['en']}</div></div>",
        unsafe_allow_html=True)
_pillar_columns(_branch)

# Ten-god of branch (multiple)
def _tg_br(p, _i):
    parts = []
    for tg_zhi in p.ten_god_branches:
        tg = ten_god_info(tg_zhi)
        label = tg["th"] if lang == "th" else tg["en"]
        parts.append(f"<span class='saju-tiny'>{label}</span>")
    st.markdown("<div class='saju-cell'>" + " · ".join(parts) + "</div>",
                unsafe_allow_html=True)
_pillar_columns(_tg_br)

# Hidden stems
def _hide(p, _i):
    hide_ko = " ".join(stem_info(h)["ko"] for h in p.hidden_stems)
    st.markdown(
        f"<div class='saju-stripe saju-cell'>"
        f"<div class='saju-tiny'>{t('pillars.hidden', lang)}</div>"
        f"<div>{' '.join(p.hidden_stems)}</div>"
        f"<div class='saju-tiny'>{hide_ko}</div></div>",
        unsafe_allow_html=True)
_pillar_columns(_hide)

# 12 life stages
def _12s(p, _i):
    ls = life_stage_info(p.life_stage)
    label = ls["th"] if lang == "th" else ls["en"]
    st.markdown(
        f"<div class='saju-cell'><div class='saju-tiny'>{t('pillars.life_stage', lang)}</div>"
        f"<div><b>{p.life_stage}</b> · {label}</div></div>",
        unsafe_allow_html=True)
_pillar_columns(_12s)


# ── Nobles & Stars (Posteller-style: stem row + branch row per pillar) ─────
st.markdown("---")
st.subheader(t("nobles.header", lang))

# Markers considered "danger" get a different background (still readable)
DANGER_KEYS = {"baekho", "goegang", "yangin", "yeokma", "dohwa", "mangsin",
               "geob", "jae", "cheonsal", "wolsal", "yukhae", "hyeonchim"}

def _nobles_for(side: str, idx: int) -> list[str]:
    """Return list of noble keys whose `side` flag is True for pillar idx."""
    return [k for k, v in result.nobles.items() if v[side][idx]]

def _render_noble_chips(keys: list[str]) -> str:
    if not keys:
        return f"<div class='saju-tiny' style='text-align:center; color:#bbb'>{t('nobles.none', lang)}</div>"
    chips = []
    for k in keys:
        meta = NOBLE_META[k]
        loc = meta["th"] if lang == "th" else meta["en"]
        ko = meta["ko"]
        cls = "saju-noble danger" if k in DANGER_KEYS else "saju-noble"
        chips.append(f"<span class='{cls}' title='{ko}'>{loc}</span>")
    return "<div style='text-align:center'>" + "".join(chips) + "</div>"

# Header row
hdr_cols = st.columns([1, 4, 4, 4, 4])
hdr_cols[0].markdown("&nbsp;", unsafe_allow_html=True)
for slot, idx in enumerate(DISPLAY_ORDER, start=1):
    hdr_cols[slot].markdown(
        f"<div class='saju-headcell'>{pos_labels[POSITION_KEYS[slot-1]]}</div>",
        unsafe_allow_html=True)

# Stem character row + stem-noble chips
stem_cols = st.columns([1, 4, 4, 4, 4])
stem_cols[0].markdown(
    f"<div class='saju-rowlabel'>{t('pillars.stem', lang)}</div>",
    unsafe_allow_html=True)
for slot, idx in enumerate(DISPLAY_ORDER, start=1):
    p = result.pillars[idx]
    s = stem_info(p.stem)
    color = ELEMENTS[s["element"]]["color"]
    chips_html = _render_noble_chips(_nobles_for("on_stem", idx))
    stem_cols[slot].markdown(
        f"<div class='saju-cell' style='background:{color}11'>"
        f"<div style='font-size:1.6em; font-weight:700; color:{color}'>{p.stem}</div>"
        f"</div>{chips_html}",
        unsafe_allow_html=True)

# Branch character row + branch-noble chips
br_cols = st.columns([1, 4, 4, 4, 4])
br_cols[0].markdown(
    f"<div class='saju-rowlabel'>{t('pillars.branch', lang)}</div>",
    unsafe_allow_html=True)
for slot, idx in enumerate(DISPLAY_ORDER, start=1):
    p = result.pillars[idx]
    b = branch_info(p.branch)
    color = ELEMENTS[b["element"]]["color"]
    chips_html = _render_noble_chips(_nobles_for("on_branch", idx))
    br_cols[slot].markdown(
        f"<div class='saju-cell' style='background:{color}11'>"
        f"<div style='font-size:1.6em; font-weight:700; color:{color}'>{p.branch}</div>"
        f"</div>{chips_html}",
        unsafe_allow_html=True)


# ── Daewoon (10 cards across) ──────────────────────────────────────────────
st.markdown("---")
st.subheader(t("daewoon.header", lang))

direction_key = "daewoon.forward" if result.direction == "forward" else "daewoon.backward"
yrs_label  = t("daewoon.years",  lang)
mos_label  = t("daewoon.months", lang)
st.caption(
    f"{t('daewoon.start', lang)}: "
    f"{result.daewoon_start_age_years}{yrs_label} {result.daewoon_start_age_months}{mos_label}  ·  "
    f"{t('daewoon.direction', lang)}: {t(direction_key, lang)}"
)


def render_cycle_strip(entries, top_label_fn):
    """Render up to 10 cycle cards as horizontal columns."""
    entries = entries[:10]
    if not entries:
        return
    cols = st.columns(len(entries))
    for col, e in zip(cols, entries):
        with col:
            s = stem_info(e.ganzhi[0])
            b = branch_info(e.ganzhi[1])
            sc = ELEMENTS[s["element"]]["color"]
            bc = ELEMENTS[b["element"]]["color"]
            tg_s = ten_god_info(e.ten_god_stem)
            tg_b = ten_god_info(e.ten_god_branch_primary)
            ls = life_stage_info(e.life_stage)
            tg_s_loc = tg_s["th"] if lang == "th" else tg_s["en"]
            tg_b_loc = tg_b["th"] if lang == "th" else tg_b["en"]
            ls_loc   = ls["th"]   if lang == "th" else ls["en"]
            top, sub = top_label_fn(e)
            st.markdown(
                f"<div style='text-align:center'>"
                f"<div class='saju-tiny'>{top}</div>"
                f"<div class='saju-tiny' style='opacity:0.55'>{sub}</div>"
                f"<div class='saju-tiny' style='margin-top:2px'>{tg_s_loc}</div>"
                f"<div style='background:{sc}22;border:2px solid {sc};border-radius:8px;"
                f"padding:6px 0;margin:2px 0'>"
                f"<span style='font-size:1.6em;font-weight:700;color:{sc}'>{e.ganzhi[0]}</span>"
                f"<div class='saju-tiny'>{stem_info(e.ganzhi[0])['ko']}</div></div>"
                f"<div style='background:{bc}22;border:2px solid {bc};border-radius:8px;"
                f"padding:6px 0;margin:2px 0'>"
                f"<span style='font-size:1.6em;font-weight:700;color:{bc}'>{e.ganzhi[1]}</span>"
                f"<div class='saju-tiny'>{branch_info(e.ganzhi[1])['ko']}</div></div>"
                f"<div class='saju-tiny' style='margin-top:2px'>{tg_b_loc}</div>"
                f"<div class='saju-tiny' style='opacity:0.7'><b>{e.life_stage}</b></div>"
                f"<div class='saju-tiny' style='opacity:0.55'>{ls_loc}</div>"
                f"</div>",
                unsafe_allow_html=True,
            )

age_label  = "Age" if lang == "en" else "อายุ"
year_label = "Year" if lang == "en" else "ปี"

render_cycle_strip(
    result.daewoon,
    top_label_fn=lambda e: (f"{e.label} {age_label}", e.sub_label),
)


# ── Sewoon (current daewoon's 10-year window) ──────────────────────────────
if result.sewoon:
    st.markdown("---")
    st.subheader(t("sewoon.header", lang))
    render_cycle_strip(
        result.sewoon,
        top_label_fn=lambda e: (e.label, f"{e.sub_label} {age_label}"),
    )


# ── Footer ─────────────────────────────────────────────────────────────────
st.markdown("---")
st.caption(t("footer.disclaimer", lang))
