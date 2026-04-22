"""Saju engine: wraps lunar_python and returns a clean dict for the UI."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from lunar_python import Solar

from .correction import apply_corrections, solar_shift_only_minutes
from .nobles import compute_nobles
from .tables import (
    BRANCHES,
    STEMS,
    branch as branch_info,
    ganzhi_ko,
    ganzhi_roman,
    stem as stem_info,
)

# Full traditional 지장간 table (초기/중기/정기). lunar_python omits 초기 for
# some branches, which is inconsistent with Korean saju convention.
_HIDDEN_STEMS = {
    "子": ["壬", "癸"],
    "丑": ["癸", "辛", "己"],
    "寅": ["戊", "丙", "甲"],
    "卯": ["甲", "乙"],
    "辰": ["乙", "癸", "戊"],
    "巳": ["戊", "庚", "丙"],
    "午": ["丙", "己", "丁"],
    "未": ["丁", "乙", "己"],
    "申": ["戊", "壬", "庚"],
    "酉": ["庚", "辛"],
    "戌": ["辛", "丁", "戊"],
    "亥": ["戊", "甲", "壬"],
}

Gender = Literal["male", "female"]


@dataclass
class Pillar:
    position: str            # "year" | "month" | "day" | "hour"
    stem: str                # 天干 hanzi
    branch: str              # 地支 hanzi
    hidden_stems: list[str]  # 지장간
    ten_god_stem: str        # 십성 of the 천간
    ten_god_branches: list[str]  # 십성s of the hidden stems
    life_stage: str          # 12운성 for this branch relative to day master

    @property
    def ganzhi(self) -> str:
        return self.stem + self.branch

    @property
    def ko(self) -> str:
        return ganzhi_ko(self.ganzhi)

    @property
    def roman(self) -> str:
        return ganzhi_roman(self.ganzhi)


@dataclass
class DaewoonEntry:
    start_year: int
    start_age: int
    ganzhi: str
    ten_god_stem: str
    ten_god_branch_primary: str  # main hidden-stem ten-god for the branch


@dataclass
class SajuResult:
    local_dt: datetime
    corrected_dt: datetime
    solar_shift_minutes: int
    total_shift_minutes: int
    lunar_date: str
    gender: Gender
    pillars: list[Pillar]            # [year, month, day, hour]
    day_master: str                  # stem hanzi
    nobles: dict[str, list[bool]]    # noble_key -> per-pillar flags
    daewoon_start_age_years: int
    daewoon_start_age_months: int
    daewoon: list[DaewoonEntry]
    direction: Literal["forward", "backward"]


def _direction(year_stem: str, gender: Gender) -> Literal["forward", "backward"]:
    """In Korean saju, daewoon runs forward when year stem polarity matches
    gender (yang year + male, yin year + female) and backward otherwise."""
    yang = stem_info(year_stem)["polarity"] == "yang"
    male = gender == "male"
    return "forward" if yang == male else "backward"


def compute_saju(
    local_dt: datetime,
    gender: Gender,
    longitude: float,
    tz_offset_hours: float,
) -> SajuResult:
    corrected_dt, total_shift = apply_corrections(local_dt, longitude, tz_offset_hours)
    solar_shift = solar_shift_only_minutes(longitude, tz_offset_hours)

    solar = Solar.fromYmdHms(
        corrected_dt.year, corrected_dt.month, corrected_dt.day,
        corrected_dt.hour, corrected_dt.minute, 0,
    )
    lunar = solar.getLunar()
    ec = lunar.getEightChar()

    day_master = ec.getDayGan()

    def _build(pos: str, gz: str, shishen_gan: str, dishi: str) -> Pillar:
        branch_char = gz[1]
        hide = _HIDDEN_STEMS[branch_char]
        tg_zhi = [_ten_god_of_stem(day_master, h) for h in hide]
        return Pillar(
            position=pos,
            stem=gz[0],
            branch=branch_char,
            hidden_stems=list(hide),
            ten_god_stem=shishen_gan,
            ten_god_branches=tg_zhi,
            life_stage=dishi,
        )

    pillars = [
        _build("year",  ec.getYear(),  ec.getYearShiShenGan(),  ec.getYearDiShi()),
        _build("month", ec.getMonth(), ec.getMonthShiShenGan(), ec.getMonthDiShi()),
        _build("day",   ec.getDay(),   ec.getDayShiShenGan(),   ec.getDayDiShi()),
        _build("hour",  ec.getTime(),  ec.getTimeShiShenGan(),  ec.getTimeDiShi()),
    ]

    branches = [p.branch for p in pillars]
    nobles = compute_nobles(
        day_gan=day_master,
        year_zhi=pillars[0].branch,
        day_zhi=pillars[2].branch,
        branches=branches,
    )

    # Daewoon — lunar_python expects 1=male, 0=female
    yun = ec.getYun(1 if gender == "male" else 0)
    raw_daewoon = yun.getDaYun()
    # First entry is pre-natal period with no ganzhi; skip it.
    daewoon = []
    from .tables import TEN_GODS  # local import to avoid cycle surprises
    for d in raw_daewoon[1:9]:  # 8 cycles is enough for a lifetime display
        gz = d.getGanZhi()
        if not gz or len(gz) != 2:
            continue
        gan, zhi = gz[0], gz[1]
        # Ten god of daewoon stem relative to day master
        tg_stem = _ten_god_of_stem(day_master, gan)
        # Primary hidden-stem ten-god of the branch
        tg_br = _primary_ten_god_of_branch(day_master, zhi)
        daewoon.append(DaewoonEntry(
            start_year=d.getStartYear(),
            start_age=d.getStartAge(),
            ganzhi=gz,
            ten_god_stem=tg_stem,
            ten_god_branch_primary=tg_br,
        ))

    return SajuResult(
        local_dt=local_dt,
        corrected_dt=corrected_dt,
        solar_shift_minutes=solar_shift,
        total_shift_minutes=total_shift,
        lunar_date=lunar.toString(),
        gender=gender,
        pillars=pillars,
        day_master=day_master,
        nobles=nobles,
        daewoon_start_age_years=yun.getStartYear(),
        daewoon_start_age_months=yun.getStartMonth(),
        daewoon=daewoon,
        direction=_direction(pillars[0].stem, gender),
    )


# --- Ten-god helpers (operate on simplified Chinese, matching lunar_python) ---

_STEM_ORDER = "甲乙丙丁戊己庚辛壬癸"

_TEN_GOD_MATRIX = {
    # Day master → mapping of other stem → ten-god name (simplified Chinese to
    # match lunar_python's output; tables.TEN_GODS translates to ko/en/th).
    # Derived from element-relation rules:
    #   same element, same polarity   → 比肩
    #   same element, opposite polar  → 劫财
    #   I generate,   same polarity   → 食神
    #   I generate,   opposite polar  → 伤官
    #   I control,    same polarity   → 偏财
    #   I control,    opposite polar  → 正财
    #   controls me,  same polarity   → 七杀
    #   controls me,  opposite polar  → 正官
    #   generates me, same polarity   → 偏印
    #   generates me, opposite polar  → 正印
}


def _ten_god_of_stem(day_master: str, other: str) -> str:
    if other == day_master:
        return "比肩"
    dm = stem_info(day_master)
    ot = stem_info(other)
    rel = _element_relation(dm["element"], ot["element"])
    same_polarity = dm["polarity"] == ot["polarity"]
    table = {
        ("same",       True):  "比肩",
        ("same",       False): "劫财",
        ("i_generate", True):  "食神",
        ("i_generate", False): "伤官",
        ("i_control",  True):  "偏财",
        ("i_control",  False): "正财",
        ("controls_me",True):  "七杀",
        ("controls_me",False): "正官",
        ("generates_me",True): "偏印",
        ("generates_me",False):"正印",
    }
    return table[(rel, same_polarity)]


def _primary_ten_god_of_branch(day_master: str, branch_char: str) -> str:
    """Return the ten-god for the branch's primary hidden stem (본기)."""
    # lunar_python doesn't expose a direct API without a full chart; recompute
    # from the classical 지장간 primary-stem table.
    primary = _BRANCH_PRIMARY_STEM[branch_char]
    return _ten_god_of_stem(day_master, primary)


_BRANCH_PRIMARY_STEM = {
    "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
    "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬",
}


_ELEMENT_CYCLE = ["wood", "fire", "earth", "metal", "water"]


def _element_relation(a: str, b: str) -> str:
    if a == b:
        return "same"
    i_a = _ELEMENT_CYCLE.index(a)
    i_b = _ELEMENT_CYCLE.index(b)
    diff = (i_b - i_a) % 5
    # wood→fire→earth→metal→water→wood  (generation cycle)
    # wood→earth→water→fire→metal→wood  (control cycle, diff of 2)
    if diff == 1:
        return "i_generate"
    if diff == 4:
        return "generates_me"
    if diff == 2:
        return "i_control"
    if diff == 3:
        return "controls_me"
    return "same"
