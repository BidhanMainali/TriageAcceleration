"""Tests for Pydantic model validation."""
import pytest
from pydantic import ValidationError

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import PatientIn, StatusUpdateIn


# ── PatientIn.age validation ──────────────────────────────────────────

class TestPatientInAge:
    def _make(self, **overrides):
        defaults = {
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC-1234-567-890",
            "age": 30,
            "raw_symptoms": "Headache and nausea",
        }
        defaults.update(overrides)
        return PatientIn(**defaults)

    def test_valid_age(self):
        p = self._make(age=25)
        assert p.age == 25

    def test_age_zero_is_valid(self):
        """Newborns have age 0."""
        p = self._make(age=0)
        assert p.age == 0

    def test_negative_age_rejected(self):
        with pytest.raises(ValidationError, match="cannot be negative"):
            self._make(age=-1)

    def test_age_over_150_rejected(self):
        with pytest.raises(ValidationError, match="cannot exceed 150"):
            self._make(age=151)

    def test_age_150_is_valid(self):
        p = self._make(age=150)
        assert p.age == 150

    def test_age_1_is_valid(self):
        p = self._make(age=1)
        assert p.age == 1


# ── PatientIn.name validation ─────────────────────────────────────────

class TestPatientInName:
    def _make(self, **overrides):
        defaults = {
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC-1234-567-890",
            "age": 30,
            "raw_symptoms": "Headache and nausea",
        }
        defaults.update(overrides)
        return PatientIn(**defaults)

    def test_valid_name(self):
        p = self._make(name="John O'Brien-Smith")
        assert p.name == "John O'Brien-Smith"

    def test_name_too_short(self):
        with pytest.raises(ValidationError, match="at least 2 characters"):
            self._make(name="A")

    def test_name_empty(self):
        with pytest.raises(ValidationError, match="at least 2 characters"):
            self._make(name="")

    def test_name_whitespace_only(self):
        with pytest.raises(ValidationError, match="at least 2 characters"):
            self._make(name="   ")

    def test_name_with_numbers_rejected(self):
        with pytest.raises(ValidationError, match="only contain letters"):
            self._make(name="John123")

    def test_name_with_special_chars_rejected(self):
        with pytest.raises(ValidationError, match="only contain letters"):
            self._make(name="John@Doe")

    def test_name_stripped(self):
        p = self._make(name="  Jane Doe  ")
        assert p.name == "Jane Doe"


# ── PatientIn.gender validation ───────────────────────────────────────

class TestPatientInGender:
    def _make(self, **overrides):
        defaults = {
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC-1234-567-890",
            "age": 30,
            "raw_symptoms": "Headache",
        }
        defaults.update(overrides)
        return PatientIn(**defaults)

    def test_valid_genders(self):
        for g in ["Male", "Female", "Other"]:
            p = self._make(gender=g)
            assert p.gender == g

    def test_invalid_gender(self):
        with pytest.raises(ValidationError, match="Gender must be one of"):
            self._make(gender="Unknown")

    def test_lowercase_gender_rejected(self):
        with pytest.raises(ValidationError, match="Gender must be one of"):
            self._make(gender="male")


# ── PatientIn.health_number validation ────────────────────────────────

class TestPatientInHealthNumber:
    def _make(self, **overrides):
        defaults = {
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC-1234-567-890",
            "age": 30,
            "raw_symptoms": "Headache",
        }
        defaults.update(overrides)
        return PatientIn(**defaults)

    def test_valid_health_number(self):
        p = self._make(health_number="BC-1234-567-890")
        assert p.health_number == "BC-1234-567-890"

    def test_short_health_number_rejected(self):
        with pytest.raises(ValidationError, match="at least 5 characters"):
            self._make(health_number="BC")

    def test_health_number_stripped(self):
        p = self._make(health_number="  BC-1234-567-890  ")
        assert p.health_number == "BC-1234-567-890"


# ── PatientIn.raw_symptoms validation ─────────────────────────────────

class TestPatientInSymptoms:
    def _make(self, **overrides):
        defaults = {
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC-1234-567-890",
            "age": 30,
            "raw_symptoms": "Headache",
        }
        defaults.update(overrides)
        return PatientIn(**defaults)

    def test_valid_symptoms(self):
        p = self._make(raw_symptoms="Severe chest pain")
        assert "chest pain" in p.raw_symptoms.lower()

    def test_empty_symptoms_rejected(self):
        with pytest.raises(ValidationError, match="required"):
            self._make(raw_symptoms="")

    def test_too_short_symptoms_rejected(self):
        with pytest.raises(ValidationError, match="required"):
            self._make(raw_symptoms="ab")


# ── StatusUpdateIn validation ─────────────────────────────────────────

class TestStatusUpdateIn:
    def test_valid_statuses(self):
        for s in ["waiting", "routed", "in_progress", "discharged"]:
            m = StatusUpdateIn(status=s)
            assert m.status == s

    def test_invalid_status(self):
        with pytest.raises(ValidationError, match="Status must be one of"):
            StatusUpdateIn(status="unknown")

    def test_empty_status(self):
        with pytest.raises(ValidationError, match="Status must be one of"):
            StatusUpdateIn(status="")
