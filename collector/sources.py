"""Tiered source registry for multi-source synthesis.

See CONTENT_STRATEGY.md for rationale.

- Tier A: Korean-language saju posts discovered via hashtag crawl.
- Tier B: Cross-cultural educators already packaging saju for non-Korean audiences.
- Tier C: Thai astrology creators, studied for tone not topic.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Tier(str, Enum):
    A_KOREAN = "A"
    B_CROSSCULTURAL = "B"
    C_THAI_REF = "C"


@dataclass(frozen=True)
class SourceAccount:
    handle: str
    platform: str  # "instagram" | "tiktok"
    tier: Tier
    language: str
    notes: str = ""


# Tier B — confirmed cross-cultural educators (research 2026-04)
TIER_B_ACCOUNTS: list[SourceAccount] = [
    SourceAccount("ahnestkitchen", "tiktok", Tier.B_CROSSCULTURAL, "en",
                  "Sarah Ahn — explains saju to Western audience"),
    SourceAccount("jewelsjpj", "tiktok", Tier.B_CROSSCULTURAL, "en",
                  "Jewel — 'SJPJ as the new MBTI' framing"),
    SourceAccount("tingssam", "tiktok", Tier.B_CROSSCULTURAL, "en",
                  "Korean culture + saju primer"),
    SourceAccount("jiyongskorean", "tiktok", Tier.B_CROSSCULTURAL, "en",
                  "Korean fortune-teller visit vlogs"),
]

# Tier A — Korean hashtags to crawl; specific accounts fill in as we collect
KOREAN_HASHTAGS: list[str] = [
    "사주",
    "운세",
    "신년운세",
    "오늘의운세",
    "사주팔자",
    "일간",
    "오행",
    "궁합",
    "타로",
]

# Tier A seed accounts (will expand via hashtag discovery)
TIER_A_SEED_ACCOUNTS: list[SourceAccount] = [
    SourceAccount("sajunaru", "instagram", Tier.A_KOREAN, "ko", "user-provided seed"),
    SourceAccount("sajujenge", "instagram", Tier.A_KOREAN, "ko", "user-provided seed"),
]

# Tier C — Thai reference (to be researched and filled in)
THAI_HASHTAGS: list[str] = [
    "ดูดวง",
    "ดูดวงวันนี้",
    "โหราศาสตร์",
    "ไพ่ยิปซี",
    "ดวงความรัก",
]

TIER_C_ACCOUNTS: list[SourceAccount] = []  # to be populated during tone research


def all_collectable_accounts() -> list[SourceAccount]:
    """Accounts we actively pull posts from. Tier C is reference-only."""
    return TIER_A_SEED_ACCOUNTS + TIER_B_ACCOUNTS


# Quality thresholds
MIN_LIKES = 500
MIN_SAVES = 100
MAX_POSTS_PER_ACCOUNT_PER_RUN = 10
MAX_POSTS_PER_HASHTAG_PER_RUN = 20
