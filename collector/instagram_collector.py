"""Collect posts from whitelisted Korean accounts via instaloader.

Phase 0: we only read caption/metadata to inform the rewrite.
Images are NOT redistributed — we always regenerate visuals downstream.
"""
from __future__ import annotations

from typing import Iterable

import instaloader

from collector.sources import (
    KOREAN_SAJU_ACCOUNTS,
    MAX_POSTS_PER_ACCOUNT_PER_RUN,
    MIN_LIKES,
)
from collector.storage import CollectedPost, save_post
from config import IG_COLLECTOR_SESSION_FILE, IG_COLLECTOR_USERNAME


def _loader() -> instaloader.Instaloader:
    loader = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
    )
    if IG_COLLECTOR_USERNAME and IG_COLLECTOR_SESSION_FILE:
        loader.load_session_from_file(IG_COLLECTOR_USERNAME, IG_COLLECTOR_SESSION_FILE)
    return loader


def collect_account(username: str, limit: int = MAX_POSTS_PER_ACCOUNT_PER_RUN) -> list[CollectedPost]:
    loader = _loader()
    profile = instaloader.Profile.from_username(loader.context, username)

    collected: list[CollectedPost] = []
    for idx, post in enumerate(profile.get_posts()):
        if idx >= limit:
            break
        if post.likes < MIN_LIKES:
            continue

        cp = CollectedPost(
            source_account=username,
            post_id=post.shortcode,
            url=f"https://www.instagram.com/p/{post.shortcode}/",
            caption=post.caption or "",
            image_urls=[post.url],
            hashtags=list(post.caption_hashtags),
            likes=post.likes,
            saves=0,  # not exposed via instaloader without login
            posted_at=post.date_utc.isoformat(),
        )
        save_post(cp)
        collected.append(cp)
    return collected


def collect_all(accounts: Iterable[str] = KOREAN_SAJU_ACCOUNTS) -> list[CollectedPost]:
    results: list[CollectedPost] = []
    for acc in accounts:
        try:
            results.extend(collect_account(acc))
        except Exception as e:  # noqa: BLE001
            print(f"[collector] failed for @{acc}: {e}")
    return results


if __name__ == "__main__":
    posts = collect_all()
    print(f"collected {len(posts)} posts")
