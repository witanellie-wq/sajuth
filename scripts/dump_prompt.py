"""Dump the exact prompt that would be sent to Claude for today's theme.

Useful for validating prompt + inputs before spending API tokens.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from rewriter.prompts import SYSTEM_PROMPT, SYNTHESIS_USER_TEMPLATE, build_source_block
from rewriter.synthesizer import _load_all_collected, gather_for_theme
from rewriter.themes import BY_ID, pick_today


def dump(theme_id: str | None = None, out: Path | None = None) -> str:
    theme = BY_ID[theme_id] if theme_id else pick_today()
    posts = gather_for_theme(theme, _load_all_collected(), n=4)

    snippets = [
        {
            "account": p.source_account,
            "platform": "instagram",
            "url": p.url,
            "caption": p.caption,
            "likes": p.likes,
        }
        for p in posts
    ]

    user = SYNTHESIS_USER_TEMPLATE.format(
        theme_title=theme.title_th,
        theme_category=theme.category,
        theme_hook=theme.hook,
        source_block=build_source_block(snippets),
    )

    dump_text = (
        f"=== THEME ===\n{theme.id}  [{theme.category}]  {theme.title_th}\n\n"
        f"=== SYSTEM PROMPT (cacheable) ===\n{SYSTEM_PROMPT}\n\n"
        f"=== USER PROMPT ===\n{user}\n"
    )

    if out:
        out.write_text(dump_text)
    return dump_text


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--theme")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    text = dump(args.theme, args.out)
    if not args.out:
        print(text)
