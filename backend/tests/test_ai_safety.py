"""Unit tests for the deterministic safety layer and robust JSON parsing."""
import pytest

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ai.safety import apply_safety_net, requires_confirmation, CONFIDENCE_THRESHOLD
from ai.utils import parse_json, AIParseError


def _structured(**overrides):
    base = {
        "chief_complaint": "",
        "symptoms": [],
        "symptom_duration": "unknown",
        "severity_indicators": [],
        "relevant_history": "none",
        "vital_concerns": [],
    }
    base.update(overrides)
    return base


# ── Safety net: escalation ────────────────────────────────────────────

class TestSafetyNet:
    def test_red_flag_floors_ctas_at_2(self):
        result = apply_safety_net(4, _structured(), "Bad chest pain since morning")
        assert result["ctas_level"] == 2
        assert result["safety_override"] is True
        assert "chest pain" in result["safety_reason"]

    def test_life_threat_floors_ctas_at_1(self):
        result = apply_safety_net(3, _structured(), "Patient is unconscious")
        assert result["ctas_level"] == 1
        assert result["safety_override"] is True

    def test_benign_symptoms_unchanged(self):
        result = apply_safety_net(4, _structured(), "Mild headache for a day")
        assert result["ctas_level"] == 4
        assert result["safety_override"] is False
        assert result["safety_reason"] == ""

    def test_never_downgrades_more_urgent_model_output(self):
        # Model already said CTAS 1; a red flag must not push it down to 2.
        result = apply_safety_net(1, _structured(), "chest pain")
        assert result["ctas_level"] == 1
        assert result["safety_override"] is False

    def test_red_flag_detected_in_structured_symptoms(self):
        structured = _structured(symptoms=["Shortness of breath", "Fatigue"])
        result = apply_safety_net(5, structured, "feeling unwell")
        assert result["ctas_level"] == 2
        assert result["safety_override"] is True

    def test_life_threat_takes_priority_over_red_flag(self):
        result = apply_safety_net(4, _structured(), "chest pain and now unresponsive")
        assert result["ctas_level"] == 1


# ── Confirmation gating ───────────────────────────────────────────────

class TestRequiresConfirmation:
    def test_high_acuity_always_requires_confirmation(self):
        assert requires_confirmation(1, 0.99, False) is True
        assert requires_confirmation(2, 0.99, False) is True

    def test_low_confidence_requires_confirmation(self):
        low = CONFIDENCE_THRESHOLD - 0.1
        assert requires_confirmation(3, low, False) is True

    def test_safety_override_requires_confirmation(self):
        assert requires_confirmation(4, 0.99, True) is True

    def test_confident_low_acuity_does_not_require_confirmation(self):
        assert requires_confirmation(4, 0.95, False) is False
        assert requires_confirmation(5, 0.95, False) is False


# ── Robust JSON parsing ───────────────────────────────────────────────

class TestParseJson:
    def test_plain_json(self):
        assert parse_json('{"a": 1}') == {"a": 1}

    def test_json_fenced(self):
        assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}

    def test_json_with_surrounding_prose(self):
        text = 'Here is the result:\n{"ctas_level": 2}\nHope that helps.'
        assert parse_json(text) == {"ctas_level": 2}

    def test_empty_raises(self):
        with pytest.raises(AIParseError):
            parse_json("   ")

    def test_unparseable_raises(self):
        with pytest.raises(AIParseError):
            parse_json("not json at all")
