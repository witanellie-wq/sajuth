"""PIL-based slide renderer. Produces 1080x1350 PNGs for IG carousel."""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# Glyphs the Thai font can't render get stripped so they don't become tofu boxes.
_UNSUPPORTED_RANGES = re.compile(
    "["
    "一-鿿"   # CJK Unified Ideographs (hanzi)
    "가-힯"   # Hangul syllables
    "぀-ゟ"   # Hiragana
    "゠-ヿ"   # Katakana
    "\U0001f300-\U0001faff"  # Emoji + pictographs
    "☀-➿"   # Misc symbols / dingbats
    "]"
)


def sanitize(text: str) -> str:
    out = _UNSUPPORTED_RANGES.sub("", text)
    return re.sub(r"\s+", " ", out).strip()

from config import ASSETS_DIR, IMAGES_DIR
from imagegen.templates import (
    BODY_FONT,
    BODY_SIZE,
    DEFAULT_PALETTE,
    HEADING_FONT,
    HEADING_SIZE,
    PADDING,
    PALETTES,
    SLIDE_H,
    SLIDE_W,
    SUBHEADING_SIZE,
)
from rewriter.synthesizer import ThaiPost


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = ASSETS_DIR / "fonts" / name
    if not path.exists():
        return ImageFont.load_default()
    return ImageFont.truetype(str(path), size=size)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for w in words:
        trial = f"{current} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            current = trial
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def render_hook(title: str, palette: str = DEFAULT_PALETTE) -> Image.Image:
    colors = PALETTES[palette]
    img = Image.new("RGB", (SLIDE_W, SLIDE_H), colors["bg"])
    draw = ImageDraw.Draw(img)
    font = _font(HEADING_FONT, HEADING_SIZE + 12)
    max_w = SLIDE_W - 2 * PADDING
    lines = _wrap(draw, sanitize(title), font, max_w)
    total_h = len(lines) * (font.size + 20)
    y = (SLIDE_H - total_h) // 2
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text(((SLIDE_W - w) / 2, y), line, fill=colors["text"], font=font)
        y += font.size + 20
    return img


def render_body(heading: str, body: str, palette: str = DEFAULT_PALETTE) -> Image.Image:
    colors = PALETTES[palette]
    img = Image.new("RGB", (SLIDE_W, SLIDE_H), colors["bg"])
    draw = ImageDraw.Draw(img)

    h_font = _font(HEADING_FONT, SUBHEADING_SIZE)
    b_font = _font(BODY_FONT, BODY_SIZE)
    max_w = SLIDE_W - 2 * PADDING

    y = PADDING * 2
    for line in _wrap(draw, sanitize(heading), h_font, max_w):
        draw.text((PADDING, y), line, fill=colors["accent"], font=h_font)
        y += h_font.size + 12

    y += 40
    for line in _wrap(draw, sanitize(body), b_font, max_w):
        draw.text((PADDING, y), line, fill=colors["text"], font=b_font)
        y += b_font.size + 16

    return img


def render_post(post: ThaiPost, palette: str = DEFAULT_PALETTE) -> list[Path]:
    from datetime import date
    out_dir = IMAGES_DIR / f"{date.today().isoformat()}__{post.theme_id}"
    out_dir.mkdir(parents=True, exist_ok=True)

    paths: list[Path] = []

    hook = render_hook(post.hook_title, palette)
    p = out_dir / "01_hook.png"
    hook.save(p)
    paths.append(p)

    for i, slide in enumerate(post.slides, start=2):
        img = render_body(slide.heading, slide.body, palette)
        p = out_dir / f"{i:02d}_slide.png"
        img.save(p)
        paths.append(p)

    return paths
