from .prompts import EXTRACTION_SYSTEM, EXTRACTION_USER
from .utils import request_json


def extract_symptoms(name: str, age: int, gender: str, raw_symptoms: str) -> dict:
    """Stage 1: free text → structured symptom data."""
    return request_json(
        system=EXTRACTION_SYSTEM,
        user=EXTRACTION_USER.format(
            name=name,
            age=age,
            gender=gender,
            raw_symptoms=raw_symptoms,
        ),
        max_tokens=1024,
    )
