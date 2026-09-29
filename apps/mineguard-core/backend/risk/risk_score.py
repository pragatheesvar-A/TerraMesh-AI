"""
Unified Risk Scoring — channel scores and zone aggregation.

Scoring model (explicit, documented):
  * Each channel (tilt, displacement, vibration, crack) is scored
    independently on the SAME curve:
        value <= warning_high          ->  0
        warning_high < value           ->  50 + progress * 30
      where progress = (value - warning_high) / (critical_high - warning_high)
      i.e. 50 at the warning limit, 80 at the critical limit, 100 at 1.67x
      the critical limit.
  * Channel fusion is deliberately CONSERVATIVE (safety-first):
        fused = max(channel scores) + 10 per additional channel >= 50
      A single channel can escalate on its own; corroborating channels push
      the score up to a hard cap of 100.
  * Zone aggregation uses the 90th percentile of node scores so one critical
    node is never diluted by many healthy ones.

All thresholds are PROJECT-DEFINED ENGINEERING LIMITS (see risk/thresholds.py)
— never presented as statutory requirements.
"""


def _channel_score(value: float, thresh) -> float:
    """Single-channel score on the documented 0/50/80/100 curve."""
    if value is None:
        return 0.0
    v = abs(value)
    if thresh is None or v <= thresh.warning_high:
        return 0.0
    span = thresh.critical_high - thresh.warning_high
    progress = (v - thresh.warning_high) / span if span > 0 else 1.0
    return 50.0 + (progress * 30.0)


def calculate_node_risk(sensor_data: dict, thresholds: dict) -> dict:
    """
    Scores all configured channels for a node.

    Returns {"score": fused 0-100, "channels": {name: channel score}} so the
    engine can surface which channel drove the escalation.
    """
    t_tilt = thresholds.get("tilt")
    t_disp = thresholds.get("displacement") or thresholds.get("convergence")
    t_vib = thresholds.get("vibration")
    t_crack = thresholds.get("crack")

    tilt = abs(sensor_data.get("tilt", 0) or 0)
    # displacement_rate (mm/day) is the canonical key; bare displacement is
    # accepted for HTTP ingest compatibility.
    disp = sensor_data.get("displacement_rate", sensor_data.get("displacement"))
    disp = abs(disp) if disp is not None else None
    vib = abs(sensor_data.get("vibration_val", 0) or 0)
    crack = sensor_data.get("crack_mm", sensor_data.get("crack_width"))
    crack = abs(crack) if crack is not None else None

    channels = {
        "tilt": _channel_score(tilt, t_tilt),
        "displacement": _channel_score(disp, t_disp),
        "vibration": _channel_score(vib, t_vib),
        "crack": _channel_score(crack, t_crack),
    }

    values = list(channels.values())
    fused = max(values) if values else 0.0
    corroborating = sum(1 for s in values if s >= 50.0)
    if corroborating > 1:
        fused += 10.0 * (corroborating - 1)

    return {"score": min(100.0, fused), "channels": channels}


def aggregate_zone_risk(node_scores: list) -> float:
    """90th percentile of node scores (does NOT mutate the caller's list)."""
    if not node_scores:
        return 0.0
    ordered = sorted(node_scores)
    idx = int(len(ordered) * 0.9)
    if idx >= len(ordered):
        idx = len(ordered) - 1
    return ordered[idx]
