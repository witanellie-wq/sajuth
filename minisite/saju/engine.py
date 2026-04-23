"""Saju engine: wraps lunar_python and returns a clean dict for the UI."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from lunar_python import Solar

from .correction import apply_corrections, solar_shift_only_minutes
from .nobles import compute_nobles
from .tables import (
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
    stem: str
    branch: str
    hidden_stems: list[str]
    ten_god_stem: str
    ten_god_branches: list[str]
    life_stage: str

    @property
    def ganzhi(self) -> str: return self.stem + self.branch

    @property
    def ko(self) -> str: return ganzhi_ko(self.ganzhi)

    @property
    def roman(self) -> str: return ganzhi_roman(self.ganzhi)


@dataclass
class CycleEntry:
    """Used for both 대운 (10-yr) and 세운 (1-yr) cycles."""
    label: str               # "27" (age) or "1995" (year)
    sub_label: str           # secondary line — e.g. "1994" or "27세"
    ganzhi: str
    ten_god_stem: str
    ten_god_branch_primary: str
    life_stage: str


@dataclass
class SajuResult:
    local_dt: datetime
    corrected_dt: datetime
    solar_shift_minutes: int
    total_shift_minutes: int
    lunar_year: int
    lunar_month: int
    lunar_day: int
    lunar_is_leap: bool
    gender: Gender
    pillars: list[Pillar]            # [year, month, day, hour]
    day_master: str
    nobles: dict[str, dict[str, list[bool]]]
    daewoon_start_age_years: int
    daewoon_start_age_months: int
    daewoon: list[CycleEntry]
    sewoon: list[CycleEntry]
    wolun: list[CycleEntry]
    sewoon_year: int                 # solar year the wolun belongs to
    direction: Literal["forward", "backward"]


def _direction(year_stem: str, gender: Gender) -> Literal["forward", "backward"]:
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
            position=pos, stem=gz[0], branch=branch_char,
            hidden_stems=list(hide), ten_god_stem=shishen_gan,
            ten_god_branches=tg_zhi, life_stage=dishi,
        )

    pillars = [
        _build("year",  ec.getYear(),  ec.getYearShiShenGan(),  ec.getYearDiShi()),
        _build("month", ec.getMonth(), ec.getMonthShiShenGan(), ec.getMonthDiShi()),
        _build("day",   ec.getDay(),   ec.getDayShiShenGan(),   ec.getDayDiShi()),
        _build("hour",  ec.getTime(),  ec.getTimeShiShenGan(),  ec.getTimeDiShi()),
    ]

    # Void branches (공망) for the day pillar's 60-cycle; lunar_python
    # returns a 2-char string like "午未" — split into individual branches.
    kong_raw = ec.getDayXunKong() or ""
    gongmang = {kong_raw[i] for i in range(min(2, len(kong_raw)))}

    nobles = compute_nobles(
        day_gan=day_master,
        year_zhi=pillars[0].branch,
        month_zhi=pillars[1].branch,
        day_zhi=pillars[2].branch,
        pillar_stems=[p.stem for p in pillars],
        pillar_branches=[p.branch for p in pillars],
        pillar_ganzhi=[p.ganzhi for p in pillars],
        gongmang_branches=gongmang,
    )

    yun = ec.getYun(1 if gender == "male" else 0)
    raw_daewoon = yun.getDaYun()
    daewoon: list[CycleEntry] = []
    for d in raw_daewoon[1:9]:
        gz = d.getGanZhi()
        if not gz or len(gz) != 2:
            continue
        gan, zhi = gz[0], gz[1]
        daewoon.append(CycleEntry(
            label=str(d.getStartAge()),
            sub_label=str(d.getStartYear()),
            ganzhi=gz,
            ten_god_stem=_ten_god_of_stem(day_master, gan),
            ten_god_branch_primary=_primary_ten_god_of_branch(day_master, zhi),
            life_stage=_life_stage_of(day_master, zhi),
        ))

    # 세운 — pick the daewoon active around the user's current age (or first).
    # Then enumerate its 10-year window using getLiuNian().
    sewoon: list[CycleEntry] = []
    wolun: list[CycleEntry] = []
    sewoon_year = datetime.now().year
    today_year = sewoon_year
    chosen_idx = 0
    for i, d in enumerate(raw_daewoon[1:], start=1):
        if d.getStartYear() <= today_year:
            chosen_idx = i
        else:
            break
    if 1 <= chosen_idx < len(raw_daewoon):
        try:
            current_daewoon = raw_daewoon[chosen_idx]
            current_liunian = None
            for ln in current_daewoon.getLiuNian():
                gz = ln.getGanZhi()
                if not gz or len(gz) != 2:
                    continue
                gan, zhi = gz[0], gz[1]
                sewoon.append(CycleEntry(
                    label=str(ln.getYear()),
                    sub_label=f"{ln.getAge()}",
                    ganzhi=gz,
                    ten_god_stem=_ten_god_of_stem(day_master, gan),
                    ten_god_branch_primary=_primary_ten_god_of_branch(day_master, zhi),
                    life_stage=_life_stage_of(day_master, zhi),
                ))
                if ln.getYear() == today_year:
                    current_liunian = ln
            if current_liunian is None and sewoon:
                # Fallback: use the nearest LiuNian to today_year.
                for ln in current_daewoon.getLiuNian():
                    if ln.getYear() >= today_year:
                        current_liunian = ln
                        break
            if current_liunian is not None:
                sewoon_year = current_liunian.getYear()
                for ly in current_liunian.getLiuYue():
                    gz = ly.getGanZhi()
                    if not gz or len(gz) != 2:
                        continue
                    gan, zhi = gz[0], gz[1]
                    bazi_idx = ly.getIndex()          # 0 → 寅月, ... 11 → 丑月
                    solar_month = ((bazi_idx + 1) % 12) + 1  # 寅月 ≈ Feb
                    wolun.append(CycleEntry(
                        label=f"{solar_month}",
                        sub_label="",
                        ganzhi=gz,
                        ten_god_stem=_ten_god_of_stem(day_master, gan),
                        ten_god_branch_primary=_primary_ten_god_of_branch(day_master, zhi),
                        life_stage=_life_stage_of(day_master, zhi),
                    ))
        except Exception:
            pass  # older lunar_python versions may differ

    return SajuResult(
        local_dt=local_dt,
        corrected_dt=corrected_dt,
        solar_shift_minutes=solar_shift,
        total_shift_minutes=total_shift,
        lunar_year=lunar.getYear(),
        lunar_month=lunar.getMonth(),
        lunar_day=lunar.getDay(),
        lunar_is_leap=bool(getattr(lunar, "isLeap", lambda: False)()),
        gender=gender,
        pillars=pillars,
        day_master=day_master,
        nobles=nobles,
        daewoon_start_age_years=yun.getStartYear(),
        daewoon_start_age_months=yun.getStartMonth(),
        daewoon=daewoon,
        sewoon=sewoon,
        wolun=wolun,
        sewoon_year=sewoon_year,
        direction=_direction(pillars[0].stem, gender),
    )


# ── Ten-god + 12-stage helpers ─────────────────────────────────────────────

_ELEMENT_CYCLE = ["wood", "fire", "earth", "metal", "water"]


def _element_relation(a: str, b: str) -> str:
    if a == b:
        return "same"
    diff = (_ELEMENT_CYCLE.index(b) - _ELEMENT_CYCLE.index(a)) % 5
    return {1: "i_generate", 4: "generates_me", 2: "i_control", 3: "controls_me"}[diff]


def _ten_god_of_stem(day_master: str, other: str) -> str:
    if other == day_master:
        return "比肩"
    dm = stem_info(day_master)
    ot = stem_info(other)
    rel = _element_relation(dm["element"], ot["element"])
    same_polarity = dm["polarity"] == ot["polarity"]
    table = {
        ("same",        True):  "比肩", ("same",        False): "劫财",
        ("i_generate",  True):  "食神", ("i_generate",  False): "伤官",
        ("i_control",   True):  "偏财", ("i_control",   False): "正财",
        ("controls_me", True):  "七杀", ("controls_me", False): "正官",
        ("generates_me",True):  "偏印", ("generates_me",False): "正印",
    }
    return table[(rel, same_polarity)]


_BRANCH_PRIMARY_STEM = {
    "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
    "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬",
}


def _primary_ten_god_of_branch(day_master: str, branch_char: str) -> str:
    return _ten_god_of_stem(day_master, _BRANCH_PRIMARY_STEM[branch_char])


# 12 운성 — classical table indexed by [day-stem][branch].
# Yang stems run forward through the cycle; yin stems run backward starting
# from the same root branch.
_LIFE_CYCLE_ORDER = [
    "长生", "沐浴", "冠带", "临官", "帝旺",
    "衰",   "病",   "死",   "墓",   "绝",   "胎",   "养",
]
# Forward birth branch per yang stem
_LIFE_BIRTH_BRANCH = {
    "甲": "亥", "丙": "寅", "戊": "寅", "庚": "巳", "壬": "申",
    "乙": "午", "丁": "酉", "己": "酉", "辛": "子", "癸": "卯",
}
_BRANCHES_ORDER = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]


def _life_stage_of(day_master: str, branch_char: str) -> str:
    birth = _LIFE_BIRTH_BRANCH[day_master]
    forward = stem_info(day_master)["polarity"] == "yang"
    bi = _BRANCHES_ORDER.index(birth)
    ti = _BRANCHES_ORDER.index(branch_char)
    diff = (ti - bi) % 12 if forward else (bi - ti) % 12
    return _LIFE_CYCLE_ORDER[diff]
