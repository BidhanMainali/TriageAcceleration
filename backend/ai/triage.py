import json
import re
import anthropic
from .prompts import TRIAGE_SYSTEM, TRIAGE_USER


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


def run_triage(
    name: str,
    age: int,
    gender: str,
    structured: dict,
    departments: list,
    doctors: list,
) -> dict:
    """Stage 2: structured symptoms → CTAS level + routing recommendation."""
    client = anthropic.Anthropic()

    dept_str = json.dumps([
        {
            "id": d["id"],
            "name": d["name"],
            "current_load": d["current_load"],
            "capacity": d["capacity"],
        }
        for d in departments
    ], indent=2)

    doc_str = json.dumps([
        {
            "id": d["id"],
            "name": d["name"],
            "specialization": d.get("specialization"),
            "department_id": d.get("department_id"),
            "current_patient_count": d.get("current_patient_count", 0),
        }
        for d in doctors
    ], indent=2)

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        system=TRIAGE_SYSTEM,
        messages=[{
            "role": "user",
            "content": TRIAGE_USER.format(
                name=name,
                age=age,
                gender=gender,
                chief_complaint=structured.get("chief_complaint", ""),
                symptoms=", ".join(structured.get("symptoms", [])),
                symptom_duration=structured.get("symptom_duration", "unknown"),
                severity_indicators=", ".join(structured.get("severity_indicators", [])),
                vital_concerns=", ".join(structured.get("vital_concerns", [])),
                relevant_history=structured.get("relevant_history", "none reported"),
                departments=dept_str,
                doctors=doc_str,
            )
        }]
    )

    return _parse_json(message.content[0].text)
