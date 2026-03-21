from .extraction import extract_symptoms
from .triage import run_triage


def run_pipeline(patient: dict, departments: list, doctors: list) -> dict:
    """
    Full AI pipeline: free text → structured → CTAS + routing.

    Returns a merged dict with:
      structured_symptoms, ctas_level, ctas_rationale,
      recommended_department_id, recommended_doctor_id,
      ai_reasoning, confidence, clinical_summary
    """
    structured = extract_symptoms(
        name=patient["name"],
        age=patient["age"],
        gender=patient["gender"],
        raw_symptoms=patient["raw_symptoms"],
    )

    triage_result = run_triage(
        name=patient["name"],
        age=patient["age"],
        gender=patient["gender"],
        structured=structured,
        departments=departments,
        doctors=doctors,
    )

    return {
        "structured_symptoms": structured,
        **triage_result,
    }
