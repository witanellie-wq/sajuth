"""Time corrections for saju calculation.

Two adjustments matter:

1. **Standard-meridian shift.** Traditional Korean manseryeok tables are built
   for KST (longitude 135° E). When a user is born somewhere else, we convert
   the local clock time to the equivalent KST civil time before feeding it to
   the calendar so the pillars come out identical to the Korean reference.

2. **True solar time (진태양시).** Within any time zone the sun crosses the
   meridian later as you move west. We add a per-degree offset of 4 minutes
   relative to the standard meridian of the birth location's time zone.
"""

from datetime import datetime, timedelta

# Minutes of offset per degree of longitude (Earth rotates 15°/hour)
_MIN_PER_DEG = 4.0

# Korean manseryeok reference meridian
KST_MERIDIAN = 135.0


def standard_meridian_for_offset(tz_offset_hours: float) -> float:
    """The nominal standard meridian for a given UTC offset (e.g. UTC+7 → 105°E)."""
    return tz_offset_hours * 15.0


def apply_corrections(local_dt: datetime,
                      longitude: float,
                      tz_offset_hours: float) -> tuple[datetime, int]:
    """Convert a local civil datetime to its true-solar-time equivalent on
    the KST (135° E) reference, so it can be fed to a Korean-style manseryeok.

    Returns (corrected_datetime, total_offset_minutes).
    """
    # Minutes to shift so 12:00 local clock → 12:00 KST clock
    # (KST is ahead of local tz by (9 - tz_offset) hours)
    zone_shift_minutes = (9.0 - tz_offset_hours) * 60.0

    # True-solar-time adjustment relative to the tz's standard meridian
    std_meridian = standard_meridian_for_offset(tz_offset_hours)
    solar_shift_minutes = (longitude - std_meridian) * _MIN_PER_DEG

    total_shift = zone_shift_minutes + solar_shift_minutes
    corrected = local_dt + timedelta(minutes=total_shift)
    return corrected, int(round(total_shift))


def solar_shift_only_minutes(longitude: float, tz_offset_hours: float) -> int:
    """The '진태양시' offset in minutes, separate from the time-zone shift.
    This is what Korean apps display (e.g. '지역 -28분' in Sangju)."""
    std_meridian = standard_meridian_for_offset(tz_offset_hours)
    return int(round((longitude - std_meridian) * _MIN_PER_DEG))
