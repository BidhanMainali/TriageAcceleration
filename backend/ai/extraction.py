import json
import re
import anthropic
from .prompts import EXTRACTION_SYSTEM, EXTRACTION_USER


def _parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


def extract_symptoms(name: str, age: int, gender: str, raw_symptoms: str) -> dict:
    """Stage 1: free text → structured symptom data."""
    client = anthropic.Anthropic()

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=EXTRACTION_SYSTEM,
        messages=[{
            "role": "user",
            "content": EXTRACTION_USER.format(
                name=name,
                age=age,
                gender=gender,
                raw_symptoms=raw_symptoms,
            )
        }]
    )

    return _parse_json(message.content[0].text)
