from .prompts import FOLLOWUP_SYSTEM, FOLLOWUP_USER
from .utils import request_json


def generate_followup(structured: dict) -> list[str]:
    """Generate 1-3 clarifying questions based on extracted symptoms."""
    result = request_json(
        system=FOLLOWUP_SYSTEM,
        user=FOLLOWUP_USER.format(
            chief_complaint=structured.get("chief_complaint", ""),
            symptoms=", ".join(structured.get("symptoms", [])),
            severity_indicators=", ".join(structured.get("severity_indicators", [])),
        ),
        max_tokens=512,
    )
    return result.get("questions", [])
