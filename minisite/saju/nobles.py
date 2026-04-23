"""Auspicious stars and inauspicious omens (길성 / 신살) used in Korean saju.

Each 신살 attaches to either a pillar's heavenly stem (천간) or its earthly
branch (지지). The output structure mirrors that distinction so the UI can
render two separate rows per pillar exactly like the Posteller / Cheon-eul
Guiin reference layouts.
"""

from typing import Literal

PillarIdx = Literal[0, 1, 2, 3]  # year, month, day, hour (engine order)


# ── Branch-keyed nobles, keyed off the day stem (일간) ───────────────────────

# 천을귀인 — classical pair per day stem
CHEONEUL_GUIIN = {
    "甲": ("丑", "未"), "戊": ("丑", "未"), "庚": ("丑", "未"),
    "乙": ("申", "子"), "己": ("申", "子"),
    "丙": ("亥", "酉"), "丁": ("亥", "酉"),
    "辛": ("寅", "午"),
    "壬": ("卯", "巳"), "癸": ("卯", "巳"),
}

MUNCHANG_GUIIN = {
    "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申",
    "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯",
}

HAKDANG_GUIIN = {
    "甲": "亥", "乙": "午", "丙": "寅", "丁": "酉", "戊": "寅",
    "己": "酉", "庚": "巳", "辛": "子", "壬": "申", "癸": "卯",
}

# 양인살 — day-stem keyed branch (yang-stem strict; yin-stem variant kept for completeness)
YANGIN_SAL = {
    "甲": "卯", "丙": "午", "戊": "午", "庚": "酉", "壬": "子",
    "乙": "寅", "丁": "巳", "己": "巳", "辛": "申", "癸": "亥",
}


# ── Branch-keyed shensha, computed from year-or-day branch group ───────────

# Three-branch group lookups: 삼합 keys → target branch
_TRIO = {
    ("申", "子", "辰"): "water_trio",
    ("巳", "酉", "丑"): "metal_trio",
    ("寅", "午", "戌"): "fire_trio",
    ("亥", "卯", "未"): "wood_trio",
}

def _trio_of(branch: str) -> str | None:
    for trio, name in _TRIO.items():
        if branch in trio:
            return name
    return None


# Each row: trio_name → target branch
TRIO_BRANCH_NOBLES = {
    "yeokma":   {"water_trio": "寅", "metal_trio": "亥", "fire_trio": "申", "wood_trio": "巳"},
    "dohwa":    {"water_trio": "酉", "metal_trio": "午", "fire_trio": "卯", "wood_trio": "子"},
    "hwagae":   {"water_trio": "辰", "metal_trio": "丑", "fire_trio": "戌", "wood_trio": "未"},
    "mangsin":  {"water_trio": "亥", "metal_trio": "申", "fire_trio": "巳", "wood_trio": "寅"},
    "geob":     {"water_trio": "巳", "metal_trio": "寅", "fire_trio": "亥", "wood_trio": "申"},
    "jae":      {"water_trio": "午", "metal_trio": "卯", "fire_trio": "子", "wood_trio": "酉"},
    "ji":       {"water_trio": "申", "metal_trio": "巳", "fire_trio": "寅", "wood_trio": "亥"},
    "cheonsal": {"water_trio": "未", "metal_trio": "辰", "fire_trio": "丑", "wood_trio": "戌"},
    "wolsal":   {"water_trio": "戌", "metal_trio": "未", "fire_trio": "辰", "wood_trio": "丑"},
    "banan":    {"water_trio": "丑", "metal_trio": "戌", "fire_trio": "未", "wood_trio": "辰"},
    "jangseong":{"water_trio": "子", "metal_trio": "酉", "fire_trio": "午", "wood_trio": "卯"},
    "yukhae":   {"water_trio": "卯", "metal_trio": "子", "fire_trio": "酉", "wood_trio": "午"},
}

# 월덕귀인 — keyed off month branch trio → favorable stem (matched against pillar stems)
WOLDEOK_GUIIN_STEM = {
    "water_trio": "壬", "metal_trio": "庚", "fire_trio": "丙", "wood_trio": "甲",
}

# 천덕귀인 — per month branch → stem or branch (Korean classical table)
# Some months target a stem, some a branch.
CHEONDEOK_GUIIN = {
    "寅": ("stem", "丁"),  "卯": ("branch", "申"),
    "辰": ("stem", "壬"),  "巳": ("stem", "辛"),
    "午": ("branch", "亥"),"未": ("stem", "甲"),
    "申": ("stem", "癸"),  "酉": ("branch", "寅"),
    "戌": ("stem", "丙"),  "亥": ("stem", "乙"),
    "子": ("branch", "巳"),"丑": ("stem", "庚"),
}


# ── Branch-keyed shensha based on specific branches alone ─────────────────

# 천문성 / 천의성 — both attach to 戌 / 亥 in classical Korean usage
CHEONMUN_BRANCHES = {"戌", "亥"}
CHEONUI_BRANCHES  = {"戌", "亥"}


# ── Stem-keyed nobles based on the pillar's own stem character ────────────

# 현침살 — characters that "look like needles"; classically 甲 申 卯 午
HYEONCHIM_CHARS = {"甲", "申", "卯", "午"}


# ── Full-ganzhi keyed (the entire pillar's stem+branch) ───────────────────

BAEKHO_DAESAL = {"甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"}
GOEGANG_SAL   = {"庚辰", "庚戌", "壬辰", "壬戌"}
HWANGEUN_DAESA = {  # 황은대사 — auspicious "imperial favor" pillars
    "甲戌", "乙丑", "丙寅", "丁卯", "戊辰", "己巳",
    "庚午", "辛未", "壬申", "癸酉",
}


NOBLE_META = {
    # ── Branch-attached ───────────────────────────────────────────────────
    "cheoneul":   {"ko": "천을귀인", "en": "Helper",         "th": "ผู้ช่วย"},
    "munchang":   {"ko": "문창귀인", "en": "Academic",       "th": "การเรียน"},
    "hakdang":    {"ko": "학당귀인", "en": "Study",          "th": "การเรียน"},
    "yangin":     {"ko": "양인살",   "en": "Power",          "th": "พลังแรง"},
    "yeokma":     {"ko": "역마살",   "en": "Movement",       "th": "การเดินทาง"},
    "dohwa":      {"ko": "도화살",   "en": "Charm",          "th": "เสน่ห์"},
    "hwagae":     {"ko": "화개살",   "en": "Artist",         "th": "ศิลปิน"},
    "mangsin":    {"ko": "망신살",   "en": "Reputation Hit", "th": "เสียภาพลักษณ์"},
    "geob":       {"ko": "겁살",     "en": "Loss",           "th": "สูญเสีย"},
    "jae":        {"ko": "재살",     "en": "Disaster",       "th": "เคราะห์"},
    "ji":         {"ko": "지살",     "en": "Relocation",     "th": "การย้าย"},
    "cheonsal":   {"ko": "천살",     "en": "Sudden Risk",    "th": "เสี่ยงฉับพลัน"},
    "wolsal":     {"ko": "월살",     "en": "Stagnation",     "th": "ซบเซา"},
    "banan":      {"ko": "반안살",   "en": "Honor",          "th": "เกียรติยศ"},
    "jangseong":  {"ko": "장성살",   "en": "Leader Power",   "th": "พลังผู้นำ"},
    "yukhae":     {"ko": "육해살",   "en": "Obstruction",    "th": "อุปสรรค"},
    "cheonmun":   {"ko": "천문성",   "en": "Heaven Gate",    "th": "ประตูสวรรค์"},
    "cheonui":    {"ko": "천의성",   "en": "Healer",         "th": "หมอ"},
    # ── Stem-attached ─────────────────────────────────────────────────────
    "woldeok":    {"ko": "월덕귀인", "en": "Protection",     "th": "การคุ้มครอง"},
    "cheondeok":  {"ko": "천덕귀인", "en": "Blessing",       "th": "บุญ"},
    "hyeonchim":  {"ko": "현침살",   "en": "Sharp Edge",     "th": "คมกริบ"},
    # ── Full-pillar ───────────────────────────────────────────────────────
    "baekho":     {"ko": "백호대살", "en": "Danger",         "th": "อันตราย"},
    "goegang":    {"ko": "괴강살",   "en": "Dominant",       "th": "แข็งแกร่ง"},
    "hwangeun":   {"ko": "황은대사", "en": "Imperial Grace", "th": "พระราชทาน"},
}


def compute_nobles(
    *,
    day_gan: str,
    year_zhi: str,
    day_zhi: str,
    month_zhi: str,
    pillar_stems: list[str],     # [year, month, day, hour]
    pillar_branches: list[str],  # [year, month, day, hour]
    pillar_ganzhi: list[str],    # [year, month, day, hour] full ganzhi
) -> dict[str, dict[str, list[bool]]]:
    """Returns:
        {
          noble_key: {
            "on_stem":   [year, month, day, hour] flags (attached to 천간),
            "on_branch": [year, month, day, hour] flags (attached to 지지),
          }, ...
        }
    Pillars marked as 'on_stem' or 'on_branch' depending on which side of
    the pillar the shensha attaches to in classical doctrine.
    """

    cheoneul_targets = set(CHEONEUL_GUIIN.get(day_gan, ()))
    munchang_target  = MUNCHANG_GUIIN.get(day_gan)
    hakdang_target   = HAKDANG_GUIIN.get(day_gan)
    yangin_target    = YANGIN_SAL.get(day_gan)

    year_trio = _trio_of(year_zhi)
    day_trio  = _trio_of(day_zhi)
    month_trio = _trio_of(month_zhi)

    def _trio_targets(noble_key: str) -> set[str]:
        table = TRIO_BRANCH_NOBLES[noble_key]
        return {table[t] for t in (year_trio, day_trio) if t} - {None}

    woldeok_stem = WOLDEOK_GUIIN_STEM.get(month_trio) if month_trio else None
    cheondeok = CHEONDEOK_GUIIN.get(month_zhi)  # ("stem"|"branch", char)

    branch_flags = lambda targets: [b in targets for b in pillar_branches]
    stem_flags   = lambda targets: [s in targets for s in pillar_stems]
    full_flags   = lambda targets: [gz in targets for gz in pillar_ganzhi]

    out: dict[str, dict[str, list[bool]]] = {}

    def add(key: str, *, stem=None, branch=None):
        out[key] = {
            "on_stem":   stem if stem is not None else [False] * 4,
            "on_branch": branch if branch is not None else [False] * 4,
        }

    # Branch-attached
    add("cheoneul",  branch=branch_flags(cheoneul_targets))
    add("munchang",  branch=branch_flags({munchang_target} if munchang_target else set()))
    add("hakdang",   branch=branch_flags({hakdang_target}  if hakdang_target  else set()))
    add("yangin",    branch=branch_flags({yangin_target}   if yangin_target   else set()))
    add("yeokma",    branch=branch_flags(_trio_targets("yeokma")))
    add("dohwa",     branch=branch_flags(_trio_targets("dohwa")))
    add("hwagae",    branch=branch_flags(_trio_targets("hwagae")))
    add("mangsin",   branch=branch_flags(_trio_targets("mangsin")))
    add("geob",      branch=branch_flags(_trio_targets("geob")))
    add("jae",       branch=branch_flags(_trio_targets("jae")))
    add("ji",        branch=branch_flags(_trio_targets("ji")))
    add("cheonsal",  branch=branch_flags(_trio_targets("cheonsal")))
    add("wolsal",    branch=branch_flags(_trio_targets("wolsal")))
    add("banan",     branch=branch_flags(_trio_targets("banan")))
    add("jangseong", branch=branch_flags(_trio_targets("jangseong")))
    add("yukhae",    branch=branch_flags(_trio_targets("yukhae")))
    add("cheonmun",  branch=branch_flags(CHEONMUN_BRANCHES))
    add("cheonui",   branch=branch_flags(CHEONUI_BRANCHES))

    # Stem-attached
    add("woldeok",   stem=stem_flags({woldeok_stem} if woldeok_stem else set()))
    add("hyeonchim", stem=stem_flags(HYEONCHIM_CHARS),
                     branch=branch_flags(HYEONCHIM_CHARS))
    if cheondeok:
        side, ch = cheondeok
        if side == "stem":
            add("cheondeok", stem=stem_flags({ch}))
        else:
            add("cheondeok", branch=branch_flags({ch}))
    else:
        add("cheondeok")

    # Full-pillar
    add("baekho",   stem=full_flags(BAEKHO_DAESAL))   # render on stem row visually
    add("goegang",  stem=full_flags(GOEGANG_SAL))
    add("hwangeun", stem=full_flags(HWANGEUN_DAESA))

    return out
