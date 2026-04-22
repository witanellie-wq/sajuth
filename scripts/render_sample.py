"""Render a hand-crafted ThaiPost JSON into PNG slides under samples/.

Used for previewing what real output will look like before paying for
actual Claude synthesis.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from imagegen.renderer import render_post
from imagegen.templates import PALETTES
from rewriter.synthesizer import Slide, ThaiPost


def _load_thai_post(path: Path) -> ThaiPost:
    data = json.loads(path.read_text())
    slides = [Slide(**s) for s in data["slides"]]
    return ThaiPost(
        theme_id=data["theme_id"],
        hook_title=data["hook_title"],
        slides=slides,
        caption=data["caption"],
        hashtags=data["hashtags"],
        cta=data["cta"],
        source_urls=data.get("source_urls", []),
        model=data.get("model", ""),
        raw_json=data.get("raw_json", {}),
    )


def render_and_copy(json_path: Path, out_dir: Path, palette: str) -> list[Path]:
    post = _load_thai_post(json_path)
    rendered = render_post(post, palette=palette)
    dest = out_dir / palette
    dest.mkdir(parents=True, exist_ok=True)
    copied: list[Path] = []
    for src in rendered:
        d = dest / src.name
        shutil.copy2(src, d)
        copied.append(d)
    return copied


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--palettes", nargs="+", default=list(PALETTES.keys()))
    args = parser.parse_args()

    for pal in args.palettes:
        paths = render_and_copy(args.json, args.out, pal)
        print(f"{pal}: {len(paths)} slides → {paths[0].parent}")
