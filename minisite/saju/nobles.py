"""Auspicious stars (吉神 / 귀인) computed from standard Korean-saju tables.

All lookups key off either the day stem (日干) or the year / day branch
(年支 / 日支). Returns per-pillar flags so the UI can mark which of the
four pillars' 地支 holds which noble.
"""

# 천을귀인 Tianyi Noble — classical table keyed by 日干
# (甲戊庚: 丑未, 乙己: 申子, 丙丁: 亥酉, 辛: 寅午, 壬癸: 卯巳)
CHEONEUL_GUIIN = {
    "甲": ("丑", "未"),
    "戊": ("丑", "未"),
    "庚": ("丑", "未"),
    "乙": ("申", "子"),
    "己": ("申", "子"),
    "丙": ("亥", "酉"),
    "丁": ("亥", "酉"),
    "辛": ("寅", "午"),
    "壬": ("卯", "巳"),
    "癸": ("卯", "巳"),
}

# 문창귀인 Munchang Noble — 日干 → 地支 (hidden talent/academic)
MUNCHANG_GUIIN = {
    "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申",
    "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯",
}

# 학당귀인 Hakdang Noble — 日干 → 地支 (study / scholar)
HAKDANG_GUIIN = {
    "甲": "亥", "乙": "午", "丙": "寅", "丁": "酉", "戊": "寅",
    "己": "酉", "庚": "巳", "辛": "子", "壬": "申", "癸": "卯",
}

# 역마살 Traveling Horse — keyed by 年支 or 日支
# 申子辰→寅,  巳酉丑→亥,  寅午戌→申,  亥卯未→巳
YEOKMA_MAP = {
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳",
}

# 도화살 Peach Blossom — keyed by 年支 or 日支
DOHWA_MAP = {
    "申": "酉", "子": "酉", "辰": "酉",
    "巳": "午", "酉": "午", "丑": "午",
    "寅": "卯", "午": "卯", "戌": "卯",
    "亥": "子", "卯": "子", "未": "子",
}

# 화개살 Arts Canopy — keyed by 年支 or 日支
HWAGAE_MAP = {
    "申": "辰", "子": "辰", "辰": "辰",
    "巳": "丑", "酉": "丑", "丑": "丑",
    "寅": "戌", "午": "戌", "戌": "戌",
    "亥": "未", "卯": "未", "未": "未",
}


NOBLE_META = {
    "cheoneul":  {"ko": "천을귀인", "en": "Heavenly Noble",    "th": "ขุนนางสวรรค์"},
    "munchang":  {"ko": "문창귀인", "en": "Literary Noble",    "th": "ขุนนางอักษร"},
    "hakdang":   {"ko": "학당귀인", "en": "Scholar Noble",     "th": "ขุนนางวิชาการ"},
    "yeokma":    {"ko": "역마살",   "en": "Traveling Horse",   "th": "ดาวเดินทาง"},
    "dohwa":     {"ko": "도화살",   "en": "Peach Blossom",     "th": "ดาวเสน่ห์"},
    "hwagae":    {"ko": "화개살",   "en": "Arts Canopy",       "th": "ดาวศิลปะ"},
}


def compute_nobles(day_gan: str, year_zhi: str, day_zhi: str,
                   branches: list[str]) -> dict[str, list[bool]]:
    """Returns dict mapping noble_key -> [year, month, day, hour] booleans
    indicating which pillar's branch carries that noble/sha."""

    cheoneul_targets = CHEONEUL_GUIIN.get(day_gan, ())
    munchang_target = MUNCHANG_GUIIN.get(day_gan)
    hakdang_target = HAKDANG_GUIIN.get(day_gan)

    # For yeokma/dohwa/hwagae, conventionally key off year OR day branch;
    # we mark the pillar if its branch matches either trigger.
    ym_targets  = {YEOKMA_MAP.get(year_zhi),  YEOKMA_MAP.get(day_zhi)} - {None}
    dh_targets  = {DOHWA_MAP.get(year_zhi),   DOHWA_MAP.get(day_zhi)} - {None}
    hg_targets  = {HWAGAE_MAP.get(year_zhi),  HWAGAE_MAP.get(day_zhi)} - {None}

    return {
        "cheoneul":  [b in cheoneul_targets for b in branches],
        "munchang":  [b == munchang_target for b in branches],
        "hakdang":   [b == hakdang_target  for b in branches],
        "yeokma":    [b in ym_targets for b in branches],
        "dohwa":     [b in dh_targets for b in branches],
        "hwagae":    [b in hg_targets for b in branches],
    }
