"""Call Claude to rewrite a Korean saju caption into Thai slide content."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

from anthropic import Anthropic

from collector.storage import CollectedPost
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, REWRITES_DIR
from rewriter.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


@dataclass
class Slide:
    heading: str
    body: str


@dataclass
class ThaiRewrite:
    source_post_id: str
    source_account: str
    hook_title: str
    slides: list[Slide]
    caption: str
    hashtags: list[str]
    cta: str
    model: str = ""
    raw_json: dict = field(default_factory=dict)

    @property
    def filename(self) -> str:
        return f"{self.source_account}__{self.source_post_id}.json"


def _client() -> Anthropic:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    return Anthropic(api_key=ANTHROPIC_API_KEY)


def rewrite(post: CollectedPost) -> ThaiRewrite:
    client = _client()
    user_prompt = USER_PROMPT_TEMPLATE.format(korean_caption=post.caption)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2000,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_prompt}],
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].lstrip()
    data = json.loads(text)

    return ThaiRewrite(
        source_post_id=post.post_id,
        source_account=post.source_account,
        hook_title=data["hook_title"],
        slides=[Slide(**s) for s in data["slides"]],
        caption=data["caption"],
        hashtags=data["hashtags"],
        cta=data["cta"],
        model=CLAUDE_MODEL,
        raw_json=data,
    )


def save_rewrite(rw: ThaiRewrite) -> Path:
    path = REWRITES_DIR / rw.filename
    payload = asdict(rw)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    return path


if __name__ == "__main__":
    from collector.storage import load_post, list_unprocessed

    pending = list_unprocessed(REWRITES_DIR)
    for p in pending[:3]:
        post = load_post(p)
        rw = rewrite(post)
        save_rewrite(rw)
        print(f"rewrote {rw.filename}")
