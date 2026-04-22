"""Lookup tables for converting Chinese characters (lunar_python output)
to Korean Hangul, pinyin-style romanization, and English meanings.

The target audiences are Thai and English readers who are unfamiliar with
Korean/Chinese astrology terminology, so every symbol carries both a phonetic
transliteration and a short English gloss.
"""

# Heavenly stems (天干)
STEMS = {
    "甲": {"ko": "갑", "roman": "Gap",   "en": "Yang Wood",   "element": "wood",  "polarity": "yang"},
    "乙": {"ko": "을", "roman": "Eul",   "en": "Yin Wood",    "element": "wood",  "polarity": "yin"},
    "丙": {"ko": "병", "roman": "Byeong","en": "Yang Fire",   "element": "fire",  "polarity": "yang"},
    "丁": {"ko": "정", "roman": "Jeong", "en": "Yin Fire",    "element": "fire",  "polarity": "yin"},
    "戊": {"ko": "무", "roman": "Mu",    "en": "Yang Earth",  "element": "earth", "polarity": "yang"},
    "己": {"ko": "기", "roman": "Gi",    "en": "Yin Earth",   "element": "earth", "polarity": "yin"},
    "庚": {"ko": "경", "roman": "Gyeong","en": "Yang Metal",  "element": "metal", "polarity": "yang"},
    "辛": {"ko": "신", "roman": "Sin",   "en": "Yin Metal",   "element": "metal", "polarity": "yin"},
    "壬": {"ko": "임", "roman": "Im",    "en": "Yang Water",  "element": "water", "polarity": "yang"},
    "癸": {"ko": "계", "roman": "Gye",   "en": "Yin Water",   "element": "water", "polarity": "yin"},
}

# Earthly branches (地支)
BRANCHES = {
    "子": {"ko": "자", "roman": "Ja",    "en": "Rat",     "element": "water", "polarity": "yang"},
    "丑": {"ko": "축", "roman": "Chuk",  "en": "Ox",      "element": "earth", "polarity": "yin"},
    "寅": {"ko": "인", "roman": "In",    "en": "Tiger",   "element": "wood",  "polarity": "yang"},
    "卯": {"ko": "묘", "roman": "Myo",   "en": "Rabbit",  "element": "wood",  "polarity": "yin"},
    "辰": {"ko": "진", "roman": "Jin",   "en": "Dragon",  "element": "earth", "polarity": "yang"},
    "巳": {"ko": "사", "roman": "Sa",    "en": "Snake",   "element": "fire",  "polarity": "yin"},
    "午": {"ko": "오", "roman": "O",     "en": "Horse",   "element": "fire",  "polarity": "yang"},
    "未": {"ko": "미", "roman": "Mi",    "en": "Goat",    "element": "earth", "polarity": "yin"},
    "申": {"ko": "신", "roman": "Sin",   "en": "Monkey",  "element": "metal", "polarity": "yang"},
    "酉": {"ko": "유", "roman": "Yu",    "en": "Rooster", "element": "metal", "polarity": "yin"},
    "戌": {"ko": "술", "roman": "Sul",   "en": "Dog",     "element": "earth", "polarity": "yang"},
    "亥": {"ko": "해", "roman": "Hae",   "en": "Pig",     "element": "water", "polarity": "yin"},
}

# Ten Gods (十神) - lunar_python returns simplified Chinese; map to Korean + English
TEN_GODS = {
    "比肩":   {"ko": "비견",   "en": "Friend",       "th": "เพื่อนร่วมทาง"},
    "劫财":   {"ko": "겁재",   "en": "Rival",        "th": "คู่แข่ง"},
    "食神":   {"ko": "식신",   "en": "Eating God",   "th": "เทพอาหาร"},
    "伤官":   {"ko": "상관",   "en": "Hurting Officer", "th": "ผู้บั่นทอนอำนาจ"},
    "偏财":   {"ko": "편재",   "en": "Indirect Wealth", "th": "ทรัพย์ทางอ้อม"},
    "正财":   {"ko": "정재",   "en": "Direct Wealth",   "th": "ทรัพย์ทางตรง"},
    "七杀":   {"ko": "편관",   "en": "Seven Killings",  "th": "เจ็ดสังหาร"},
    "正官":   {"ko": "정관",   "en": "Direct Officer",  "th": "ขุนนางทางตรง"},
    "偏印":   {"ko": "편인",   "en": "Indirect Resource", "th": "ผู้อุปถัมภ์ทางอ้อม"},
    "正印":   {"ko": "정인",   "en": "Direct Resource",   "th": "ผู้อุปถัมภ์ทางตรง"},
    "日主":   {"ko": "일간",   "en": "Day Master",        "th": "แกนของดวง"},
}

# 12 Life Stages (十二運星)
LIFE_STAGES = {
    "长生": {"ko": "장생", "en": "Birth",      "th": "เกิดใหม่"},
    "沐浴": {"ko": "목욕", "en": "Bathing",    "th": "ชำระล้าง"},
    "冠带": {"ko": "관대", "en": "Cap & Sash", "th": "แต่งตัว"},
    "临官": {"ko": "임관", "en": "Official",   "th": "รับตำแหน่ง"},
    "帝旺": {"ko": "제왕", "en": "Prosperity", "th": "รุ่งเรือง"},
    "衰":   {"ko": "쇠",   "en": "Decline",    "th": "เสื่อมถอย"},
    "病":   {"ko": "병",   "en": "Sickness",   "th": "ป่วย"},
    "死":   {"ko": "사",   "en": "Death",      "th": "ตาย"},
    "墓":   {"ko": "묘",   "en": "Tomb",       "th": "หลุมฝัง"},
    "绝":   {"ko": "절",   "en": "Extinction", "th": "สูญสิ้น"},
    "胎":   {"ko": "태",   "en": "Conception", "th": "ตั้งครรภ์"},
    "养":   {"ko": "양",   "en": "Nurture",    "th": "ฟูมฟัก"},
}

# Five elements
ELEMENTS = {
    "wood":  {"ko": "목", "hanzi": "木", "en": "Wood",  "th": "ไม้",  "color": "#4CAF50"},
    "fire":  {"ko": "화", "hanzi": "火", "en": "Fire",  "th": "ไฟ",   "color": "#F44336"},
    "earth": {"ko": "토", "hanzi": "土", "en": "Earth", "th": "ดิน",  "color": "#FFB300"},
    "metal": {"ko": "금", "hanzi": "金", "en": "Metal", "th": "โลหะ", "color": "#9E9E9E"},
    "water": {"ko": "수", "hanzi": "水", "en": "Water", "th": "น้ำ",  "color": "#2196F3"},
}


def stem(ch: str) -> dict:
    return STEMS[ch]


def branch(ch: str) -> dict:
    return BRANCHES[ch]


def ten_god(name: str) -> dict:
    return TEN_GODS.get(name, {"ko": name, "en": name, "th": name})


def life_stage(name: str) -> dict:
    return LIFE_STAGES.get(name, {"ko": name, "en": name, "th": name})


def ganzhi_ko(gz: str) -> str:
    """Convert a two-character ganzhi (e.g. '戊辰') to Korean ('무진')."""
    if len(gz) != 2:
        return gz
    return STEMS[gz[0]]["ko"] + BRANCHES[gz[1]]["ko"]


def ganzhi_roman(gz: str) -> str:
    if len(gz) != 2:
        return gz
    return STEMS[gz[0]]["roman"] + " " + BRANCHES[gz[1]]["roman"]
