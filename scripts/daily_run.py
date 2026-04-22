"""End-to-end daily run: collect → rewrite → render → (dry-run publish).

Actual Instagram publishing is disabled by default (dry_run=True) until
image hosting is wired up. Run each stage individually during Phase 0.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from collector.instagram_collector import collect_all
from collector.storage import load_post, list_unprocessed
from config import IMAGES_DIR, REWRITES_DIR
from imagegen.renderer import render_rewrite
from rewriter.thai_rewriter import rewrite, save_rewrite


def run(limit: int = 2, dry_run: bool = True) -> None:
    print("[1/4] collect")
    collected = collect_all()
    print(f"  + {len(collected)} posts")

    print("[2/4] rewrite")
    pending = list_unprocessed(REWRITES_DIR)[:limit]
    rewrites = []
    for p in pending:
        post = load_post(p)
        rw = rewrite(post)
        save_rewrite(rw)
        rewrites.append(rw)
        print(f"  + {rw.filename}")

    print("[3/4] render")
    for rw in rewrites:
        paths = render_rewrite(rw)
        print(f"  + {len(paths)} slides → {paths[0].parent}")

    print("[4/4] publish")
    if dry_run:
        print("  (dry-run — skipping IG publish)")
        return

    # Publish step requires hosted image URLs. Wire up after storage bucket is set.
    raise NotImplementedError("Image hosting + publish step not yet configured")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=2, help="max posts to rewrite/render per run")
    parser.add_argument("--publish", action="store_true", help="actually publish to IG")
    args = parser.parse_args()
    run(limit=args.limit, dry_run=not args.publish)
