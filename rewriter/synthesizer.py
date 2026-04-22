"""Multi-source synthesizer: theme + N source snippets → Thai post."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

from anthropic import Anthropic

from collector.storage import CollectedPost, POSTS_DIR
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, REWRITES_DIR
from rewriter.prompts import SYSTEM_PROMPT, SYNTHESIS_USER_TEMPLATE, build_source_block
from rewriter.themes import Theme


@dataclass
class Slide:
    heading: str
    body: str


@dataclass
class ThaiPost:
    theme_id: str
    hook_title: str
    slides: list[Slide]
    caption: str
    hashtags: list[str]
    cta: str
    source_urls: list[str] = field(default_factory=list)
    model: str = ""
    raw_json: dict = field(default_factory=dict)

    @property
    def filename(self) -> str:
        from datetime import date
        return f"{date.today().isoformat()}__{self.theme_id}.json"


def _client() -> Anthropic:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    return Anthropic(api_key=ANTHROPIC_API_KEY)


def gather_for_theme(theme: Theme, posts: list[CollectedPost], n: int = 4) -> list[CollectedPost]:
    """Rank collected posts by relevance to theme keywords, then by engagement."""
    if not theme.keywords_ko:
        return sorted(posts, key=lambda p: p.likes, reverse=True)[:n]

    def score(p: CollectedPost) -> tuple[int, int]:
        matches = sum(1 for kw in theme.keywords_ko if kw in p.caption)
        return (matches, p.likes)

    ranked = sorted(posts, key=score, reverse=True)
    relevant = [p for p in ranked if score(p)[0] > 0]
    return (relevant or ranked)[:n]


def _load_all_collected() -> list[CollectedPost]:
    import json as _json
    out: list[CollectedPost] = []
    for path in POSTS_DIR.glob("*.json"):
        out.append(CollectedPost(**_json.loads(path.read_text())))
    return out


def synthesize(theme: Theme, sources: list[CollectedPost] | None = None, n: int = 4) -> ThaiPost:
    if sources is None:
        sources = gather_for_theme(theme, _load_all_collected(), n=n)

    snippets = [
        {
            "account": s.source_account,
            "platform": "instagram",
            "url": s.url,
            "caption": s.caption,
            "likes": s.likes,
        }
        for s in sources
    ]

    user_prompt = SYNTHESIS_USER_TEMPLATE.format(
        theme_title=theme.title_th,
        theme_category=theme.category,
        theme_hook=theme.hook,
        source_block=build_source_block(snippets),
    )

    client = _client()
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2500,
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

    return ThaiPost(
        theme_id=theme.id,
        hook_title=data["hook_title"],
        slides=[Slide(**s) for s in data["slides"]],
        caption=data["caption"],
        hashtags=data["hashtags"],
        cta=data["cta"],
        source_urls=[s.url for s in sources],
        model=CLAUDE_MODEL,
        raw_json=data,
    )


def save_post(post: ThaiPost) -> Path:
    path = REWRITES_DIR / post.filename
    path.write_text(json.dumps(asdict(post), ensure_ascii=False, indent=2))
    return path


if __name__ == "__main__":
    from rewriter.themes import pick_today

    theme = pick_today()
    print(f"today's theme: {theme.id} — {theme.title_th}")
    post = synthesize(theme)
    path = save_post(post)
    print(f"synthesized → {path}")
