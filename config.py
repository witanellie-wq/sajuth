"""Centralized configuration and path setup."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
POSTS_DIR = DATA_DIR / "posts"
REWRITES_DIR = DATA_DIR / "rewrites"
IMAGES_DIR = DATA_DIR / "images"
PUBLISHED_DIR = DATA_DIR / "published"
ASSETS_DIR = ROOT / "assets"

for _d in (POSTS_DIR, REWRITES_DIR, IMAGES_DIR, PUBLISHED_DIR):
    _d.mkdir(parents=True, exist_ok=True)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

IG_ACCESS_TOKEN = os.getenv("IG_ACCESS_TOKEN", "")
IG_USER_ID = os.getenv("IG_USER_ID", "")
FB_PAGE_ID = os.getenv("FB_PAGE_ID", "")

IG_COLLECTOR_USERNAME = os.getenv("IG_COLLECTOR_USERNAME", "")
IG_COLLECTOR_SESSION_FILE = os.getenv("IG_COLLECTOR_SESSION_FILE", "")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
