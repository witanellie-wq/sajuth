"""Curated city database for birth-place input.

Each entry carries the longitude used for true-solar-time correction and the
time zone's UTC offset. The list is hand-picked to cover Thailand densely
(primary audience) plus Korea, the rest of ASEAN, and a few global hubs.

The UI presents Country first, then City, mirroring how astro-seek and most
chart sites collect birth-place data.
"""

# (key, country_code, thai_name, en_name, latitude, longitude, tz_offset_hours)
CITY_DB = [
    # ── Thailand (UTC+7, standard meridian 105° E) ─────────────────────────
    ("bangkok",          "TH", "กรุงเทพฯ",          "Bangkok",          13.75, 100.50, 7.0),
    ("nonthaburi",       "TH", "นนทบุรี",            "Nonthaburi",       13.86, 100.52, 7.0),
    ("samutprakan",      "TH", "สมุทรปราการ",        "Samut Prakan",     13.60, 100.60, 7.0),
    ("samutsakhon",      "TH", "สมุทรสาคร",          "Samut Sakhon",     13.55, 100.27, 7.0),
    ("pathumthani",      "TH", "ปทุมธานี",          "Pathum Thani",     14.02, 100.53, 7.0),
    ("nakhonpathom",     "TH", "นครปฐม",            "Nakhon Pathom",    13.81, 100.06, 7.0),
    ("ayutthaya",        "TH", "พระนครศรีอยุธยา",   "Ayutthaya",        14.36, 100.58, 7.0),
    ("chonburi",         "TH", "ชลบุรี",            "Chonburi",         13.36, 100.98, 7.0),
    ("pattaya",          "TH", "พัทยา",              "Pattaya",          12.93, 100.88, 7.0),
    ("rayong",           "TH", "ระยอง",              "Rayong",           12.68, 101.28, 7.0),
    ("chanthaburi",      "TH", "จันทบุรี",          "Chanthaburi",      12.61, 102.10, 7.0),
    ("trat",             "TH", "ตราด",              "Trat",             12.24, 102.51, 7.0),
    ("kanchanaburi",     "TH", "กาญจนบุรี",         "Kanchanaburi",     14.02,  99.53, 7.0),
    ("ratchaburi",       "TH", "ราชบุรี",           "Ratchaburi",       13.54,  99.82, 7.0),
    ("petchaburi",       "TH", "เพชรบุรี",          "Phetchaburi",      13.11,  99.94, 7.0),
    ("huahin",           "TH", "หัวหิน",             "Hua Hin",          12.57,  99.96, 7.0),
    ("chiangmai",        "TH", "เชียงใหม่",         "Chiang Mai",       18.79,  98.99, 7.0),
    ("chiangrai",        "TH", "เชียงราย",          "Chiang Rai",       19.91,  99.84, 7.0),
    ("lampang",          "TH", "ลำปาง",              "Lampang",          18.29,  99.49, 7.0),
    ("lamphun",          "TH", "ลำพูน",              "Lamphun",          18.58,  99.01, 7.0),
    ("phrae",            "TH", "แพร่",              "Phrae",            18.14, 100.14, 7.0),
    ("nan",              "TH", "น่าน",              "Nan",              18.78, 100.78, 7.0),
    ("phayao",           "TH", "พะเยา",              "Phayao",           19.17, 99.90,  7.0),
    ("maehongson",       "TH", "แม่ฮ่องสอน",         "Mae Hong Son",     19.30,  97.97, 7.0),
    ("phitsanulok",      "TH", "พิษณุโลก",          "Phitsanulok",      16.82, 100.27, 7.0),
    ("sukhothai",        "TH", "สุโขทัย",           "Sukhothai",        17.01,  99.82, 7.0),
    ("tak",              "TH", "ตาก",               "Tak",              16.87,  99.13, 7.0),
    ("nakhonsawan",      "TH", "นครสวรรค์",         "Nakhon Sawan",     15.70, 100.14, 7.0),
    ("uthai",            "TH", "อุทัยธานี",         "Uthai Thani",      15.38, 100.03, 7.0),
    ("udonthani",        "TH", "อุดรธานี",          "Udon Thani",       17.41, 102.79, 7.0),
    ("nongkhai",         "TH", "หนองคาย",           "Nong Khai",        17.88, 102.74, 7.0),
    ("loei",             "TH", "เลย",               "Loei",             17.49, 101.72, 7.0),
    ("sakonnakhon",      "TH", "สกลนคร",            "Sakon Nakhon",     17.16, 104.15, 7.0),
    ("nakhonphanom",     "TH", "นครพนม",            "Nakhon Phanom",    17.39, 104.77, 7.0),
    ("mukdahan",         "TH", "มุกดาหาร",          "Mukdahan",         16.55, 104.72, 7.0),
    ("khonkaen",         "TH", "ขอนแก่น",           "Khon Kaen",        16.44, 102.83, 7.0),
    ("kalasin",          "TH", "กาฬสินธุ์",         "Kalasin",          16.43, 103.51, 7.0),
    ("mahasarakham",     "TH", "มหาสารคาม",         "Maha Sarakham",    16.18, 103.30, 7.0),
    ("roiet",            "TH", "ร้อยเอ็ด",          "Roi Et",           16.05, 103.65, 7.0),
    ("yasothon",         "TH", "ยโสธร",              "Yasothon",         15.79, 104.14, 7.0),
    ("amnatcharoen",     "TH", "อำนาจเจริญ",        "Amnat Charoen",    15.86, 104.63, 7.0),
    ("ubon",             "TH", "อุบลราชธานี",       "Ubon Ratchathani", 15.23, 104.86, 7.0),
    ("sisaket",          "TH", "ศรีสะเกษ",           "Si Sa Ket",        15.12, 104.32, 7.0),
    ("surin",            "TH", "สุรินทร์",          "Surin",            14.88, 103.49, 7.0),
    ("buriram",          "TH", "บุรีรัมย์",          "Buriram",          14.99, 103.10, 7.0),
    ("korat",            "TH", "นครราชสีมา",        "Nakhon Ratchasima",14.97, 102.08, 7.0),
    ("chaiyaphum",       "TH", "ชัยภูมิ",           "Chaiyaphum",       15.81, 102.03, 7.0),
    ("phuket",           "TH", "ภูเก็ต",             "Phuket",            7.89,  98.40, 7.0),
    ("krabi",            "TH", "กระบี่",             "Krabi",             8.09,  98.91, 7.0),
    ("phangnga",         "TH", "พังงา",              "Phang Nga",         8.45,  98.53, 7.0),
    ("ranong",           "TH", "ระนอง",              "Ranong",            9.96,  98.64, 7.0),
    ("chumphon",         "TH", "ชุมพร",              "Chumphon",         10.49,  99.18, 7.0),
    ("suratthani",       "TH", "สุราษฎร์ธานี",      "Surat Thani",       9.14,  99.33, 7.0),
    ("nakhonsithammarat","TH", "นครศรีธรรมราช",     "Nakhon Si Thammarat", 8.43,  99.97, 7.0),
    ("trang",            "TH", "ตรัง",              "Trang",             7.56,  99.61, 7.0),
    ("phatthalung",      "TH", "พัทลุง",             "Phatthalung",       7.62, 100.07, 7.0),
    ("songkhla",         "TH", "สงขลา",             "Songkhla",          7.19, 100.60, 7.0),
    ("hatyai",           "TH", "หาดใหญ่",           "Hat Yai",           7.01, 100.47, 7.0),
    ("yala",             "TH", "ยะลา",              "Yala",              6.54, 101.28, 7.0),
    ("pattani",          "TH", "ปัตตานี",           "Pattani",           6.87, 101.25, 7.0),
    ("narathiwat",       "TH", "นราธิวาส",          "Narathiwat",        6.43, 101.83, 7.0),
    ("satun",            "TH", "สตูล",              "Satun",             6.62, 100.07, 7.0),

    # ── South Korea (UTC+9, 135° E) ────────────────────────────────────────
    ("seoul",            "KR", "โซล",                "Seoul",            37.57, 126.98, 9.0),
    ("busan",            "KR", "ปูซาน",              "Busan",            35.18, 129.08, 9.0),
    ("daegu",            "KR", "แทกู",               "Daegu",            35.87, 128.60, 9.0),
    ("incheon",          "KR", "อินชอน",             "Incheon",          37.46, 126.70, 9.0),
    ("gwangju",          "KR", "ควังจู",             "Gwangju",          35.16, 126.85, 9.0),
    ("daejeon",          "KR", "แทจอน",              "Daejeon",          36.35, 127.38, 9.0),
    ("ulsan",            "KR", "อุลซาน",             "Ulsan",            35.54, 129.31, 9.0),
    ("sejong",           "KR", "เซจง",               "Sejong",           36.48, 127.29, 9.0),
    ("suwon",            "KR", "ซูวอน",              "Suwon",            37.26, 127.03, 9.0),
    ("seongnam",         "KR", "ซองนัม",             "Seongnam",         37.42, 127.13, 9.0),
    ("goyang",           "KR", "โกยาง",              "Goyang",           37.66, 126.83, 9.0),
    ("bucheon",          "KR", "พูชอน",              "Bucheon",          37.50, 126.78, 9.0),
    ("ansan",            "KR", "อันซาน",             "Ansan",            37.32, 126.83, 9.0),
    ("anyang",           "KR", "อันยัง",             "Anyang",           37.39, 126.93, 9.0),
    ("pyeongtaek",       "KR", "พยองแท็ก",           "Pyeongtaek",       36.99, 127.11, 9.0),
    ("yongin",           "KR", "ยงอิน",              "Yongin",           37.24, 127.18, 9.0),
    ("hwaseong",         "KR", "ฮวาซอง",             "Hwaseong",         37.20, 126.83, 9.0),
    ("namyangju",        "KR", "นัมยังจู",           "Namyangju",        37.64, 127.21, 9.0),
    ("changwon",         "KR", "ชางวอน",             "Changwon",         35.23, 128.68, 9.0),
    ("jinju",            "KR", "ชินจู",              "Jinju",            35.18, 128.11, 9.0),
    ("gimhae",           "KR", "คิมแฮ",              "Gimhae",           35.23, 128.89, 9.0),
    ("tongyeong",        "KR", "ทงยอง",              "Tongyeong",        34.85, 128.43, 9.0),
    ("pohang",           "KR", "โพฮัง",              "Pohang",           36.02, 129.34, 9.0),
    ("gyeongju",         "KR", "คยองจู",             "Gyeongju",         35.86, 129.22, 9.0),
    ("andong",           "KR", "อันดง",              "Andong",           36.57, 128.73, 9.0),
    ("gumi",             "KR", "คูมี",               "Gumi",             36.12, 128.34, 9.0),
    ("sangju",           "KR", "ซังจู",              "Sangju",           36.41, 128.16, 9.0),
    ("mokpo",            "KR", "มกโพ",               "Mokpo",            34.81, 126.39, 9.0),
    ("yeosu",            "KR", "ยอซู",               "Yeosu",            34.76, 127.66, 9.0),
    ("suncheon",         "KR", "ซุนชอน",             "Suncheon",         34.95, 127.49, 9.0),
    ("gwangyang",        "KR", "ควังยัง",            "Gwangyang",        34.94, 127.70, 9.0),
    ("jeonju",           "KR", "ชอนจู",              "Jeonju",           35.82, 127.15, 9.0),
    ("gunsan",           "KR", "กุนซาน",             "Gunsan",           35.97, 126.74, 9.0),
    ("iksan",            "KR", "อิกซาน",             "Iksan",            35.95, 126.96, 9.0),
    ("cheonan",          "KR", "ชอนอัน",             "Cheonan",          36.82, 127.15, 9.0),
    ("asan",             "KR", "อาซาน",              "Asan",             36.79, 127.00, 9.0),
    ("cheongju",         "KR", "ชองจู",              "Cheongju",         36.64, 127.49, 9.0),
    ("chungju",          "KR", "ชุงจู",              "Chungju",          36.97, 127.93, 9.0),
    ("wonju",            "KR", "วอนจู",              "Wonju",            37.34, 127.92, 9.0),
    ("chuncheon",        "KR", "ชุนชอน",             "Chuncheon",        37.88, 127.73, 9.0),
    ("gangneung",        "KR", "คังนึง",             "Gangneung",        37.75, 128.88, 9.0),
    ("sokcho",           "KR", "ซกโช",               "Sokcho",           38.21, 128.59, 9.0),
    ("jeju",             "KR", "เชจู",               "Jeju",             33.50, 126.52, 9.0),
    ("seogwipo",         "KR", "ซอกวีโพ",            "Seogwipo",         33.25, 126.56, 9.0),

    # ── Other ASEAN & Asia ─────────────────────────────────────────────────
    ("hanoi",            "VN", "ฮานอย",              "Hanoi",            21.03, 105.85, 7.0),
    ("hochiminh",        "VN", "โฮจิมินห์",          "Ho Chi Minh City", 10.82, 106.63, 7.0),
    ("danang",           "VN", "ดานัง",              "Da Nang",          16.07, 108.22, 7.0),
    ("phnompenh",        "KH", "พนมเปญ",             "Phnom Penh",       11.56, 104.92, 7.0),
    ("siemreap",         "KH", "เสียมราฐ",           "Siem Reap",        13.36, 103.86, 7.0),
    ("vientiane",        "LA", "เวียงจันทน์",        "Vientiane",        17.97, 102.60, 7.0),
    ("luangprabang",     "LA", "หลวงพระบาง",        "Luang Prabang",    19.89, 102.13, 7.0),
    ("yangon",           "MM", "ย่างกุ้ง",           "Yangon",           16.87,  96.20, 6.5),
    ("mandalay",         "MM", "มัณฑะเลย์",          "Mandalay",         21.97,  96.08, 6.5),
    ("kualalumpur",      "MY", "กัวลาลัมเปอร์",       "Kuala Lumpur",      3.14, 101.69, 8.0),
    ("penang",           "MY", "ปีนัง",              "Penang",            5.41, 100.33, 8.0),
    ("singapore",        "SG", "สิงคโปร์",           "Singapore",         1.35, 103.82, 8.0),
    ("jakarta",          "ID", "จาการ์ตา",            "Jakarta",          -6.21, 106.85, 7.0),
    ("bali",             "ID", "บาหลี (เดนปาซาร์)",   "Bali (Denpasar)",  -8.65, 115.22, 8.0),
    ("manila",           "PH", "มะนิลา",              "Manila",           14.60, 120.98, 8.0),
    ("cebu",             "PH", "เซบู",               "Cebu",             10.32, 123.90, 8.0),
    ("taipei",           "TW", "ไทเป",               "Taipei",           25.03, 121.57, 8.0),
    ("hongkong",         "HK", "ฮ่องกง",             "Hong Kong",        22.32, 114.17, 8.0),
    ("macau",            "MO", "มาเก๊า",             "Macau",            22.20, 113.55, 8.0),
    ("tokyo",            "JP", "โตเกียว",            "Tokyo",            35.68, 139.69, 9.0),
    ("osaka",            "JP", "โอซากา",             "Osaka",            34.69, 135.50, 9.0),
    ("beijing",          "CN", "ปักกิ่ง",            "Beijing",          39.90, 116.41, 8.0),
    ("shanghai",         "CN", "เซี่ยงไฮ้",          "Shanghai",         31.23, 121.47, 8.0),
    ("delhi",            "IN", "เดลี",               "Delhi",            28.61,  77.21, 5.5),

    # ── Global hubs ────────────────────────────────────────────────────────
    ("london",           "GB", "ลอนดอน",              "London",           51.51,  -0.13, 0.0),
    ("paris",            "FR", "ปารีส",              "Paris",            48.86,   2.35, 1.0),
    ("newyork",          "US", "นิวยอร์ก",           "New York",         40.71, -74.01, -5.0),
    ("losangeles",       "US", "ลอสแอนเจลิส",        "Los Angeles",      34.05,-118.24, -8.0),
    ("toronto",          "CA", "โตรอนโต",            "Toronto",          43.65, -79.38, -5.0),
    ("sydney",           "AU", "ซิดนีย์",            "Sydney",          -33.87, 151.21, 10.0),
    ("melbourne",        "AU", "เมลเบิร์น",          "Melbourne",       -37.81, 144.96, 10.0),
]


# Country list, ordered with Thailand first then by audience priority.
# (code, th_name, en_name, ko_name)
COUNTRIES = [
    ("TH", "ไทย",            "Thailand",       "태국"),
    ("KR", "เกาหลีใต้",       "South Korea",    "대한민국"),
    ("VN", "เวียดนาม",        "Vietnam",        "베트남"),
    ("KH", "กัมพูชา",         "Cambodia",       "캄보디아"),
    ("LA", "ลาว",             "Laos",           "라오스"),
    ("MM", "เมียนมา",         "Myanmar",        "미얀마"),
    ("MY", "มาเลเซีย",        "Malaysia",       "말레이시아"),
    ("SG", "สิงคโปร์",        "Singapore",      "싱가포르"),
    ("ID", "อินโดนีเซีย",     "Indonesia",      "인도네시아"),
    ("PH", "ฟิลิปปินส์",      "Philippines",    "필리핀"),
    ("TW", "ไต้หวัน",         "Taiwan",         "대만"),
    ("HK", "ฮ่องกง",          "Hong Kong",      "홍콩"),
    ("MO", "มาเก๊า",          "Macau",          "마카오"),
    ("CN", "จีน",             "China",          "중국"),
    ("JP", "ญี่ปุ่น",          "Japan",          "일본"),
    ("IN", "อินเดีย",         "India",          "인도"),
    ("GB", "สหราชอาณาจักร",   "United Kingdom", "영국"),
    ("FR", "ฝรั่งเศส",        "France",         "프랑스"),
    ("US", "สหรัฐอเมริกา",    "United States",  "미국"),
    ("CA", "แคนาดา",          "Canada",         "캐나다"),
    ("AU", "ออสเตรเลีย",      "Australia",      "호주"),
]


# Korean city names. Cities not in this dict fall back to the English name.
# We keep these as an overlay dict so the main CITY_DB tuple shape stays simple.
CITY_KO_NAMES = {
    # Thailand
    "bangkok": "방콕", "nonthaburi": "논타부리", "samutprakan": "사뭇쁘라깐",
    "samutsakhon": "사뭇사콘", "pathumthani": "빠툼타니", "nakhonpathom": "나콘빠톰",
    "ayutthaya": "아유타야", "chonburi": "촌부리", "pattaya": "파타야",
    "rayong": "라용", "chanthaburi": "짠타부리", "trat": "뜨랏",
    "kanchanaburi": "깐짜나부리", "ratchaburi": "랏차부리", "petchaburi": "펫차부리",
    "huahin": "후아힌", "chiangmai": "치앙마이", "chiangrai": "치앙라이",
    "lampang": "람빵", "lamphun": "람푼", "phrae": "프래",
    "nan": "난", "phayao": "파야오", "maehongson": "매홍손",
    "phitsanulok": "핏사눌록", "sukhothai": "수코타이", "tak": "딱",
    "nakhonsawan": "나콘사완", "uthai": "우타이타니", "udonthani": "우돈타니",
    "nongkhai": "농카이", "loei": "러이", "sakonnakhon": "사콘나콘",
    "nakhonphanom": "나콘파놈", "mukdahan": "묵다한", "khonkaen": "콘깬",
    "kalasin": "까라신", "mahasarakham": "마하사라캄", "roiet": "러이엣",
    "yasothon": "야소톤", "amnatcharoen": "암낫짜런", "ubon": "우본라차타니",
    "sisaket": "시사껫", "surin": "수린", "buriram": "부리람",
    "korat": "나콘라차시마", "chaiyaphum": "차이야품", "phuket": "푸켓",
    "krabi": "끄라비", "phangnga": "팡응아", "ranong": "라농",
    "chumphon": "춤폰", "suratthani": "수랏타니", "nakhonsithammarat": "나콘시탐마랏",
    "trang": "뜨랑", "phatthalung": "팟탈룽", "songkhla": "송클라",
    "hatyai": "핫야이", "yala": "얄라", "pattani": "빠따니",
    "narathiwat": "나라티왓", "satun": "사뚠",

    # South Korea
    "seoul": "서울", "busan": "부산", "daegu": "대구",
    "incheon": "인천", "gwangju": "광주", "daejeon": "대전",
    "ulsan": "울산", "sejong": "세종", "suwon": "수원",
    "seongnam": "성남", "goyang": "고양", "bucheon": "부천",
    "ansan": "안산", "anyang": "안양", "pyeongtaek": "평택",
    "yongin": "용인", "hwaseong": "화성", "namyangju": "남양주",
    "changwon": "창원", "jinju": "진주", "gimhae": "김해",
    "tongyeong": "통영", "pohang": "포항", "gyeongju": "경주",
    "andong": "안동", "gumi": "구미", "sangju": "상주",
    "mokpo": "목포", "yeosu": "여수", "suncheon": "순천",
    "gwangyang": "광양", "jeonju": "전주", "gunsan": "군산",
    "iksan": "익산", "cheonan": "천안", "asan": "아산",
    "cheongju": "청주", "chungju": "충주", "wonju": "원주",
    "chuncheon": "춘천", "gangneung": "강릉", "sokcho": "속초",
    "jeju": "제주", "seogwipo": "서귀포",

    # ASEAN & Asia
    "hanoi": "하노이", "hochiminh": "호치민", "danang": "다낭",
    "phnompenh": "프놈펜", "siemreap": "시엠립",
    "vientiane": "비엔티안", "luangprabang": "루앙프라방",
    "yangon": "양곤", "mandalay": "만달레이",
    "kualalumpur": "쿠알라룸푸르", "penang": "페낭",
    "singapore": "싱가포르",
    "jakarta": "자카르타", "bali": "발리 (덴파사르)",
    "manila": "마닐라", "cebu": "세부",
    "taipei": "타이베이", "hongkong": "홍콩", "macau": "마카오",
    "tokyo": "도쿄", "osaka": "오사카",
    "beijing": "베이징", "shanghai": "상하이",
    "delhi": "델리",

    # Global hubs
    "london": "런던", "paris": "파리",
    "newyork": "뉴욕", "losangeles": "로스앤젤레스",
    "toronto": "토론토", "sydney": "시드니", "melbourne": "멜버른",
}


def _country_label_idx(lang: str) -> int:
    return {"th": 1, "en": 2, "ko": 3}.get(lang, 2)


def countries_for_lang(lang: str) -> list[tuple[str, str]]:
    idx = _country_label_idx(lang)
    return [(c[0], c[idx]) for c in COUNTRIES]


def cities_for_country(country_code: str, lang: str) -> list[tuple[str, str]]:
    rows = [c for c in CITY_DB if c[1] == country_code]
    if lang == "ko":
        return [(c[0], CITY_KO_NAMES.get(c[0], c[3])) for c in rows]
    label_idx = 2 if lang == "th" else 3
    return [(c[0], c[label_idx]) for c in rows]


def get_city(key: str):
    for c in CITY_DB:
        if c[0] == key:
            return {
                "key": c[0],
                "country": c[1],
                "th_name": c[2],
                "en_name": c[3],
                "ko_name": CITY_KO_NAMES.get(c[0], c[3]),
                "lat": c[4],
                "lon": c[5],
                "tz_offset": c[6],
            }
    return None
