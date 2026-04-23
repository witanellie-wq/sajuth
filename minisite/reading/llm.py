"""Claude API streaming wrapper.

Design choices:
- **Model:** claude-opus-4-7 for highest quality on a premium product.
  If the economics ever force a downgrade, switch to `claude-sonnet-4-6`.
- **Streaming:** we yield text tokens so Streamlit's st.write_stream can
  display the reading as it generates — this doubles as timeout protection
  for larger max_tokens values.
- **Prompt caching:** system prompts are reused across every customer, so
  we mark them with cache_control. Expect `cache_read_input_tokens` to
  dominate after the second request and cut input cost by ~90%.
- **Thinking:** adaptive thinking with high effort. Opus 4.7 rejects
  `budget_tokens`, so we do not set it; effort controls depth instead.
- **Display:** thinking is omitted by default on Opus 4.7. We leave it
  omitted because the paid reading only surfaces the final text to users.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import streamlit as st

try:
    import anthropic  # type: ignore
except ImportError:  # pragma: no cover — listed in requirements
    anthropic = None

from .prompts import TIERS


MODEL = "claude-opus-4-7"


def _api_key() -> str | None:
    # Prefer Streamlit secrets (deployment), fall back to env (local dev).
    try:
        key = st.secrets.get("ANTHROPIC_API_KEY")
    except (FileNotFoundError, AttributeError):
        key = None
    return key or os.environ.get("ANTHROPIC_API_KEY")


def stream_reading(*, tier: str, chart_summary: str) -> Iterator[str]:
    """Yield text chunks of the reading for the given tier."""
    if anthropic is None:
        yield "(LLM library is not installed on this deployment.)"
        return

    key = _api_key()
    if not key:
        yield "(LLM API key is missing — add ANTHROPIC_API_KEY to Streamlit secrets.)"
        return

    spec = TIERS[tier]
    client = anthropic.Anthropic(api_key=key)

    with client.messages.stream(
        model=MODEL,
        max_tokens=spec["max_tokens"],
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        system=[{
            "type": "text",
            "text": spec["system_prompt"],
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": chart_summary}],
    ) as stream:
        for text in stream.text_stream:
            yield text
