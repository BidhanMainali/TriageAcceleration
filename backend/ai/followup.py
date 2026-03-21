import json
import re
import anthropic
from .prompts import FOLLOWUP_SYSTEM, FOLLOWUP_USER


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


def generate_followup(structured: dict) -> list[str]:
    """Generate 1-3 clarifying questions based on extracted symptoms."""
    client = anthropic.Anthropic()

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        system=FOLLOWUP_SYSTEM,
        messages=[{
            "role": "user",
            "content": FOLLOWUP_USER.format(
                chief_complaint=structured.get("chief_complaint", ""),
                symptoms=", ".join(structured.get("symptoms", [])),
                severity_indicators=", ".join(structured.get("severity_indicators", [])),
            )
        }]
    )

    result = _parse_json(message.content[0].text)
    return result.get("questions", [])
