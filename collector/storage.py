"""JSON-file storage for collected posts. Swap for SQLite/Supabase later."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path

from config import POSTS_DIR


@dataclass
class CollectedPost:
    source_account: str
    post_id: str
    url: str
    caption: str
    image_urls: list[str] = field(default_factory=list)
    hashtags: list[str] = field(default_factory=list)
    likes: int = 0
    saves: int = 0
    posted_at: str = ""
    collected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    @property
    def filename(self) -> str:
        return f"{self.source_account}__{self.post_id}.json"


def save_post(post: CollectedPost) -> Path:
    path = POSTS_DIR / post.filename
    path.write_text(json.dumps(asdict(post), ensure_ascii=False, indent=2))
    return path


def load_post(path: Path) -> CollectedPost:
    data = json.loads(path.read_text())
    return CollectedPost(**data)


def list_unprocessed(rewrites_dir: Path) -> list[Path]:
    """Return posts that don't yet have a matching rewrite file."""
    done = {p.stem for p in rewrites_dir.glob("*.json")}
    return [p for p in POSTS_DIR.glob("*.json") if p.stem not in done]
