"""Render a SajuResult + birth profile as plain-text context for the LLM.

The paid-tier prompts tell Claude to reason from the chart; this module
serializes the chart in a form that matches the doctrine the prompts refer
to (Ten Gods, Hidden Stems, 12 Life Stages, Nobles, current Daewoon/Sewoon)
without the UI chrome the Streamlit view adds.

Keeping this text deterministic matters for prompt caching — every byte that
changes between requests lands AFTER the cache_control breakpoint. The
system prompt (stable) is cached; this per-user block is not.
"""

from __future__ import annotations

from saju import SajuResult
from saju.nobles import NOBLE_META
from saju.tables import TEN_GODS, LIFE_STAGES, STEMS, BRANCHES


def _tg(name: str, lang: str) -> str:
    m = TEN_GODS.get(name, {})
    return m.get(lang) or m.get("en") or name


def _ls(name: str, lang: str) -> str:
    m = LIFE_STAGES.get(name, {})
    return m.get(lang) or m.get("en") or name


def _stem_label(ch: str, lang: str) -> str:
    s = STEMS.get(ch, {})
    return f"{ch} ({s.get('ko', ch)} · {s.get('en', '')})"


def _branch_label(ch: str, lang: str) -> str:
    b = BRANCHES.get(ch, {})
    return f"{ch} ({b.get('ko', ch)} · {b.get('en', '')})"


def _noble_label(key: str, lang: str) -> str:
    m = NOBLE_META.get(key, {})
    loc = m.get(lang) or m.get("en") or key
    ko = m.get("ko", "")
    return f"{loc} ({ko})"


def format_chart_for_llm(
    *,
    result: SajuResult,
    name: str | None,
    gender: str,
    birth_date_iso: str,
    birth_time_iso: str,
    city_label: str,
    country_label: str,
    lang: str,
) -> str:
    """Produce a compact markdown-ish block the LLM can reason over."""

    # Pillars in chronological order (year → hour) — easier to read than UI order.
    pillar_names = ["Year", "Month", "Day", "Hour"]
    pillars_line = "  ".join(
        f"{pillar_names[i]}: {p.ganzhi}" for i, p in enumerate(result.pillars)
    )

    ten_gods_line = "  ".join(
        f"{pillar_names[i]}: {_tg(p.ten_god_stem, lang)}"
        for i, p in enumerate(result.pillars)
    )

    stages_line = "  ".join(
        f"{pillar_names[i]}: {p.life_stage} ({_ls(p.life_stage, lang)})"
        for i, p in enumerate(result.pillars)
    )

    hidden_lines = []
    for i, p in enumerate(result.pillars):
        hs = " ".join(p.hidden_stems)
        tgs = " / ".join(_tg(x, lang) for x in p.ten_god_branches)
        hidden_lines.append(f"  - {pillar_names[i]} {p.branch}: {hs}  ({tgs})")

    # Active nobles, grouped by pillar
    active_nobles = []
    for key, sides in result.nobles.items():
        for idx, label in enumerate(pillar_names):
            on_stem = sides["on_stem"][idx]
            on_branch = sides["on_branch"][idx]
            if on_stem or on_branch:
                where = "stem" if on_stem else "branch"
                active_nobles.append(f"  - {_noble_label(key, lang)} on {label} ({where})")

    # Current window of cycles — limit to what a reading actually uses
    daewoon_lines = []
    for d in result.daewoon[:6]:
        daewoon_lines.append(
            f"  - age {d.label} ({d.sub_label}): {d.ganzhi} — "
            f"{_tg(d.ten_god_stem, lang)} / {d.life_stage} ({_ls(d.life_stage, lang)})"
        )

    sewoon_lines = []
    for s in result.sewoon[:6]:
        sewoon_lines.append(
            f"  - {s.label} (age {s.sub_label}): {s.ganzhi} — "
            f"{_tg(s.ten_god_stem, lang)} / {_ls(s.life_stage, lang)}"
        )

    day_master = result.day_master
    dm_stem = STEMS.get(day_master, {})

    header = "## Birth Profile"
    profile = [
        f"- Name: {name or '(not provided)'}",
        f"- Gender: {gender}",
        f"- Solar birth: {birth_date_iso} {birth_time_iso}",
        f"- Place: {city_label}, {country_label}",
        f"- True solar time shift: {result.total_shift_minutes:+d} min (to KST reference)",
    ]

    chart_header = "## Chart Summary"
    chart = [
        f"- Day Master: {_stem_label(day_master, lang)} "
        f"[{dm_stem.get('polarity', '').title()} {dm_stem.get('element', '').title()}]",
        f"- Four Pillars: {pillars_line}",
        f"- Ten Gods (stem): {ten_gods_line}",
        f"- 12 Life Stages: {stages_line}",
        f"- Hidden Stems (지장간):",
        *hidden_lines,
    ]

    nobles_header = "## Active Nobles & Stars"
    nobles = active_nobles or ["  (none above the common threshold)"]

    daewoon_header = (
        f"## Great Luck Cycles (대운) — direction: {result.direction}, "
        f"starts at {result.daewoon_start_age_years}y "
        f"{result.daewoon_start_age_months}m"
    )

    sewoon_header = f"## Yearly Run (세운) — {result.sewoon_year} window"

    lang_line = {
        "en": "Respond in fluent English.",
        "th": "Respond in fluent Thai (ภาษาไทย).",
        "ko": "Respond in fluent Korean (한국어).",
    }.get(lang, "Respond in fluent English.")

    instr = (
        "## Instructions\n"
        f"- {lang_line}\n"
        "- Reason strictly from the chart above.\n"
        "- Use the numbered / bulleted output format specified in the system prompt.\n"
        "- Do not mention that you are an AI or that this is generated.\n"
    )

    return "\n".join([
        header,
        *profile,
        "",
        chart_header,
        *chart,
        "",
        nobles_header,
        *nobles,
        "",
        daewoon_header,
        *daewoon_lines,
        "",
        sewoon_header,
        *sewoon_lines,
        "",
        instr,
    ])
