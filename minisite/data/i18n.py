"""UI strings for English, Thai, and Korean."""

STRINGS = {
    "app.title": {
        "en": "Saju Thai — Korean Four Pillars",
        "th": "ซาจูไทย — ดวงสี่เสาเกาหลี",
        "ko": "사주 타이 — 한국식 사주팔자",
    },
    "app.subtitle": {
        "en": "Your Korean-style birth chart, with true-solar-time correction for your birth city.",
        "th": "ดวงสี่เสาแบบเกาหลีของคุณ พร้อมปรับเวลาสุริยะจริงตามเมืองที่เกิด",
        "ko": "한국식 사주팔자와 태어난 도시 기준 진태양시 보정까지 함께 제공합니다.",
    },
    # The language picker label itself stays bilingual (native + English in
    # parentheses) so every user can recognise the control, regardless of the
    # language currently selected.
    "lang.label": {
        "en": "Language",
        "th": "ภาษา (Language)",
        "ko": "언어 (Language)",
    },

    "form.header":  {"en": "Your birth details", "th": "ข้อมูลการเกิดของคุณ", "ko": "생년월일 정보"},
    "form.name":    {"en": "Name (optional)",   "th": "ชื่อ (ไม่บังคับ)", "ko": "이름 (선택)"},
    "form.gender":  {"en": "Gender", "th": "เพศ", "ko": "성별"},
    "form.gender.female": {"en": "Female", "th": "หญิง", "ko": "여자"},
    "form.gender.male":   {"en": "Male",   "th": "ชาย", "ko": "남자"},
    "form.date":    {"en": "Birth date (solar calendar)", "th": "วันเกิด (สุริยคติ)", "ko": "생년월일 (양력)"},
    "form.time":    {"en": "Birth time", "th": "เวลาเกิด", "ko": "태어난 시간"},
    "form.time.unknown": {"en": "Time unknown (use 12:00)", "th": "ไม่ทราบเวลา (ใช้ 12:00)", "ko": "시간 모름 (12:00 사용)"},
    "form.country": {"en": "Birth country", "th": "ประเทศที่เกิด", "ko": "태어난 국가"},
    "form.city":    {"en": "Birth city",    "th": "เมืองที่เกิด", "ko": "태어난 도시"},
    "form.submit":  {"en": "Calculate Saju", "th": "คำนวณซาจู", "ko": "사주 계산"},

    "result.profile":  {"en": "Profile", "th": "ข้อมูลของคุณ", "ko": "내 정보"},
    "result.local":    {"en": "Local time", "th": "เวลาท้องถิ่น", "ko": "현지 시간"},
    "result.corrected":{"en": "True solar time (KST reference)", "th": "เวลาสุริยะจริง (อ้างอิง KST)", "ko": "진태양시 (KST 기준)"},
    "result.solar_shift": {"en": "Local solar correction", "th": "ปรับเวลาสุริยะตามพื้นที่", "ko": "진태양시 보정"},
    "result.total_shift": {"en": "Total shift from local clock", "th": "ปรับรวมจากเวลาท้องถิ่น", "ko": "현지 시계 기준 총 보정"},
    "result.minutes":  {"en": "min", "th": "นาที", "ko": "분"},
    "result.lunar":    {"en": "Lunar date", "th": "วันจันทรคติ", "ko": "음력 날짜"},
    "result.lunar_tag":{"en": "Lunar", "th": "จันทรคติ", "ko": "음력"},
    "result.day_master":{"en": "Day Master", "th": "แกนของดวง (Day Master)", "ko": "일간 (Day Master)"},

    "pillars.header": {"en": "Four Pillars (사주팔자)", "th": "สี่เสาชะตา (사주팔자)", "ko": "사주팔자"},
    "pillars.year":   {"en": "Year",  "th": "ปี", "ko": "년주"},
    "pillars.month":  {"en": "Month", "th": "เดือน", "ko": "월주"},
    "pillars.day":    {"en": "Day",   "th": "วัน", "ko": "일주"},
    "pillars.hour":   {"en": "Hour",  "th": "ชั่วโมง", "ko": "시주"},
    "pillars.stem":   {"en": "Heavenly Stem", "th": "ฟ้า (ก้าน)", "ko": "천간"},
    "pillars.branch": {"en": "Earthly Branch", "th": "ดิน (กิ่ง)", "ko": "지지"},
    "pillars.ten_god_stem":  {"en": "Ten God (stem)",   "th": "สิบเทพ (ก้าน)", "ko": "십성 (천간)"},
    "pillars.ten_god_branch":{"en": "Ten God (branch)", "th": "สิบเทพ (กิ่ง)", "ko": "십성 (지지)"},
    "pillars.hidden":     {"en": "Hidden Stems (지장간)", "th": "ก้านซ่อน (지장간)", "ko": "지장간"},
    "pillars.life_stage": {"en": "12 Stages (운성)", "th": "12 ระยะชีวิต (운성)", "ko": "12운성"},

    "nobles.header":      {"en": "Auspicious & Inauspicious Stars (귀인 · 신살)",
                           "th": "ดาวมงคลและดาวภัย (귀인 · 신살)",
                           "ko": "귀인 · 신살"},
    "nobles.stem_row":    {"en": "Stem",   "th": "ก้าน", "ko": "천간"},
    "nobles.branch_row":  {"en": "Branch", "th": "กิ่ง", "ko": "지지"},
    "nobles.none":        {"en": "—", "th": "—", "ko": "—"},

    "daewoon.header":  {"en": "Great Luck Cycles (대운)", "th": "วัฏจักรโชคใหญ่ (대운)", "ko": "대운"},
    "daewoon.start":   {"en": "Starts at age", "th": "เริ่มเมื่ออายุ", "ko": "시작 나이"},
    "daewoon.direction":{"en": "Direction", "th": "ทิศทาง", "ko": "방향"},
    "daewoon.forward": {"en": "forward (순행)", "th": "ไปข้างหน้า (순행)", "ko": "순행"},
    "daewoon.backward":{"en": "backward (역행)", "th": "ถอยหลัง (역행)", "ko": "역행"},
    "daewoon.years":   {"en": "yrs", "th": "ปี", "ko": "세"},
    "daewoon.months":  {"en": "mo",  "th": "เดือน", "ko": "개월"},
    "daewoon.age":     {"en": "Age", "th": "อายุ", "ko": "세"},

    "sewoon.header":   {"en": "Yearly Run (세운)", "th": "ดวงรายปี (세운)", "ko": "세운"},
    "sewoon.year":     {"en": "Year", "th": "ปี", "ko": "년"},
    "wolun.header":    {"en": "Monthly Run (월운)", "th": "ดวงรายเดือน (월운)", "ko": "월운"},
    "wolun.sub":       {"en": "for year {year}", "th": "สำหรับปี {year}", "ko": "{year}년 기준"},
    "wolun.month":     {"en": "Month", "th": "เดือน", "ko": "월"},

    "footer.disclaimer": {
        "en": "Educational tool. For paid readings you will receive a full astro-seek interpretation.",
        "th": "เครื่องมือเพื่อการศึกษา สำหรับการอ่านดวงแบบชำระเงิน คุณจะได้รับการตีความ astro-seek แบบเต็มรูปแบบ",
        "ko": "교육용 도구입니다. 유료 리딩 구매 시 astro-seek 기반의 상세 해석이 제공됩니다.",
    },

    # ── Paid readings ─────────────────────────────────────────────────────
    "paid.header": {
        "en": "Unlock a Personalised Deep Reading",
        "th": "ปลดล็อกการอ่านเชิงลึกเฉพาะคุณ",
        "ko": "나만의 심층 리딩 잠금해제",
    },
    "paid.subtitle": {
        "en": "The free chart above is the raw blueprint. Pick a depth and Claude writes a reading from YOUR chart in seconds.",
        "th": "ดวงด้านบนคือโครงสร้างดิบ เลือกระดับความลึกแล้ว Claude จะเขียนการอ่านจากดวงของคุณในไม่กี่วินาที",
        "ko": "위쪽 무료 차트는 기본 뼈대입니다. 원하는 리딩 단계를 고르면 Claude가 당신의 사주만을 바탕으로 수 초 만에 해석을 써드립니다.",
    },
    "paid.price_suffix": {"en": "฿", "th": "฿", "ko": "฿"},
    "paid.cta": {"en": "Unlock", "th": "ปลดล็อก", "ko": "잠금해제"},
    "paid.disabled": {
        "en": "Paid readings are not configured on this deployment yet. Check back soon.",
        "th": "การอ่านแบบชำระเงินยังไม่พร้อมใช้งาน กรุณากลับมาตรวจสอบเร็ว ๆ นี้",
        "ko": "유료 리딩은 아직 설정되지 않았습니다. 잠시 후 다시 확인해 주세요.",
    },
    "paid.coming_soon": {
        "en": "Coming Soon",
        "th": "เปิดให้บริการเร็ว ๆ นี้",
        "ko": "곧 오픈",
    },
    "paid.coming_soon_note": {
        "en": "Paid deep readings launch shortly — follow along on Instagram for the go-live announcement.",
        "th": "การอ่านเชิงลึกแบบชำระเงินจะเปิดเร็ว ๆ นี้ ติดตามประกาศการเปิดให้บริการทางอินสตาแกรม",
        "ko": "유료 심층 리딩이 곧 오픈됩니다 — 오픈 소식은 인스타그램에서 확인하세요.",
    },
    "paid.unpaid": {
        "en": "This checkout hasn't been paid yet. If you just finished, wait a moment and refresh.",
        "th": "การชำระเงินยังไม่สำเร็จ หากเพิ่งชำระเสร็จ รอสักครู่แล้วรีเฟรชหน้า",
        "ko": "결제가 아직 완료되지 않았습니다. 방금 결제하셨다면 잠시 후 새로고침 해주세요.",
    },
    "paid.verifying": {
        "en": "Verifying your payment…",
        "th": "กำลังตรวจสอบการชำระเงินของคุณ…",
        "ko": "결제를 확인하는 중입니다…",
    },
    "paid.generating": {
        "en": "Writing your reading — this takes about 20 seconds.",
        "th": "กำลังเขียนการอ่านของคุณ — ใช้เวลาประมาณ 20 วินาที",
        "ko": "리딩을 작성하는 중입니다 — 약 20초 정도 걸립니다.",
    },
    "paid.reading_header": {
        "en": "Your Personal Reading",
        "th": "การอ่านส่วนตัวของคุณ",
        "ko": "나만의 개인 리딩",
    },
    "paid.thanks": {
        "en": "Thank you. Save this page or screenshot to keep your reading.",
        "th": "ขอบคุณ บันทึกหน้านี้หรือจับภาพหน้าจอเพื่อเก็บการอ่านของคุณ",
        "ko": "감사합니다. 리딩을 보관하시려면 이 페이지를 저장하거나 스크린샷을 남겨주세요.",
    },
}


def t(key: str, lang: str) -> str:
    entry = STRINGS.get(key)
    if not entry:
        return key
    return entry.get(lang) or entry.get("en") or key
