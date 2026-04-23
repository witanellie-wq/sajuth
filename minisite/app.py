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
from reading.llm import stream_reading
from reading.payment import (
    ChartRef,
    is_live_mode,
    payment_link_for_tier,
    readings_configured,
    verify_payment,
)
from reading.prompts import TIERS, TIER_ORDER
from reading.summary import format_chart_for_llm

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
.saju-sidelabel {
  color:#666; font-size:0.85em; font-weight:600;
  display:flex; align-items:center; justify-content:flex-end;
  height:100%; padding-right:6px; text-align:right; white-space:nowrap;
}

/* Cycle (daewoon / sewoon / wolun) card — every row uses *exact* height so
   columns always line up regardless of whether a ten-god label is one word
   ("Rival") or two ("Direct Resource"). Short labels reserve the second line
   as empty space (block top-aligned), keeping the card geometry identical. */
.cy-wrap   { text-align:center; }
.cy-top    { height:14px; line-height:14px; font-size:11px; opacity:0.8; overflow:hidden; }
.cy-sub    { height:14px; line-height:14px; font-size:11px; opacity:0.55; overflow:hidden; }
.cy-tg     {
  height:30px; line-height:14px; font-size:11px; opacity:0.88;
  text-align:center; padding:1px 0; overflow:hidden;
  word-break:break-word;
}
.cy-card   {
  border-radius:8px; padding:4px 0; margin:2px 0;
  height:58px; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
}
.cy-char   { font-size:24px; font-weight:700; line-height:24px; }
.cy-sub-ko { font-size:11px; line-height:12px; opacity:0.65; margin-top:2px; }
.cy-ls1    { height:16px; line-height:16px; font-size:12px; font-weight:600; opacity:0.85; overflow:hidden; }
.cy-ls2    { height:14px; line-height:14px; font-size:11px; opacity:0.55; overflow:hidden; }

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


# ── Stripe return — detect ?paid=1&tier=...&session_id=... and bypass form ─
qp = st.query_params
paid_tier_q = (qp.get("tier") or "").lower()
paid_session_id_q = qp.get("session_id") or ""
paid_flag_q = qp.get("paid") == "1"

paid_context = None
if paid_flag_q and paid_session_id_q and paid_tier_q in TIERS:
    with st.spinner(t("paid.verifying", lang)):
        info = verify_payment(paid_session_id_q)
    if info is None:
        st.error(t("paid.unpaid", lang))
        st.stop()
    _ref_str = info.get("client_reference_id") or ""
    _chart_ref = ChartRef.decode(_ref_str)
    if _chart_ref is None:
        st.error("Missing birth profile in payment session. Please re-enter.")
        st.stop()
    paid_context = {"tier": paid_tier_q, "chart_ref": _chart_ref}


# ── Input form (skipped when arriving from a successful payment) ───────────
if paid_context is not None:
    _ref = paid_context["chart_ref"]
    name = _ref.name
    gender_label = _ref.gender
    birth_date = _ref.birth_date
    birth_time = _ref.birth_time
    country_code = _ref.country_code
    city_key = _ref.city_key
    submitted = True
else:
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
            key=f"country_code_{lang}",
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
            key=f"city_key_{country_code}_{lang}",
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
    narr = day_master_narrative(p.stem, lang)
    st.markdown(
        f"<div class='saju-cell' style='background:{color}22; border:2px solid {color}'>"
        f"<div class='saju-big' style='color:{color}'>{p.stem}</div>"
        f"<div class='saju-mid'>{s['ko']} · {s['roman']}</div>"
        f"<div class='saju-tiny'>{narr['image']}</div></div>",
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

# 5-column grid: side label (wider so "Stem"/"Branch" never wraps) + 4 pillars
NOBLE_GRID = [2, 5, 5, 5, 5]

# Header row
hdr_cols = st.columns(NOBLE_GRID)
hdr_cols[0].markdown("&nbsp;", unsafe_allow_html=True)
for slot, idx in enumerate(DISPLAY_ORDER, start=1):
    hdr_cols[slot].markdown(
        f"<div class='saju-headcell'>{pos_labels[POSITION_KEYS[slot-1]]}</div>",
        unsafe_allow_html=True)

# Stem character row + stem-noble chips
stem_cols = st.columns(NOBLE_GRID)
stem_cols[0].markdown(
    f"<div class='saju-sidelabel'>{t('nobles.stem_row', lang)}</div>",
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
br_cols = st.columns(NOBLE_GRID)
br_cols[0].markdown(
    f"<div class='saju-sidelabel'>{t('nobles.branch_row', lang)}</div>",
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


def render_cycle_strip(entries, top_label_fn, max_cols: int = 12):
    """Render up to `max_cols` cycle cards as horizontal columns.
    Each row uses fixed pixel heights so columns stay aligned even when a
    ten-god label wraps to two lines (e.g. 'Direct Resource')."""
    entries = entries[:max_cols]
    if not entries:
        return
    cols = st.columns(len(entries))
    for col, e in zip(cols, entries):
        with col:
            s_ko = stem_info(e.ganzhi[0])["ko"]
            b_ko = branch_info(e.ganzhi[1])["ko"]
            sc = ELEMENTS[stem_info(e.ganzhi[0])["element"]]["color"]
            bc = ELEMENTS[branch_info(e.ganzhi[1])["element"]]["color"]
            tg_s = ten_god_info(e.ten_god_stem)
            tg_b = ten_god_info(e.ten_god_branch_primary)
            ls = life_stage_info(e.life_stage)
            tg_s_loc = tg_s["th"] if lang == "th" else tg_s["en"]
            tg_b_loc = tg_b["th"] if lang == "th" else tg_b["en"]
            ls_loc   = ls["th"]   if lang == "th" else ls["en"]
            top, sub = top_label_fn(e)
            st.markdown(
                f"<div class='cy-wrap'>"
                f"<div class='cy-top'>{top}</div>"
                f"<div class='cy-sub'>{sub}</div>"
                f"<div class='cy-tg'>{tg_s_loc}</div>"
                f"<div class='cy-card' style='background:{sc}22;border:2px solid {sc}'>"
                f"<div class='cy-char' style='color:{sc}'>{e.ganzhi[0]}</div>"
                f"<div class='cy-sub-ko'>{s_ko}</div>"
                f"</div>"
                f"<div class='cy-card' style='background:{bc}22;border:2px solid {bc}'>"
                f"<div class='cy-char' style='color:{bc}'>{e.ganzhi[1]}</div>"
                f"<div class='cy-sub-ko'>{b_ko}</div>"
                f"</div>"
                f"<div class='cy-tg'>{tg_b_loc}</div>"
                f"<div class='cy-ls1'>{e.life_stage}</div>"
                f"<div class='cy-ls2'>{ls_loc}</div>"
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


# ── Wolun (12 months of the current year) ──────────────────────────────────
if result.wolun:
    st.markdown("---")
    st.subheader(t("wolun.header", lang))
    st.caption(t("wolun.sub", lang).format(year=result.sewoon_year))
    month_label = "Month" if lang == "en" else "เดือน"
    render_cycle_strip(
        result.wolun,
        top_label_fn=lambda e: (f"{e.label} {month_label}", ""),
    )


# ── Paid readings ──────────────────────────────────────────────────────────
st.markdown("---")

_city = get_city(city_key)
_country_label = dict(countries_for_lang(lang)).get(country_code, country_code)
_city_label = _city["th_name"] if lang == "th" else _city["en_name"]

_chart_summary = format_chart_for_llm(
    result=result,
    name=name,
    gender=gender_label,
    birth_date_iso=birth_date.isoformat(),
    birth_time_iso=birth_time.strftime("%H:%M"),
    city_label=_city_label,
    country_label=_country_label,
    lang=lang,
)

if paid_context is not None:
    # User just paid — stream the reading inline.
    st.subheader(t("paid.reading_header", lang))
    _tier_spec = TIERS[paid_context["tier"]]
    _tier_label = _tier_spec["label_th"] if lang == "th" else _tier_spec["label_en"]
    st.caption(f"{_tier_label} · {_tier_spec['price_thb']}{t('paid.price_suffix', lang)}")
    with st.spinner(t("paid.generating", lang)):
        st.write_stream(stream_reading(
            tier=paid_context["tier"],
            chart_summary=_chart_summary,
        ))
    st.success(t("paid.thanks", lang))

else:
    # User hasn't paid — show tier CTAs beneath the free chart.
    st.subheader(t("paid.header", lang))
    st.caption(t("paid.subtitle", lang))

    if not readings_configured():
        st.info(t("paid.disabled", lang))
    else:
        _live = is_live_mode()
        if not _live:
            st.info(t("paid.coming_soon_note", lang))
        _chart_ref = ChartRef(
            birth_date=birth_date,
            birth_time=birth_time,
            gender=gender_label,
            country_code=country_code,
            city_key=city_key,
            name=name or "",
        )
        tier_cols = st.columns(len(TIER_ORDER))
        for col, tier_key in zip(tier_cols, TIER_ORDER):
            spec = TIERS[tier_key]
            label = spec["label_th"] if lang == "th" else spec["label_en"]
            tag   = spec["tagline_th"] if lang == "th" else spec["tagline_en"]
            price = f"{spec['price_thb']}{t('paid.price_suffix', lang)}"
            cta   = f"{t('paid.cta', lang)} · {price}"
            link  = payment_link_for_tier(tier_key, _chart_ref) if _live else None
            coming_soon_badge = (
                "<div style='display:inline-block; background:#ffe69c; color:#8a6a00; "
                "border-radius:4px; padding:2px 8px; font-size:0.7em; margin-top:4px'>"
                f"{t('paid.coming_soon', lang)}</div>"
                if not _live else ""
            )
            with col:
                st.markdown(
                    f"<div style='border:1px solid #eee; border-radius:10px; "
                    f"padding:14px; min-height:150px; opacity:{'0.7' if not _live else '1'}'>"
                    f"<div style='font-weight:700; font-size:1.05em'>{label}</div>"
                    f"{coming_soon_badge}"
                    f"<div style='color:#888; font-size:0.82em; margin-top:6px'>{tag}</div>"
                    f"<div style='margin-top:10px; font-size:1.2em; color:#c23'>{price}</div>"
                    f"</div>",
                    unsafe_allow_html=True,
                )
                if _live and link:
                    st.link_button(cta, link, use_container_width=True)
                else:
                    st.button(
                        t("paid.coming_soon", lang),
                        key=f"cs_{tier_key}",
                        disabled=True,
                        use_container_width=True,
                    )


# ── Footer ─────────────────────────────────────────────────────────────────
st.markdown("---")
st.caption(t("footer.disclaimer", lang))
