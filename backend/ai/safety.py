"""
Deterministic clinical safety layer that sits between the AI's suggestion
and what the system acts on.

Design principle: the AI may *escalate* acuity, but it must never silently
*downgrade* a recognized red flag. These rules are intentionally simple,
transparent, and independent of the model so a triage nurse can audit them.
"""

# Confidence below this always requires a human to confirm the routing.
CONFIDENCE_THRESHOLD = 0.7

# Tier A — immediate life threat. Floors CTAS at 1 (Resuscitation).
LIFE_THREAT_KEYWORDS = [
    "not breathing", "stopped breathing", "no pulse", "cardiac arrest",
    "unconscious", "unresponsive", "anaphylaxis", "throat closing",
    "choking", "severe bleeding", "uncontrolled bleeding", "hemorrhage",
    "active seizure", "seizing", "blue lips", "turning blue",
]

# Tier B — high-risk presentations. Floors CTAS at 2 (Emergent).
RED_FLAG_KEYWORDS = [
    "chest pain", "chest tightness", "shortness of breath", "difficulty breathing",
    "trouble breathing", "can't breathe", "cant breathe", "short of breath",
    "slurred speech", "face droop", "facial droop", "one-sided weakness",
    "one sided weakness", "sudden weakness", "sudden numbness",
    "altered consciousness", "altered mental status", "confusion", "fainting",
    "overdose", "suicidal", "suicide", "self-harm", "coughing up blood",
    "vomiting blood", "stiff neck", "worst headache",
]


def _collect_text(structured: dict, raw_symptoms: str) -> str:
    """Flatten every free-text field the model produced into one lowercase blob."""
    parts = [
        raw_symptoms or "",
        structured.get("chief_complaint", "") or "",
        " ".join(structured.get("symptoms", []) or []),
        " ".join(structured.get("severity_indicators", []) or []),
        " ".join(structured.get("vital_concerns", []) or []),
    ]
    return " ".join(parts).lower()


def apply_safety_net(ctas_level: int, structured: dict, raw_symptoms: str) -> dict:
    """
    Enforce a minimum acuity based on red-flag keywords.

    Returns a dict:
      {
        "ctas_level": <possibly escalated int>,
        "safety_override": <bool — did we escalate?>,
        "safety_reason": <str — why, or "">,
      }
    """
    text = _collect_text(structured, raw_symptoms)

    life_hits = [kw for kw in LIFE_THREAT_KEYWORDS if kw in text]
    red_hits = [kw for kw in RED_FLAG_KEYWORDS if kw in text]

    floor = 5  # least urgent; no constraint
    trigger = ""
    if life_hits:
        floor = 1
        trigger = f"life-threatening indicator(s): {', '.join(life_hits)}"
    elif red_hits:
        floor = 2
        trigger = f"red-flag indicator(s): {', '.join(red_hits)}"

    # Lower CTAS number = more urgent, so min() only ever escalates.
    adjusted = min(ctas_level, floor)
    overridden = adjusted < ctas_level

    reason = ""
    if overridden:
        reason = (
            f"Safety net escalated CTAS {ctas_level} → {adjusted} due to {trigger}."
        )

    return {
        "ctas_level": adjusted,
        "safety_override": overridden,
        "safety_reason": reason,
    }


def requires_confirmation(ctas_level: int, confidence: float, safety_override: bool) -> bool:
    """
    Decide whether a human must confirm before the patient is considered routed.

    Mandatory human-in-the-loop when the stakes or the uncertainty are high:
      - high-acuity cases (CTAS 1 or 2),
      - low model confidence,
      - or any case the safety net had to escalate.
    """
    if ctas_level <= 2:
        return True
    if confidence < CONFIDENCE_THRESHOLD:
        return True
    if safety_override:
        return True
    return False
