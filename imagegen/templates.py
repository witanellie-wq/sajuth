"""Visual constants for slide rendering."""
from __future__ import annotations

SLIDE_W = 1080
SLIDE_H = 1350

PADDING = 80

PALETTES = {
    "pastel_pink": {
        "bg": (253, 237, 241),
        "accent": (230, 160, 180),
        "text": (60, 40, 50),
        "subtext": (130, 100, 115),
    },
    "pastel_lavender": {
        "bg": (240, 235, 250),
        "accent": (170, 150, 210),
        "text": (50, 45, 70),
        "subtext": (120, 115, 145),
    },
    "pastel_mint": {
        "bg": (230, 245, 240),
        "accent": (130, 190, 175),
        "text": (40, 60, 55),
        "subtext": (95, 130, 120),
    },
}

DEFAULT_PALETTE = "pastel_pink"

# Font filenames resolved from assets/fonts/
HEADING_FONT = "NotoSansThai-Bold.ttf"
BODY_FONT = "NotoSansThai-Regular.ttf"

HEADING_SIZE = 72
SUBHEADING_SIZE = 54
BODY_SIZE = 42
