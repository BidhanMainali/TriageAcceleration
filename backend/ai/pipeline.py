from .extraction import extract_symptoms
from .triage import run_triage
from .safety import apply_safety_net, requires_confirmation


def _pick_default_department(departments: list) -> str | None:
    """Prefer Emergency as the safe default; else the first available dept."""
    for d in departments:
        if d["id"] == "dept-er":
            return d["id"]
    return departments[0]["id"] if departments else None


def _fallback_structured(patient: dict) -> dict:
    """Minimal structured record when symptom extraction is unavailable."""
    return {
        "chief_complaint": (patient.get("raw_symptoms") or "")[:200],
        "symptoms": [],
        "symptom_duration": "unknown",
        "severity_indicators": [],
        "relevant_history": "none reported",
        "vital_concerns": [],
    }


def _fallback_triage(departments: list) -> dict:
    """
    Conservative routing when the triage model is unavailable: send to
    Emergency at CTAS 2 with zero confidence so it is always flagged for a
    human. Over-triage is the safe failure direction.
    """
    dept_id = _pick_default_department(departments)
    return {
        "ctas_level": 2,
        "ctas_rationale": "AI triage unavailable — defaulted to Emergency for manual assessment.",
        "recommended_department_id": dept_id,
        "recommended_doctor_id": None,
        "ai_reasoning": "Automated triage could not be completed. Routed to Emergency pending nurse review.",
        "confidence": 0.0,
        "clinical_summary": "Automated triage unavailable. Manual assessment required.",
        "department_scores": [],
    }


def _clamp(value, low, high, default):
    try:
        return max(low, min(high, type(default)(value)))
    except (TypeError, ValueError):
        return default


def _validate_triage(result: dict, departments: list, doctors: list) -> dict:
    """
    Guard against hallucinated or out-of-range model output before it is
    trusted: clamp CTAS/confidence and ensure routing points at real records.
    """
    dept_ids = {d["id"] for d in departments}
    doctor_ids = {d["id"] for d in doctors}

    result["ctas_level"] = _clamp(result.get("ctas_level"), 1, 5, 5)
    result["confidence"] = _clamp(result.get("confidence"), 0.0, 1.0, 0.5)

    # Keep only scores that reference a real department.
    scores = [
        s for s in (result.get("department_scores") or [])
        if isinstance(s, dict) and s.get("department_id") in dept_ids
    ]
    result["department_scores"] = scores

    # Repair an invalid department: prefer the highest valid score, else default.
    dept_id = result.get("recommended_department_id")
    if dept_id not in dept_ids:
        best = max(scores, key=lambda s: s.get("score", 0), default=None)
        result["recommended_department_id"] = (
            best["department_id"] if best else _pick_default_department(departments)
        )

    # A hallucinated doctor is dropped rather than stored as a dangling ref.
    if result.get("recommended_doctor_id") not in doctor_ids:
        result["recommended_doctor_id"] = None

    return result


def run_pipeline(patient: dict, departments: list, doctors: list) -> dict:
    """
    Full AI pipeline: free text → structured → CTAS + routing, with a
    deterministic safety net applied on top.

    Never raises on model failure — falls back to a conservative,
    human-review routing instead.

    Returns a merged dict with:
      structured_symptoms, ctas_level, ctas_rationale,
      recommended_department_id, recommended_doctor_id,
      ai_reasoning, confidence, clinical_summary, department_scores,
      safety_override, safety_reason, requires_confirmation
    """
    try:
        structured = extract_symptoms(
            name=patient["name"],
            age=patient["age"],
            gender=patient["gender"],
            raw_symptoms=patient["raw_symptoms"],
        )
    except Exception:
        structured = _fallback_structured(patient)

    try:
        triage_result = run_triage(
            name=patient["name"],
            age=patient["age"],
            gender=patient["gender"],
            structured=structured,
            departments=departments,
            doctors=doctors,
        )
    except Exception:
        triage_result = _fallback_triage(departments)

    triage_result = _validate_triage(triage_result, departments, doctors)

    # Deterministic safety net: may escalate CTAS, never downgrades.
    safety = apply_safety_net(
        triage_result["ctas_level"], structured, patient.get("raw_symptoms", "")
    )
    triage_result["ctas_level"] = safety["ctas_level"]
    triage_result["safety_override"] = safety["safety_override"]
    triage_result["safety_reason"] = safety["safety_reason"]
    triage_result["requires_confirmation"] = requires_confirmation(
        triage_result["ctas_level"],
        triage_result["confidence"],
        safety["safety_override"],
    )

    return {
        "structured_symptoms": structured,
        **triage_result,
    }
