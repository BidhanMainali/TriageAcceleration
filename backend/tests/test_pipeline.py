"""Tests for the AI pipeline: output validation, safe fallback, safety net."""
import pytest
from unittest.mock import patch

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai.pipeline import run_pipeline


DEPARTMENTS = [
    {"id": "dept-er", "name": "Emergency", "current_load": 0, "capacity": 20},
    {"id": "dept-cardio", "name": "Cardiology", "current_load": 0, "capacity": 8},
]
DOCTORS = [
    {
        "id": "doc-chen", "name": "Dr. Sarah Chen",
        "specialization": "Emergency Medicine",
        "department_id": "dept-er", "current_patient_count": 0,
    },
]

STRUCTURED = {
    "chief_complaint": "Rash on arm",
    "symptoms": ["Rash"],
    "symptom_duration": "2 days",
    "severity_indicators": [],
    "relevant_history": "none",
    "vital_concerns": [],
}


def _patient(raw="Mild rash on arm for two days"):
    return {"name": "Test Patient", "age": 40, "gender": "Male", "raw_symptoms": raw}


def _triage(**overrides):
    base = {
        "ctas_level": 4,
        "ctas_rationale": "Stable",
        "recommended_department_id": "dept-er",
        "recommended_doctor_id": "doc-chen",
        "ai_reasoning": "Minor issue",
        "confidence": 0.9,
        "clinical_summary": "Minor rash",
        "department_scores": [
            {"department_id": "dept-er", "score": 0.8, "reasoning": "fits"},
            {"department_id": "dept-cardio", "score": 0.1, "reasoning": "no"},
        ],
    }
    base.update(overrides)
    return base


class TestPipelineHappyPath:
    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_merges_and_adds_safety_fields(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        mock_triage.return_value = _triage()

        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)

        assert result["structured_symptoms"] == STRUCTURED
        assert result["ctas_level"] == 4
        assert result["recommended_department_id"] == "dept-er"
        assert result["safety_override"] is False
        assert result["requires_confirmation"] is False


class TestOutputValidation:
    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_invalid_department_repaired_to_best_score(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        mock_triage.return_value = _triage(recommended_department_id="dept-hallucinated")

        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)
        # Highest valid score is dept-er.
        assert result["recommended_department_id"] == "dept-er"

    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_hallucinated_doctor_dropped(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        mock_triage.return_value = _triage(recommended_doctor_id="doc-nobody")

        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)
        assert result["recommended_doctor_id"] is None

    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_out_of_range_ctas_clamped(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        mock_triage.return_value = _triage(ctas_level=9)

        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)
        assert result["ctas_level"] == 5

    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_scores_for_unknown_departments_filtered(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        mock_triage.return_value = _triage(department_scores=[
            {"department_id": "dept-er", "score": 0.8, "reasoning": "fits"},
            {"department_id": "dept-ghost", "score": 0.9, "reasoning": "fake"},
        ])
        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)
        dept_ids = {s["department_id"] for s in result["department_scores"]}
        assert dept_ids == {"dept-er"}


class TestFallbackOnModelFailure:
    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_triage_failure_falls_back_to_emergency(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        mock_triage.side_effect = RuntimeError("model down")

        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)
        assert result["recommended_department_id"] == "dept-er"
        assert result["ctas_level"] == 2
        assert result["confidence"] == 0.0
        assert result["requires_confirmation"] is True

    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_extraction_failure_uses_fallback_structured(self, mock_extract, mock_triage):
        mock_extract.side_effect = RuntimeError("model down")
        mock_triage.return_value = _triage()

        result = run_pipeline(_patient("Sprained ankle"), DEPARTMENTS, DOCTORS)
        # Fallback chief_complaint is derived from the raw symptoms.
        assert result["structured_symptoms"]["chief_complaint"] == "Sprained ankle"

    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_total_failure_never_raises(self, mock_extract, mock_triage):
        mock_extract.side_effect = RuntimeError("down")
        mock_triage.side_effect = RuntimeError("down")

        result = run_pipeline(_patient(), DEPARTMENTS, DOCTORS)
        assert result["ctas_level"] == 2
        assert result["requires_confirmation"] is True


class TestSafetyNetIntegration:
    @patch("ai.pipeline.run_triage")
    @patch("ai.pipeline.extract_symptoms")
    def test_red_flag_escalates_model_output(self, mock_extract, mock_triage):
        mock_extract.return_value = STRUCTURED
        # Model under-triaged a chest-pain patient at CTAS 4.
        mock_triage.return_value = _triage(ctas_level=4)

        result = run_pipeline(_patient("crushing chest pain"), DEPARTMENTS, DOCTORS)
        assert result["ctas_level"] == 2
        assert result["safety_override"] is True
        assert result["requires_confirmation"] is True
