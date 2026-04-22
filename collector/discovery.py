"""Hashtag-driven auto-discovery of Korean saju posts.

Uses instaloader's hashtag iterator. Posts are saved into the same posts/ store
as account-based collection, tagged by hashtag for downstream theme routing.
"""
from __future__ import annotations

import instaloader

from collector.sources import (
    KOREAN_HASHTAGS,
    MAX_POSTS_PER_HASHTAG_PER_RUN,
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


def discover_hashtag(tag: str, limit: int = MAX_POSTS_PER_HASHTAG_PER_RUN) -> list[CollectedPost]:
    loader = _loader()
    hashtag = instaloader.Hashtag.from_name(loader.context, tag)

    collected: list[CollectedPost] = []
    for idx, post in enumerate(hashtag.get_top_posts()):
        if idx >= limit:
            break
        if post.likes < MIN_LIKES:
            continue

        cp = CollectedPost(
            source_account=post.owner_username,
            post_id=post.shortcode,
            url=f"https://www.instagram.com/p/{post.shortcode}/",
            caption=post.caption or "",
            image_urls=[post.url],
            hashtags=list(post.caption_hashtags) + [tag],
            likes=post.likes,
            saves=0,
            posted_at=post.date_utc.isoformat(),
        )
        save_post(cp)
        collected.append(cp)
    return collected


def discover_all(tags: list[str] = KOREAN_HASHTAGS) -> list[CollectedPost]:
    results: list[CollectedPost] = []
    for t in tags:
        try:
            results.extend(discover_hashtag(t))
        except Exception as e:  # noqa: BLE001
            print(f"[discovery] failed for #{t}: {e}")
    return results


if __name__ == "__main__":
    posts = discover_all()
    print(f"discovered {len(posts)} posts across {len(KOREAN_HASHTAGS)} hashtags")
