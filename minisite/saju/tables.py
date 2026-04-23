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


# Day-master narratives: a one-sentence description of the personality the
# birth-day stem evokes. These are the lines users see right under their
# day master, so they are deliberately friendly and image-led.
DAY_MASTER_NARRATIVE = {
    "甲": {
        "image_en": "Towering Tree", "image_th": "ต้นไม้ใหญ่ตั้งตรง",
        "ko": "큰 나무처럼 곧고 굳센 기운을 타고났습니다.",
        "en": "You carry the steady, upright energy of a tall tree reaching for the sky.",
        "th": "คุณมีพลังของต้นไม้ใหญ่ที่ตั้งตรงและมั่นคง พุ่งสู่ท้องฟ้า",
    },
    "乙": {
        "image_en": "Wildflower & Vine", "image_th": "ดอกไม้ป่าและเถาวัลย์",
        "ko": "들꽃과 덩굴처럼 부드럽고 끈질긴 기운을 가졌습니다.",
        "en": "You move like grass and wildflowers — soft to the touch, but quietly unstoppable.",
        "th": "คุณเคลื่อนไหวเหมือนหญ้าและดอกไม้ป่า อ่อนโยนแต่หยุดไม่ได้",
    },
    "丙": {
        "image_en": "Bright Sun", "image_th": "ดวงอาทิตย์เจิดจ้า",
        "ko": "한낮의 태양처럼 밝고 뜨거운 기운을 타고났습니다.",
        "en": "You shine like the midday sun — warm, generous, and impossible to ignore.",
        "th": "คุณส่องสว่างเหมือนดวงอาทิตย์เที่ยงวัน อบอุ่น ใจกว้าง และมองข้ามไม่ได้",
    },
    "丁": {
        "image_en": "Candle Flame", "image_th": "เปลวเทียน",
        "ko": "촛불과 등불처럼 따뜻하고 섬세한 기운을 가졌습니다.",
        "en": "You glow like a candle flame — gentle, precise, and quietly illuminating.",
        "th": "คุณส่องประกายเหมือนเปลวเทียน อ่อนโยน ละเอียด และสว่างไสวอย่างเงียบงัน",
    },
    "戊": {
        "image_en": "Great Mountain", "image_th": "ภูเขาใหญ่",
        "ko": "큰 산처럼 묵직하고 너그러운 기운을 타고났습니다.",
        "en": "You stand like a great mountain — grounded, generous, sheltering those around you.",
        "th": "คุณตั้งมั่นเหมือนภูเขาใหญ่ หนักแน่น ใจกว้าง คอยปกป้องคนรอบข้าง",
    },
    "己": {
        "image_en": "Fertile Field", "image_th": "ทุ่งนาอุดมสมบูรณ์",
        "ko": "비옥한 들판처럼 부드럽고 품이 넓은 기운을 가졌습니다.",
        "en": "You nurture like fertile soil — quietly making everything around you grow.",
        "th": "คุณบำรุงเหมือนผืนดินอุดมสมบูรณ์ ทำให้ทุกสิ่งรอบตัวเติบโตอย่างเงียบงัน",
    },
    "庚": {
        "image_en": "Forged Steel", "image_th": "เหล็กกล้าหลอม",
        "ko": "단단한 강철처럼 강인하고 결단력 있는 기운을 타고났습니다.",
        "en": "You move with the cut and resolve of forged steel — decisive, sharp, never half-hearted.",
        "th": "คุณเคลื่อนไหวด้วยความเด็ดขาดของเหล็กกล้าหลอม คมชัด ไม่ลังเล",
    },
    "辛": {
        "image_en": "Polished Jewel", "image_th": "อัญมณีเจียระไน",
        "ko": "빛나는 보석과 같이 섬세하고 자존심 강한 기운을 가졌습니다.",
        "en": "You sparkle like a polished gem — refined, particular, and quietly proud.",
        "th": "คุณเปล่งประกายเหมือนอัญมณีเจียระไน ประณีต พิถีพิถัน และภาคภูมิเงียบ ๆ",
    },
    "壬": {
        "image_en": "Vast Ocean", "image_th": "มหาสมุทรกว้างใหญ่",
        "ko": "큰 바다처럼 넓고 깊은 흐름의 기운을 타고났습니다.",
        "en": "You flow like a vast ocean — wide-minded, deep, carrying everything in motion.",
        "th": "คุณไหลเหมือนมหาสมุทรกว้างใหญ่ ใจเปิดกว้าง ลึก พาทุกสิ่งเคลื่อนไหว",
    },
    "癸": {
        "image_en": "Morning Dew", "image_th": "หยาดน้ำค้างยามเช้า",
        "ko": "이슬과 가랑비처럼 맑고 영민한 기운을 가졌습니다.",
        "en": "You arrive like morning dew — clear, perceptive, refreshing the world without forcing it.",
        "th": "คุณปรากฏเหมือนหยาดน้ำค้างยามเช้า ใส กระจ่าง ทำให้โลกสดชื่นโดยไม่บังคับ",
    },
}


def day_master_narrative(stem_char: str, lang: str) -> dict:
    """Return image label + sentence for a stem in the requested language."""
    n = DAY_MASTER_NARRATIVE[stem_char]
    image = n["image_th"] if lang == "th" else n["image_en"]
    text  = n.get(lang) or n["en"]
    return {"image": image, "text": text}


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
