"""End-to-end daily run for Duang Saju.

Pipeline:
  1. discover   — pull new Korean saju posts from hashtags + seed accounts
  2. theme      — pick today's theme (cadence-aware rotation)
  3. gather     — rank collected posts by theme relevance
  4. synthesize — Claude synthesizes an original Thai post from N sources
  5. render     — 1080x1350 carousel PNGs
  6. publish    — (gated) IG Graph API carousel publish

Actual publishing is disabled by default until image hosting is wired up.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from collector.discovery import discover_all
from collector.instagram_collector import collect_all
from imagegen.renderer import render_post
from rewriter.synthesizer import gather_for_theme, save_post, synthesize, _load_all_collected
from rewriter.themes import pick_today


def run(sources_per_post: int = 4, dry_run: bool = True, skip_discovery: bool = False) -> None:
    if not skip_discovery:
        print("[1/5] discover (hashtags + seed accounts)")
        seed_posts = collect_all()
        hashtag_posts = discover_all()
        print(f"  + {len(seed_posts)} seed + {len(hashtag_posts)} hashtag posts")
    else:
        print("[1/5] discover — skipped")

    print("[2/5] pick theme")
    theme = pick_today()
    print(f"  → {theme.id}  ({theme.category})  '{theme.title_th}'")

    print("[3/5] gather sources")
    all_posts = _load_all_collected()
    ranked = gather_for_theme(theme, all_posts, n=sources_per_post)
    for p in ranked:
        print(f"    · @{p.source_account}  ❤{p.likes}  {p.url}")

    print("[4/5] synthesize")
    post = synthesize(theme, sources=ranked)
    path = save_post(post)
    print(f"  → {path}")

    print("[5/5] render")
    paths = render_post(post)
    print(f"  → {len(paths)} slides in {paths[0].parent}")

    if dry_run:
        print("[publish] dry-run — skipping IG publish")
        return

    raise NotImplementedError("Image hosting + publish step not yet configured")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sources", type=int, default=4)
    parser.add_argument("--skip-discovery", action="store_true")
    parser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    run(
        sources_per_post=args.sources,
        dry_run=not args.publish,
        skip_discovery=args.skip_discovery,
    )
