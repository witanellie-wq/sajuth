"""Instagram Graph API carousel publisher.

Requirements:
- Instagram business account connected to a Facebook Page
- IG_ACCESS_TOKEN with instagram_content_publish permission
- Publicly reachable URLs for each slide image (Graph API won't accept local files)

For Phase 0 we assume images are uploaded to a public bucket (e.g., Cloudflare R2,
Supabase storage) and URLs are passed in. The upload step is TODO — for early runs
we can host images on GitHub raw content.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

import requests

from config import IG_ACCESS_TOKEN, IG_USER_ID, PUBLISHED_DIR
from rewriter.synthesizer import ThaiPost

GRAPH_BASE = "https://graph.facebook.com/v20.0"


@dataclass
class PublishResult:
    theme_id: str
    ig_media_id: str
    published_at: str
    permalink: str = ""


def _post(path: str, data: dict) -> dict:
    url = f"{GRAPH_BASE}/{path}"
    resp = requests.post(url, data={**data, "access_token": IG_ACCESS_TOKEN}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _get(path: str, params: dict | None = None) -> dict:
    url = f"{GRAPH_BASE}/{path}"
    resp = requests.get(url, params={**(params or {}), "access_token": IG_ACCESS_TOKEN}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _create_child_container(image_url: str) -> str:
    data = _post(f"{IG_USER_ID}/media", {"image_url": image_url, "is_carousel_item": "true"})
    return data["id"]


def _create_carousel_container(children_ids: list[str], caption: str) -> str:
    data = _post(
        f"{IG_USER_ID}/media",
        {
            "media_type": "CAROUSEL",
            "children": ",".join(children_ids),
            "caption": caption,
        },
    )
    return data["id"]


def _wait_ready(container_id: str, timeout_s: int = 120) -> None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        info = _get(container_id, {"fields": "status_code"})
        if info.get("status_code") == "FINISHED":
            return
        if info.get("status_code") == "ERROR":
            raise RuntimeError(f"IG container {container_id} failed: {info}")
        time.sleep(3)
    raise TimeoutError(f"IG container {container_id} not ready in {timeout_s}s")


def _publish_container(container_id: str) -> str:
    data = _post(f"{IG_USER_ID}/media_publish", {"creation_id": container_id})
    return data["id"]


def publish_carousel(
    post: ThaiPost,
    image_urls: list[str],
) -> PublishResult:
    """Publish rendered slides as a carousel. image_urls must be publicly accessible."""
    if not IG_ACCESS_TOKEN or not IG_USER_ID:
        raise RuntimeError("IG_ACCESS_TOKEN / IG_USER_ID not set")

    full_caption = f"{post.caption}\n\n{post.cta}\n\n" + " ".join(post.hashtags)

    children = [_create_child_container(url) for url in image_urls]
    for c in children:
        _wait_ready(c)

    carousel = _create_carousel_container(children, full_caption)
    _wait_ready(carousel)
    media_id = _publish_container(carousel)

    result = PublishResult(
        theme_id=post.theme_id,
        ig_media_id=media_id,
        published_at=datetime.utcnow().isoformat(),
    )
    _record(result, post.filename)
    return result


def _record(r: PublishResult, filename: str) -> Path:
    path = PUBLISHED_DIR / filename
    path.write_text(json.dumps(asdict(r), ensure_ascii=False, indent=2))
    return path
