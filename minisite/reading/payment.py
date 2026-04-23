"""Stripe Payment Link glue.

The flow is:
1. User sees their free chart.
2. For each tier we encode their birth profile into `client_reference_id`
   and append it to the pre-configured Stripe Payment Link URL.
3. User pays on Stripe. On success Stripe redirects back to the app with
   `?paid=1&tier=<tier>&session_id={CHECKOUT_SESSION_ID}` (the success URL
   template is configured once, per Payment Link, in the Stripe dashboard).
4. We use the Stripe secret key to `checkout.Session.retrieve(session_id)`,
   verify `payment_status == "paid"`, and pull the encoded birth profile
   back out of `client_reference_id`.

`client_reference_id` has a 200-character cap and must be URL-safe. We
encode a short pipe-delimited string and never put anything sensitive in
there — the raw inputs (date / time / gender / city_key) are not secrets.
"""

from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass
from datetime import date, time
from urllib.parse import quote

import streamlit as st

try:
    import stripe  # type: ignore
except ImportError:  # pragma: no cover — stripe is in requirements but guard anyway
    stripe = None


@dataclass
class ChartRef:
    birth_date: date
    birth_time: time
    gender: str           # "male" | "female"
    country_code: str
    city_key: str
    name: str             # may be empty string

    def encode(self) -> str:
        """Pipe-delimited, base64(url-safe)-wrapped — fits well under 200 chars."""
        raw = "|".join([
            self.birth_date.isoformat(),
            self.birth_time.strftime("%H:%M"),
            self.gender[:1],                       # "m" / "f"
            self.country_code,
            self.city_key,
            self.name.replace("|", " ").strip()[:40],
        ])
        return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")

    @classmethod
    def decode(cls, s: str) -> "ChartRef | None":
        try:
            pad = "=" * (-len(s) % 4)
            raw = base64.urlsafe_b64decode(s + pad).decode("utf-8")
            parts = raw.split("|")
            if len(parts) < 5:
                return None
            d = date.fromisoformat(parts[0])
            h, m = map(int, parts[1].split(":"))
            t = time(h, m)
            gender = "female" if parts[2] == "f" else "male"
            name = parts[5] if len(parts) > 5 else ""
            return cls(
                birth_date=d,
                birth_time=t,
                gender=gender,
                country_code=parts[3],
                city_key=parts[4],
                name=name,
            )
        except (ValueError, binascii.Error, UnicodeDecodeError):
            return None


# ── Secrets helpers ────────────────────────────────────────────────────────
def _secret(name: str, default: str | None = None) -> str | None:
    try:
        v = st.secrets.get(name, default)
    except (FileNotFoundError, AttributeError):
        return default
    return v if v else default


def readings_configured() -> bool:
    """True when both the Stripe and Claude keys are present in secrets."""
    if _secret("ANTHROPIC_API_KEY") is None:
        return False
    if _secret("STRIPE_SECRET_KEY") is None:
        return False
    # At least one payment link for the checkout to work
    for tier in ("CORE", "YEARLY", "FULL"):
        if _secret(f"STRIPE_PAYMENT_LINK_{tier}"):
            return True
    return False


def payment_link_for_tier(tier: str, chart_ref: ChartRef) -> str | None:
    base = _secret(f"STRIPE_PAYMENT_LINK_{tier.upper()}")
    if not base:
        return None
    encoded = chart_ref.encode()
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}client_reference_id={quote(encoded)}"


def verify_payment(session_id: str) -> dict | None:
    """Return a dict with `client_reference_id` + `amount_total` when paid.
    Returns None if the session does not exist, isn't paid, or Stripe is
    not configured in this environment."""
    if stripe is None:
        return None
    api_key = _secret("STRIPE_SECRET_KEY")
    if not api_key:
        return None
    try:
        stripe.api_key = api_key
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception:
        return None
    if getattr(session, "payment_status", None) != "paid":
        return None
    return {
        "client_reference_id": session.client_reference_id,
        "amount_total": session.amount_total,
        "currency": session.currency,
    }
