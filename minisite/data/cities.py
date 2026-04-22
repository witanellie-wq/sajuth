"""Curated city database for birth-place input.

Each entry carries the longitude used for true-solar-time correction and the
time zone's UTC offset. This is deliberately a hand-picked list focused on
Thailand (primary audience) plus Korea, major ASEAN capitals and a few global
cities — dropdown-friendly and large enough that most users find themselves.

Longitudes are rounded to two decimals; the 4-minute-per-degree rule makes
finer precision cosmetic. Time-zone offsets assume standard year-round policy
(no DST) which is true for all entries except the historical Korea cases
covered separately in the UI.
"""

# (key, country_code, thai_name, en_name, latitude, longitude, tz_offset_hours)
CITY_DB = [
    # ── Thailand (UTC+7, standard meridian 105° E) ─────────────────────────
    ("bangkok",          "TH", "กรุงเทพฯ",          "Bangkok",          13.75, 100.50, 7.0),
    ("nonthaburi",       "TH", "นนทบุรี",            "Nonthaburi",       13.86, 100.52, 7.0),
    ("samutprakan",      "TH", "สมุทรปราการ",        "Samut Prakan",     13.60, 100.60, 7.0),
    ("chiangmai",        "TH", "เชียงใหม่",         "Chiang Mai",       18.79,  98.99, 7.0),
    ("chiangrai",        "TH", "เชียงราย",          "Chiang Rai",       19.91,  99.84, 7.0),
    ("phuket",           "TH", "ภูเก็ต",             "Phuket",            7.89,  98.40, 7.0),
    ("pattaya",          "TH", "พัทยา",              "Pattaya",          12.93, 100.88, 7.0),
    ("hatyai",           "TH", "หาดใหญ่",           "Hat Yai",           7.01, 100.47, 7.0),
    ("songkhla",         "TH", "สงขลา",             "Songkhla",          7.19, 100.60, 7.0),
    ("udonthani",        "TH", "อุดรธานี",          "Udon Thani",       17.41, 102.79, 7.0),
    ("khonkaen",         "TH", "ขอนแก่น",           "Khon Kaen",        16.44, 102.83, 7.0),
    ("korat",            "TH", "นครราชสีมา",        "Nakhon Ratchasima",14.97, 102.08, 7.0),
    ("ubon",             "TH", "อุบลราชธานี",       "Ubon Ratchathani", 15.23, 104.86, 7.0),
    ("nakhonsawan",      "TH", "นครสวรรค์",         "Nakhon Sawan",     15.70, 100.14, 7.0),
    ("ayutthaya",        "TH", "พระนครศรีอยุธยา",   "Ayutthaya",        14.36, 100.58, 7.0),
    ("suratthani",       "TH", "สุราษฎร์ธานี",      "Surat Thani",       9.14,  99.33, 7.0),
    ("krabi",            "TH", "กระบี่",             "Krabi",             8.09,  98.91, 7.0),
    ("chonburi",         "TH", "ชลบุรี",            "Chonburi",         13.36, 100.98, 7.0),
    ("rayong",           "TH", "ระยอง",              "Rayong",           12.68, 101.28, 7.0),
    ("nakhonpathom",     "TH", "นครปฐม",            "Nakhon Pathom",    13.81, 100.06, 7.0),
    ("trang",            "TH", "ตรัง",              "Trang",             7.56,  99.61, 7.0),

    # ── Korea (UTC+9, standard meridian 135° E) ────────────────────────────
    ("seoul",            "KR", "โซล",                "Seoul",            37.57, 126.98, 9.0),
    ("busan",            "KR", "ปูซาน",              "Busan",            35.18, 129.08, 9.0),
    ("daegu",            "KR", "แทกู",               "Daegu",            35.87, 128.60, 9.0),
    ("incheon",          "KR", "อินชอน",             "Incheon",          37.46, 126.70, 9.0),
    ("gwangju",          "KR", "ควังจู",             "Gwangju",          35.16, 126.85, 9.0),
    ("daejeon",          "KR", "แทจอน",              "Daejeon",          36.35, 127.38, 9.0),
    ("sangju",           "KR", "ซังจู",              "Sangju",           36.41, 128.16, 9.0),
    ("jeju",             "KR", "เชจู",               "Jeju",             33.50, 126.52, 9.0),

    # ── Other ASEAN & world hubs ───────────────────────────────────────────
    ("hanoi",            "VN", "ฮานอย",              "Hanoi",            21.03, 105.85, 7.0),
    ("hochiminh",        "VN", "โฮจิมินห์",          "Ho Chi Minh City", 10.82, 106.63, 7.0),
    ("phnompenh",        "KH", "พนมเปญ",             "Phnom Penh",       11.56, 104.92, 7.0),
    ("vientiane",        "LA", "เวียงจันทน์",        "Vientiane",        17.97, 102.60, 7.0),
    ("yangon",           "MM", "ย่างกุ้ง",           "Yangon",           16.87,  96.20, 6.5),
    ("kualalumpur",      "MY", "กัวลาลัมเปอร์",       "Kuala Lumpur",      3.14, 101.69, 8.0),
    ("singapore",        "SG", "สิงคโปร์",           "Singapore",         1.35, 103.82, 8.0),
    ("jakarta",          "ID", "จาการ์ตา",            "Jakarta",          -6.21, 106.85, 7.0),
    ("manila",           "PH", "มะนิลา",              "Manila",           14.60, 120.98, 8.0),
    ("taipei",           "TW", "ไทเป",               "Taipei",           25.03, 121.57, 8.0),
    ("hongkong",         "HK", "ฮ่องกง",             "Hong Kong",        22.32, 114.17, 8.0),
    ("tokyo",            "JP", "โตเกียว",            "Tokyo",            35.68, 139.69, 9.0),
    ("beijing",          "CN", "ปักกิ่ง",            "Beijing",          39.90, 116.41, 8.0),
    ("shanghai",         "CN", "เซี่ยงไฮ้",          "Shanghai",         31.23, 121.47, 8.0),
    ("london",           "GB", "ลอนดอน",              "London",           51.51,  -0.13, 0.0),
    ("newyork",          "US", "นิวยอร์ก",           "New York",         40.71, -74.01, -5.0),
    ("losangeles",       "US", "ลอสแอนเจลิส",        "Los Angeles",      34.05,-118.24, -8.0),
    ("sydney",           "AU", "ซิดนีย์",            "Sydney",          -33.87, 151.21, 10.0),
]


def cities_for_lang(lang: str) -> list[tuple[str, str]]:
    """Return [(key, display_label), ...] for dropdown rendering."""
    label_idx = 2 if lang == "th" else 3
    return [(c[0], f"{c[label_idx]} ({c[1]})") for c in CITY_DB]


def get_city(key: str):
    for c in CITY_DB:
        if c[0] == key:
            return {
                "key": c[0],
                "country": c[1],
                "th_name": c[2],
                "en_name": c[3],
                "lat": c[4],
                "lon": c[5],
                "tz_offset": c[6],
            }
    return None
