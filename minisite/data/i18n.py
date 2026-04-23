"""UI strings for English and Thai."""

STRINGS = {
    "app.title": {
        "en": "Saju Thai — Korean Four Pillars",
        "th": "ซาจูไทย — ดวงสี่เสาเกาหลี",
    },
    "app.subtitle": {
        "en": "Your Korean-style birth chart, with true-solar-time correction for your birth city.",
        "th": "ดวงสี่เสาแบบเกาหลีของคุณ พร้อมปรับเวลาสุริยะจริงตามเมืองที่เกิด",
    },
    "lang.label": {"en": "Language", "th": "ภาษา"},

    "form.header":  {"en": "Your birth details", "th": "ข้อมูลการเกิดของคุณ"},
    "form.name":    {"en": "Name (optional)",   "th": "ชื่อ (ไม่บังคับ)"},
    "form.gender":  {"en": "Gender", "th": "เพศ"},
    "form.gender.female": {"en": "Female", "th": "หญิง"},
    "form.gender.male":   {"en": "Male",   "th": "ชาย"},
    "form.date":    {"en": "Birth date (solar calendar)", "th": "วันเกิด (สุริยคติ)"},
    "form.time":    {"en": "Birth time", "th": "เวลาเกิด"},
    "form.time.unknown": {"en": "Time unknown (use 12:00)", "th": "ไม่ทราบเวลา (ใช้ 12:00)"},
    "form.country": {"en": "Birth country", "th": "ประเทศที่เกิด"},
    "form.city":    {"en": "Birth city",    "th": "เมืองที่เกิด"},
    "form.submit":  {"en": "Calculate Saju", "th": "คำนวณซาจู"},

    "result.profile":  {"en": "Profile", "th": "ข้อมูลของคุณ"},
    "result.local":    {"en": "Local time", "th": "เวลาท้องถิ่น"},
    "result.corrected":{"en": "True solar time (KST reference)", "th": "เวลาสุริยะจริง (อ้างอิง KST)"},
    "result.solar_shift": {"en": "Local solar correction", "th": "ปรับเวลาสุริยะตามพื้นที่"},
    "result.total_shift": {"en": "Total shift from local clock", "th": "ปรับรวมจากเวลาท้องถิ่น"},
    "result.minutes":  {"en": "min", "th": "นาที"},
    "result.lunar":    {"en": "Lunar date", "th": "วันจันทรคติ"},
    "result.day_master":{"en": "Day Master", "th": "แกนของดวง (Day Master)"},

    "pillars.header": {"en": "Four Pillars (사주팔자)", "th": "สี่เสาชะตา (사주팔자)"},
    "pillars.year":   {"en": "Year",  "th": "ปี"},
    "pillars.month":  {"en": "Month", "th": "เดือน"},
    "pillars.day":    {"en": "Day",   "th": "วัน"},
    "pillars.hour":   {"en": "Hour",  "th": "ชั่วโมง"},
    "pillars.stem":   {"en": "Heavenly Stem", "th": "ฟ้า (ก้าน)"},
    "pillars.branch": {"en": "Earthly Branch", "th": "ดิน (กิ่ง)"},
    "pillars.ten_god_stem":  {"en": "Ten God (stem)",   "th": "สิบเทพ (ก้าน)"},
    "pillars.ten_god_branch":{"en": "Ten God (branch)", "th": "สิบเทพ (กิ่ง)"},
    "pillars.hidden":     {"en": "Hidden Stems (지장간)", "th": "ก้านซ่อน (지장간)"},
    "pillars.life_stage": {"en": "12 Stages (운성)", "th": "12 ระยะชีวิต (운성)"},

    "nobles.header":      {"en": "Auspicious & Inauspicious Stars (귀인 · 신살)",
                           "th": "ดาวมงคลและดาวภัย (귀인 · 신살)"},
    "nobles.stem_row":    {"en": "Stem",   "th": "ก้าน"},
    "nobles.branch_row":  {"en": "Branch", "th": "กิ่ง"},
    "nobles.none":        {"en": "—", "th": "—"},

    "daewoon.header":  {"en": "Great Luck Cycles (대운)", "th": "วัฏจักรโชคใหญ่ (대운)"},
    "daewoon.start":   {"en": "Starts at age", "th": "เริ่มเมื่ออายุ"},
    "daewoon.direction":{"en": "Direction", "th": "ทิศทาง"},
    "daewoon.forward": {"en": "forward (순행)", "th": "ไปข้างหน้า (순행)"},
    "daewoon.backward":{"en": "backward (역행)", "th": "ถอยหลัง (역행)"},
    "daewoon.years":   {"en": "yrs", "th": "ปี"},
    "daewoon.months":  {"en": "mo",  "th": "เดือน"},

    "sewoon.header":   {"en": "Yearly Run (세운)", "th": "ดวงรายปี (세운)"},

    "footer.disclaimer": {
        "en": "Educational tool. For paid readings you will receive a full astro-seek interpretation.",
        "th": "เครื่องมือเพื่อการศึกษา สำหรับการอ่านดวงแบบชำระเงิน คุณจะได้รับการตีความ astro-seek แบบเต็มรูปแบบ",
    },
}


def t(key: str, lang: str) -> str:
    entry = STRINGS.get(key)
    if not entry:
        return key
    return entry.get(lang) or entry.get("en") or key
