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
    # A. Identity
    Theme("day_master_archetype", "A",
          "คุณคือ Day Master แบบไหน?",
          "Introduce one of the 10 Day Master archetypes (갑을병정무기경신임계) with a Thai-friendly personality angle. Pick a single archetype per post.",
          ["일간", "갑목", "을목", "병화", "정화", "무토", "기토", "경금", "신금", "임수", "계수"]),
    Theme("missing_element", "A",
          "ธาตุที่ขาดหายในดวงคุณ",
          "Explain the concept of missing element (부족한 오행) and how to rebalance through colors/habits/environment. Do not diagnose for a specific reader.",
          ["오행", "부족", "과다", "보완", "균형"]),
    Theme("sjpj_mbti", "A",
          "ซาจูคือ MBTI แบบเกาหลี",
          "Frame saju palja as the Korean MBTI. Explain why it's deeper than sun-sign astrology.",
          ["사주팔자", "MBTI", "성향", "성격"]),

    # B. Love / Compatibility
    Theme("love_red_flags", "B",
          "5 ดวงที่ไม่ควรคบ (ถ้าคุณเป็นธาตุนี้)",
          "Red-flag pairings by element/day master. Light and fun tone, not fatalistic.",
          ["궁합", "연애", "상극", "피해야할", "안맞는"]),
    Theme("ideal_partner_element", "B",
          "ธาตุของคนที่ใช่สำหรับคุณ",
          "Describe the complementary element for each day master's ideal partner.",
          ["궁합", "용신", "이상형", "연애"]),
    Theme("breakup_timing", "B",
          "ช่วงเวลาที่ใจจะแข็งแรงอีกครั้ง",
          "Recovery timing after heartbreak — seasonal/element-based reframing. Gentle, supportive tone.",
          ["이별", "회복", "대운", "세운"]),

    # C. Career / Money
    Theme("wealth_element", "C",
          "ธาตุแห่งทรัพย์ในดวงคุณ",
          "Explain 재성 (wealth star) simply. No specific investment advice.",
          ["재성", "재물", "돈", "사업운"]),
    Theme("career_fit_day_master", "C",
          "อาชีพที่เหมาะกับ Day Master ของคุณ",
          "Suggest career directions by day master in broad strokes.",
          ["일간", "직업", "적성", "진로"]),
    Theme("boss_vs_freelancer", "C",
          "เจ้านายหรือฟรีแลนซ์? ซาจูบอกคุณได้",
          "Org vs independent work fit via 식상 / 관성 lens.",
          ["사업", "직장", "프리랜서", "관성", "식상"]),

    # D. Timing / Seasonal
    Theme("monthly_vibe", "D",
          "เดือนนี้พลังงานของคุณเป็นยังไง",
          "Current month's energy per day master. Meant to run monthly.",
          ["이달", "월운", "세운", "운세"],
          cadence_days=30),
    Theme("lunar_new_year", "D",
          "ปีนี้ของคุณ — ดวงตลอดปี",
          "Year-ahead forecast. Run around Lunar New Year.",
          ["신년운세", "새해운세", "세운"],
          cadence_days=90),

    # E. Myth-busting
    Theme("not_destiny", "E",
          "ซาจูไม่ได้กำหนดชีวิตคุณ",
          "Frame saju as self-understanding tool, not deterministic prophecy. Builds trust.",
          ["운명", "팔자", "자유의지", "해석"]),
    Theme("saju_vs_western", "E",
          "ซาจู vs. ดวงตะวันตก — ต่างกันยังไง",
          "Compare saju to Western sun-sign astrology. Position saju as more specific.",
          ["서양점성술", "별자리", "차이"]),
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
