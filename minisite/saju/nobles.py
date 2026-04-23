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


# ── Additional day-stem-keyed nobles ───────────────────────────────────────

# 태극귀인 (太極貴人) — spiritual / research noble
TAEGEUK_GUIIN = {
    "甲": ("子", "午"), "乙": ("子", "午"),
    "丙": ("卯", "酉"), "丁": ("卯", "酉"),
    "戊": ("辰", "戌", "丑", "未"), "己": ("辰", "戌", "丑", "未"),
    "庚": ("寅", "亥"), "辛": ("寅", "亥"),
    "壬": ("巳", "申"), "癸": ("巳", "申"),
}

# 천복귀인 (天福貴人)
CHEONBOK_GUIIN = {
    "甲": "酉", "乙": "申", "丙": "子", "丁": "亥", "戊": "卯",
    "己": "寅", "庚": "午", "辛": "巳", "壬": "午", "癸": "巳",
}

# 복성귀인 (福星貴人)
BOKSEONG_GUIIN = {
    "甲": "寅", "乙": "丑", "丙": "子", "丁": "酉", "戊": "申",
    "己": "未", "庚": "午", "辛": "巳", "壬": "辰", "癸": "卯",
}

# 금여 (金輿) — luxury / comfort star
GEUMYEO = {
    "甲": "辰", "乙": "巳", "丙": "未", "丁": "申", "戊": "未",
    "己": "申", "庚": "戌", "辛": "亥", "壬": "丑", "癸": "寅",
}

# 문곡귀인 (文曲貴人)
MUNGOK_GUIIN = {
    "甲": "亥", "乙": "子", "丙": "寅", "丁": "卯", "戊": "寅",
    "己": "卯", "庚": "巳", "辛": "午", "壬": "申", "癸": "酉",
}

# 문성 (文星)
MUNSEONG = {
    "甲": "午", "乙": "巳", "丙": "申", "丁": "未", "戊": "申",
    "己": "未", "庚": "戌", "辛": "酉", "壬": "子", "癸": "亥",
}

# 지혜성 (智慧星)
JIHYE_SEONG = {
    "甲": "卯", "乙": "寅", "丙": "午", "丁": "巳", "戊": "午",
    "己": "巳", "庚": "酉", "辛": "申", "壬": "子", "癸": "亥",
}

# 홍염살 (紅艷殺)
HONGYEOM_SAL = {
    "甲": "午", "乙": "午", "丙": "寅", "丁": "未", "戊": "辰",
    "己": "辰", "庚": "戌", "辛": "酉", "壬": "子", "癸": "申",
}

# 재고귀인 (財庫貴人) — storage-of-wealth branch per day master's 재성 element
JAEGO_GUIIN = {
    "甲": "未", "乙": "未",  # wood → 재=토 → 토 storage (未)
    "丙": "丑", "丁": "丑",  # fire → 재=금 → 금 storage (丑)
    "戊": "辰", "己": "辰",  # earth → 재=수 → 수 storage (辰)
    "庚": "未", "辛": "未",  # metal → 재=목 → 목 storage (未)
    "壬": "戌", "癸": "戌",  # water → 재=화 → 화 storage (戌)
}

# 협록 (夾祿) — two pillar branches that sandwich the day stem's 건록.
# Auspicious alignment that supports stable income when both flanks appear
# in the chart.
HYEOBROK_FLANKS = {
    "甲": ("丑", "卯"),   # 녹 = 寅, flanked by 丑·卯
    "乙": ("寅", "辰"),   # 녹 = 卯
    "丙": ("辰", "午"),   # 녹 = 巳
    "丁": ("巳", "未"),   # 녹 = 午
    "戊": ("辰", "午"),   # 녹 = 巳
    "己": ("巳", "未"),   # 녹 = 午
    "庚": ("未", "酉"),   # 녹 = 申
    "辛": ("申", "戌"),   # 녹 = 酉
    "壬": ("戌", "子"),   # 녹 = 亥
    "癸": ("亥", "丑"),   # 녹 = 子
}

# Cardinal 왕지 branches — used by the popular "왕지 도화" rule that treats
# every 子·午·卯·酉 in the chart as a peach-blossom branch, regardless of
# year/day trio. Replaces the classical 12신살 rule for dohwa.
WANGJI_BRANCHES = {"子", "午", "卯", "酉"}


# ── Year-branch-season-keyed shensha (고신 / 과숙) ──────────────────────────

_SEASON = {
    "申": "autumn", "酉": "autumn", "戌": "autumn",
    "亥": "winter", "子": "winter", "丑": "winter",
    "寅": "spring", "卯": "spring", "辰": "spring",
    "巳": "summer", "午": "summer", "未": "summer",
}
GOSIN_MAP  = {"autumn": "亥", "winter": "寅", "spring": "巳", "summer": "申"}
GWASUK_MAP = {"autumn": "未", "winter": "戌", "spring": "丑", "summer": "辰"}


# ── Relational shensha (compare pillar branches against each other) ────────

CHUNG_PAIRS = [   # 육충
    {"子", "午"}, {"丑", "未"}, {"寅", "申"},
    {"卯", "酉"}, {"辰", "戌"}, {"巳", "亥"},
]
WONJIN_PAIRS = [  # 원진 (classical 6-pair list)
    {"子", "未"}, {"丑", "午"}, {"寅", "酉"},
    {"卯", "申"}, {"辰", "亥"}, {"巳", "戌"},
]
GWIMUN_PAIRS = [  # 귀문관살 — overlaps with 원진 on most pairs but 子↔酉 and 寅↔未
    {"子", "酉"}, {"丑", "午"}, {"寅", "未"},
    {"卯", "申"}, {"辰", "亥"}, {"巳", "戌"},
]
SAM_HYEONG = [   # 삼형
    {"寅", "巳", "申"},
    {"丑", "戌", "未"},
]
SANG_HYEONG = {"子", "卯"}   # 상형 (pairs when both present)
JA_HYEONG_BRANCHES = {"辰", "午", "酉", "亥"}   # 자형 (self-punish when doubled)


NOBLE_META = {
    # ── Branch-attached ───────────────────────────────────────────────────
    "cheoneul":   {"ko": "천을귀인", "en": "Heavenly Noble",       "th": "ผู้เกื้อหนุนจากฟ้า"},
    "munchang":   {"ko": "문창귀인", "en": "Scholar Star",         "th": "ดาวนักปราชญ์"},
    "hakdang":    {"ko": "학당귀인", "en": "Academic Noble",       "th": "ผู้ทรงความรู้"},
    "yangin":     {"ko": "양인살",   "en": "Blade Force",          "th": "พลังคมแรง"},
    "yeokma":     {"ko": "역마살",   "en": "Travel Star",          "th": "ดาวการเดินทาง"},
    "dohwa":      {"ko": "도화살",   "en": "Peach Blossom Star",   "th": "ดาวเสน่ห์"},
    "hwagae":     {"ko": "화개살",   "en": "Artist Star",          "th": "ดาวศิลปิน"},
    "mangsin":    {"ko": "망신살",   "en": "Reputation Loss Star", "th": "เสียภาพลักษณ์"},
    "geob":       {"ko": "겁살",     "en": "Robbery Force",        "th": "พลังสูญเสีย"},
    "jae":        {"ko": "재살",     "en": "Disaster Force",       "th": "พลังเคราะห์"},
    "ji":         {"ko": "지살",     "en": "Relocation Star",      "th": "ดาวการย้าย"},
    "cheonsal":   {"ko": "천살",     "en": "Sudden Risk Force",    "th": "ความเสี่ยงฉับพลัน"},
    "wolsal":     {"ko": "월살",     "en": "Stagnation Star",      "th": "ดาวซบเซา"},
    "banan":      {"ko": "반안살",   "en": "Honor Star",           "th": "ดาวเกียรติยศ"},
    "jangseong":  {"ko": "장성살",   "en": "General Star",         "th": "ดาวผู้นำ"},
    "yukhae":     {"ko": "육해살",   "en": "Obstruction Star",     "th": "ดาวอุปสรรค"},
    "cheonmun":   {"ko": "천문성",   "en": "Heaven Gate Star",     "th": "ดาวประตูสวรรค์"},
    "cheonui":    {"ko": "천의성",   "en": "Healer Star",          "th": "ดาวหมอ"},
    # ── Stem-attached ─────────────────────────────────────────────────────
    "woldeok":    {"ko": "월덕귀인", "en": "Lunar Virtue Noble",   "th": "บุญคุ้มครอง"},
    "cheondeok":  {"ko": "천덕귀인", "en": "Virtue Noble",         "th": "ผู้มีบุญหนุน"},
    "hyeonchim":  {"ko": "현침살",   "en": "Sharp Edge Star",      "th": "ดาวคมกริบ"},
    # ── Full-pillar ───────────────────────────────────────────────────────
    "baekho":     {"ko": "백호대살", "en": "White Tiger Force",    "th": "พลังอันตราย"},
    "goegang":    {"ko": "괴강살",   "en": "Dominant Force",       "th": "พลังแข็งแกร่ง"},
    "hwangeun":   {"ko": "황은대사", "en": "Imperial Grace",       "th": "พระราชทาน"},

    # ── Extra day-stem-keyed nobles ───────────────────────────────────────
    "taegeuk":    {"ko": "태극귀인", "en": "Spiritual Noble",      "th": "ผู้มีพลังจิต"},
    "cheonbok":   {"ko": "천복귀인", "en": "Fortune Noble",        "th": "ผู้มีโชคหนุน"},
    "bokseong":   {"ko": "복성귀인", "en": "Blessing Star",        "th": "ดาวแห่งโชค"},
    "geumyeo":    {"ko": "금여",     "en": "Luxury Star",          "th": "ดาวความหรู"},
    "mungok":     {"ko": "문곡귀인", "en": "Talent Star",          "th": "ดาวพรสวรรค์"},
    "munseong":   {"ko": "문성",     "en": "Writing Star",         "th": "ดาวการเขียน"},
    "jihye":      {"ko": "지혜성",   "en": "Wisdom Star",          "th": "ดาวปัญญา"},
    "hongyeom":   {"ko": "홍염살",   "en": "Red Charm Star",       "th": "ดาวแรงดึงดูด"},
    "hamji":      {"ko": "함지",     "en": "Desire Star",          "th": "ดาวความปรารถนา"},
    "jaego":      {"ko": "재고귀인", "en": "Wealth Storage Noble", "th": "ผู้หนุนด้านเงิน"},
    "hyeobrok":   {"ko": "협록",     "en": "Stable Wealth",        "th": "เงินมั่นคง"},

    # ── Year-branch-season-keyed ──────────────────────────────────────────
    "gosin":      {"ko": "고신",     "en": "Lone Star",            "th": "ดาวโดดเดี่ยว"},
    "gwasuk":     {"ko": "과숙",     "en": "Solitude Star",        "th": "ดาวความเหงา"},

    # ── Relational (between pillars) ──────────────────────────────────────
    "chung":      {"ko": "충",       "en": "Clash Force",          "th": "พลังปะทะ"},
    "wonjin":     {"ko": "원진",     "en": "Conflict Bond",        "th": "ความขัดแย้งลึก"},
    "gwimun":     {"ko": "귀문관살", "en": "Ghost Gate Force",     "th": "พลังประตูผี"},
    "hyeong":     {"ko": "형살",     "en": "Punishment Force",     "th": "พลังโทษ"},
    "gongmang":   {"ko": "공망",     "en": "Void State",           "th": "ภาวะว่างเปล่า"},
}


PILLAR_POSITIONS = ["year", "month", "day", "hour"]


def compute_relational_shensha(
    pillar_branches: list[str],
    gongmang_branches: set[str] | None = None,
) -> dict[str, list[dict]]:
    """Return per-relation structured involvement between the four pillar branches.

    Each relation entry lists the specific pillars involved, so the UI can
    show "월지 子 ↔ 시지 午 (충)" instead of a generic chip on each pillar.
    """
    gongmang_branches = gongmang_branches or set()
    out: dict[str, list[dict]] = {k: [] for k in ("chung", "gwimun", "wonjin", "hyeong", "gongmang")}

    def _pillars(indices: list[int]) -> list[tuple[str, str]]:
        return [(PILLAR_POSITIONS[i], pillar_branches[i]) for i in indices]

    # Pair-based relations
    for i in range(4):
        for j in range(i + 1, 4):
            pair = {pillar_branches[i], pillar_branches[j]}
            if len(pair) != 2:
                continue  # same branch — not a cross-pillar pair
            if pair in CHUNG_PAIRS:
                out["chung"].append({"pillars": _pillars([i, j])})
            if pair in GWIMUN_PAIRS:
                out["gwimun"].append({"pillars": _pillars([i, j])})
            if pair in WONJIN_PAIRS:
                out["wonjin"].append({"pillars": _pillars([i, j])})

    # 형살: 삼형 (3-branch), 상형 (子-卯), 자형 (doubled branch)
    branches_set = set(pillar_branches)
    for trio in SAM_HYEONG:
        if trio.issubset(branches_set):
            hits = [k for k, b in enumerate(pillar_branches) if b in trio]
            if hits:
                out["hyeong"].append({"type": "samhyeong", "pillars": _pillars(hits)})
    if SANG_HYEONG.issubset(branches_set):
        hits = [k for k, b in enumerate(pillar_branches) if b in SANG_HYEONG]
        if hits:
            out["hyeong"].append({"type": "sanghyeong", "pillars": _pillars(hits)})
    for b in set(pillar_branches):
        if b in JA_HYEONG_BRANCHES and pillar_branches.count(b) >= 2:
            hits = [k for k, x in enumerate(pillar_branches) if x == b]
            out["hyeong"].append({"type": "jahyeong", "pillars": _pillars(hits)})

    # Gongmang — simple list of pillar+branch whose branch lands in the void set.
    for i, b in enumerate(pillar_branches):
        if b in gongmang_branches:
            out["gongmang"].append({"pillar": PILLAR_POSITIONS[i], "branch": b})

    return out


def compute_nobles(
    *,
    day_gan: str,
    year_zhi: str,
    day_zhi: str,
    month_zhi: str,
    pillar_stems: list[str],     # [year, month, day, hour]
    pillar_branches: list[str],  # [year, month, day, hour]
    pillar_ganzhi: list[str],    # [year, month, day, hour] full ganzhi
    gongmang_branches: set[str] | None = None,
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
    # 도화: 왕지 도화 (any 子·午·卯·酉 in the chart). 함지 below keeps the
    # classical 12신살 trio rule so the two still distinguish themselves.
    add("dohwa",     branch=branch_flags(WANGJI_BRANCHES))
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

    # Extra day-stem-keyed branch nobles
    add("taegeuk",  branch=branch_flags(set(TAEGEUK_GUIIN.get(day_gan, ()))))
    add("cheonbok", branch=branch_flags({CHEONBOK_GUIIN[day_gan]} if day_gan in CHEONBOK_GUIIN else set()))
    add("bokseong", branch=branch_flags({BOKSEONG_GUIIN[day_gan]} if day_gan in BOKSEONG_GUIIN else set()))
    add("geumyeo",  branch=branch_flags({GEUMYEO[day_gan]}        if day_gan in GEUMYEO        else set()))
    add("mungok",   branch=branch_flags({MUNGOK_GUIIN[day_gan]}   if day_gan in MUNGOK_GUIIN   else set()))
    add("munseong", branch=branch_flags({MUNSEONG[day_gan]}       if day_gan in MUNSEONG       else set()))
    add("jihye",    branch=branch_flags({JIHYE_SEONG[day_gan]}    if day_gan in JIHYE_SEONG    else set()))
    add("hongyeom", branch=branch_flags({HONGYEOM_SAL[day_gan]}   if day_gan in HONGYEOM_SAL   else set()))
    add("hamji",    branch=branch_flags(_trio_targets("dohwa")))   # 함지 = 도화 (synonym, classical 12신살 trio rule)
    add("jaego",    branch=branch_flags({JAEGO_GUIIN[day_gan]}    if day_gan in JAEGO_GUIIN    else set()))

    # 협록 (夾祿) — only lights up when BOTH flanking branches are present
    # in the chart, and marks those two pillars specifically.
    hyeobrok_flags = [False] * 4
    flanks = HYEOBROK_FLANKS.get(day_gan)
    if flanks and flanks[0] in pillar_branches and flanks[1] in pillar_branches:
        hyeobrok_flags = [b in flanks for b in pillar_branches]
    add("hyeobrok", branch=hyeobrok_flags)

    # 고신 / 과숙 — year-branch season-keyed
    season = _SEASON.get(year_zhi)
    add("gosin",   branch=branch_flags({GOSIN_MAP[season]}  if season else set()))
    add("gwasuk",  branch=branch_flags({GWASUK_MAP[season]} if season else set()))

    # Relational shensha — flag every pillar involved in the relation.
    # The UI renders these in a dedicated "relational" section below using
    # compute_relational_shensha(), but we still populate per-pillar flags
    # here so the LLM chart summary can pick them up.
    chung_flags  = _relational_pair_flags(pillar_branches, CHUNG_PAIRS)
    wonjin_flags = _relational_pair_flags(pillar_branches, WONJIN_PAIRS)
    gwimun_flags = _relational_pair_flags(pillar_branches, GWIMUN_PAIRS)
    hyeong_flags = _hyeong_flags(pillar_branches)
    add("chung",  branch=chung_flags)
    add("wonjin", branch=wonjin_flags)
    add("gwimun", branch=gwimun_flags)
    add("hyeong", branch=hyeong_flags)

    # 공망 — the 2 branches voided by the day pillar's 旬
    kong_targets = gongmang_branches or set()
    add("gongmang", branch=branch_flags(kong_targets))

    return out


def _relational_pair_flags(branches: list[str], pairs: list[set[str]]) -> list[bool]:
    """Flag any pillar branch that participates in a 2-branch relation
    (e.g. 충, 원진) with another pillar's branch."""
    flags = [False] * len(branches)
    for i in range(len(branches)):
        for j in range(len(branches)):
            if i == j:
                continue
            if {branches[i], branches[j]} in pairs:
                flags[i] = True
                break
    return flags


def _hyeong_flags(branches: list[str]) -> list[bool]:
    """형살: 삼형 (3-branch), 상형 (子-卯), 자형 (doubled self)."""
    flags = [False] * len(branches)

    # 삼형 — all three must be present
    for trio in SAM_HYEONG:
        if trio.issubset(set(branches)):
            for i, b in enumerate(branches):
                if b in trio:
                    flags[i] = True

    # 상형 子-卯 — both present
    if SANG_HYEONG.issubset(set(branches)):
        for i, b in enumerate(branches):
            if b in SANG_HYEONG:
                flags[i] = True

    # 자형 — same branch appears twice or more
    for i, b in enumerate(branches):
        if b in JA_HYEONG_BRANCHES and branches.count(b) >= 2:
            flags[i] = True

    return flags
