"""Content theme library with rotation scheduling.

Each theme defines:
- id: stable key for tracking
- category: A/B/C/D/E (see CONTENT_STRATEGY.md §3)
- hook: Thai-side hook angle for the synthesizer
- keywords: Korean keywords used to filter matching source posts
- cadence: how often this theme is allowed to surface (days)
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path

from config import DATA_DIR


@dataclass(frozen=True)
class Theme:
    id: str
    category: str
    title_th: str
    hook: str
    keywords_ko: list[str] = field(default_factory=list)
    cadence_days: int = 7


THEMES: list[Theme] = [
    # S-tier: 후킹 주제 (user 요청 2026-04-22)
    Theme("hot_woman", "S",
          "ดวงผู้หญิงมัดใจผู้ชาย",
          "Traits of women born with high attraction pull (도화살, 관성多, 식신 등). Light, fun, body-positive angle. Avoid objectifying.",
          ["도화살", "관성", "관다녀", "식신", "홍염살", "인기", "매력"],
          cadence_days=7),
    Theme("rich_chart", "S",
          "ลักษณะดวงคนรวย",
          "Core signals in a birth chart that correlate with wealth energy (재성, 재다신강, 식상생재 등). Frame as pattern recognition, no investment advice.",
          ["재성", "재다", "재다신강", "식상생재", "부자사주", "돈많은"],
          cadence_days=7),
    Theme("never_broke", "S",
          "ดวงที่ไม่มีวันจน",
          "Charts with consistent financial stability vs boom-bust. Focus on 비겁/식상 balance and 재성 flow.",
          ["재성", "안정", "돈걱정", "재물운"],
          cadence_days=14),
    Theme("compat_best_worst", "S",
          "คู่ที่ใช่ vs คู่ที่ควรหนี",
          "Top best and worst compatibility combos by Day Master or 지지 충/합. Carousel or short-form reveal format.",
          ["궁합", "찰떡", "상극", "충", "합", "원진"],
          cadence_days=7),

    # A-tier: Identity
    Theme("day_master_archetype", "A",
          "คุณคือ Day Master แบบไหน?",
          "Introduce one of the 10 Day Master archetypes (갑을병정무기경신임계). Pick a single archetype per post.",
          ["일간", "갑목", "을목", "병화", "정화", "무토", "기토", "경금", "신금", "임수", "계수"]),
    Theme("day_master_love", "A",
          "Day Master แต่ละแบบรักยังไง",
          "Love style per day master. Great for long-running series.",
          ["일간", "연애", "연애스타일"]),
    Theme("missing_element_love", "A",
          "ธาตุที่ขาดในดวงมีผลกับความรัก",
          "How a missing element creates love patterns. Actionable rebalancing tips.",
          ["오행", "부족", "용신", "연애", "인성", "관성"]),

    # B-tier: Timing / Seasonal
    Theme("monthly_vibe", "B",
          "เดือนนี้พลังงานของคุณเป็นยังไง",
          "Current month's energy per day master.",
          ["이달", "월운", "세운", "운세"],
          cadence_days=30),
    Theme("avoid_this_year", "B",
          "คนแบบไหนที่ควรเลี่ยงปีนี้",
          "Year-energy based warning about personality types to avoid.",
          ["세운", "상극", "피해야할", "주의"],
          cadence_days=30),

    # C-tier: Trust-building / Myth
    Theme("not_destiny", "C",
          "ซาจูไม่ได้กำหนดชีวิตคุณ",
          "Frame saju as self-understanding tool, not deterministic prophecy.",
          ["운명", "팔자", "자유의지", "해석"]),
    Theme("saju_vs_thai", "C",
          "ซาจู vs. ดูดวงไทย ต่างกันยังไง",
          "Position saju as more specific than Thai astrology, without dismissing local tradition.",
          ["태국", "점술", "차이", "비교"]),
]


BY_ID: dict[str, Theme] = {t.id: t for t in THEMES}


_STATE_FILE = DATA_DIR / "theme_schedule.json"


def _load_state() -> dict[str, str]:
    if _STATE_FILE.exists():
        return json.loads(_STATE_FILE.read_text())
    return {}


def _save_state(state: dict[str, str]) -> None:
    _STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2))


def pick_today(today: date | None = None) -> Theme:
    """Return the next theme due, respecting each theme's cadence_days.

    Greedy round-robin: pick the theme whose last use is furthest past its cadence.
    """
    today = today or date.today()
    state = _load_state()

    def score(theme: Theme) -> float:
        last = state.get(theme.id)
        if not last:
            return float("inf")
        days_since = (today - datetime.fromisoformat(last).date()).days
        return days_since - theme.cadence_days

    chosen = max(THEMES, key=score)
    state[chosen.id] = today.isoformat()
    _save_state(state)
    return chosen


def mark_used(theme_id: str, when: date | None = None) -> None:
    state = _load_state()
    state[theme_id] = (when or date.today()).isoformat()
    _save_state(state)
