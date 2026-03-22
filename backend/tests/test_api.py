"""Tests for API endpoints using the FastAPI test client."""
import json
import pytest
import sys
import os
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ── Health endpoint ───────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_health(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


# ── Departments endpoint ─────────────────────────────────────────────

class TestDepartmentsEndpoint:
    def test_list_departments(self, client):
        res = client.get("/departments")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 5
        dept_names = [d["name"] for d in data]
        assert "Emergency" in dept_names
        assert "Cardiology" in dept_names

    def test_departments_have_required_fields(self, client):
        res = client.get("/departments")
        for dept in res.json():
            assert "id" in dept
            assert "name" in dept
            assert "capacity" in dept
            assert "current_load" in dept
            assert isinstance(dept["capacity"], int)
            assert dept["capacity"] > 0


# ── Staff endpoint ────────────────────────────────────────────────────

class TestStaffEndpoint:
    def test_list_all_staff(self, client):
        res = client.get("/staff")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 4

    def test_filter_on_shift(self, client):
        res = client.get("/staff?on_shift=true")
        assert res.status_code == 200
        for s in res.json():
            assert s["on_shift"] is True

    def test_filter_by_department(self, client):
        res = client.get("/staff?department_id=dept-er")
        assert res.status_code == 200
        for s in res.json():
            assert s["department_id"] == "dept-er"

    def test_staff_have_required_fields(self, client):
        res = client.get("/staff")
        for s in res.json():
            assert "id" in s
            assert "name" in s
            assert "role" in s
            assert "on_shift" in s
            assert isinstance(s["on_shift"], bool)


# ── Patients endpoint ────────────────────────────────────────────────

class TestPatientsEndpoint:
    def test_list_patients(self, client):
        res = client.get("/patients")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1

    def test_get_patient_by_id(self, client):
        res = client.get("/patients/test-patient-001")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "John Doe"
        assert data["age"] == 45
        assert data["status"] == "waiting"

    def test_get_patient_not_found(self, client):
        res = client.get("/patients/nonexistent-id")
        assert res.status_code == 404

    def test_filter_patients_by_status(self, client):
        res = client.get("/patients?status=waiting")
        assert res.status_code == 200
        for p in res.json():
            assert p["status"] == "waiting"

    def test_patient_structured_symptoms_parsed(self, client):
        res = client.get("/patients/test-patient-001")
        data = res.json()
        assert data["structured_symptoms"] is not None
        assert isinstance(data["structured_symptoms"], dict)
        assert "chief_complaint" in data["structured_symptoms"]


# ── Patient status update ────────────────────────────────────────────

class TestPatientStatusUpdate:
    def test_update_status_valid(self, client):
        res = client.patch(
            "/patients/test-patient-001/status",
            json={"status": "in_progress"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "in_progress"

        # Verify change persisted
        res2 = client.get("/patients/test-patient-001")
        assert res2.json()["status"] == "in_progress"

    def test_update_status_invalid(self, client):
        res = client.patch(
            "/patients/test-patient-001/status",
            json={"status": "invalid_status"},
        )
        assert res.status_code == 422

    def test_update_status_patient_not_found(self, client):
        res = client.patch(
            "/patients/nonexistent-id/status",
            json={"status": "waiting"},
        )
        assert res.status_code == 404

    def test_update_status_all_transitions(self, client):
        for status in ["routed", "in_progress", "discharged"]:
            res = client.patch(
                "/patients/test-patient-001/status",
                json={"status": status},
            )
            assert res.status_code == 200
            assert res.json()["status"] == status


# ── Routing endpoint ─────────────────────────────────────────────────

class TestRoutingEndpoint:
    def test_get_routing(self, client):
        res = client.get("/routing/test-patient-001")
        assert res.status_code == 200
        data = res.json()
        assert data["patient_id"] == "test-patient-001"
        assert data["recommended_dept_id"] == "dept-er"
        assert data["confidence"] == 0.9
        assert data["confirmed"] is False

    def test_get_routing_not_found(self, client):
        res = client.get("/routing/nonexistent-id")
        assert res.status_code == 404

    def test_routing_department_scores_parsed(self, client):
        res = client.get("/routing/test-patient-001")
        data = res.json()
        assert data["department_scores"] is not None
        assert isinstance(data["department_scores"], list)
        assert len(data["department_scores"]) == 5

    def test_confirm_routing(self, client):
        res = client.post("/route", json={
            "patient_id": "test-patient-001",
            "confirmed": True,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["confirmed"] is True

        # Verify patient status changed to routed
        patient_res = client.get("/patients/test-patient-001")
        assert patient_res.json()["status"] == "routed"

    def test_confirm_routing_with_override(self, client):
        res = client.post("/route", json={
            "patient_id": "test-patient-001",
            "confirmed": True,
            "override_dept_id": "dept-cardio",
            "override_doctor_id": "doc-park",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["override_dept_id"] == "dept-cardio"
        assert data["override_doctor_id"] == "doc-park"

        # Verify patient updated
        patient_res = client.get("/patients/test-patient-001")
        p = patient_res.json()
        assert p["department_id"] == "dept-cardio"
        assert p["assigned_doctor_id"] == "doc-park"

    def test_confirm_routing_not_found(self, client):
        res = client.post("/route", json={
            "patient_id": "nonexistent-id",
            "confirmed": True,
        })
        assert res.status_code == 404


# ── Intake endpoint (mocked AI) ──────────────────────────────────────

class TestIntakeEndpoint:
    MOCK_PIPELINE_RESULT = {
        "structured_symptoms": {
            "chief_complaint": "Severe headache",
            "symptoms": ["Headache", "Nausea"],
            "symptom_duration": "3 hours",
            "severity_indicators": [],
            "relevant_history": "none",
            "vital_concerns": [],
        },
        "ctas_level": 3,
        "ctas_rationale": "Urgent but stable",
        "recommended_department_id": "dept-general",
        "recommended_doctor_id": "doc-santos",
        "ai_reasoning": "General medicine appropriate",
        "confidence": 0.8,
        "clinical_summary": "Patient with moderate headache",
        "department_scores": [
            {"department_id": "dept-general", "score": 0.8, "reasoning": "Best fit"},
            {"department_id": "dept-neuro", "score": 0.5, "reasoning": "Possible neuro"},
        ],
    }

    @patch("routers.intake.run_pipeline")
    def test_intake_success(self, mock_pipeline, client):
        mock_pipeline.return_value = self.MOCK_PIPELINE_RESULT
        res = client.post("/intake", json={
            "name": "Alice Test",
            "gender": "Female",
            "health_number": "BC-9999-999-999",
            "age": 35,
            "raw_symptoms": "Severe headache and nausea for 3 hours",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Alice Test"
        assert data["ctas_level"] == 3
        assert data["department_id"] == "dept-general"
        assert data["status"] == "waiting"
        mock_pipeline.assert_called_once()

    @patch("routers.intake.run_pipeline")
    def test_intake_duplicate_health_number(self, mock_pipeline, client):
        """Patient with same health number as existing non-discharged patient should be rejected."""
        mock_pipeline.return_value = self.MOCK_PIPELINE_RESULT
        res = client.post("/intake", json={
            "name": "Duplicate Person",
            "gender": "Male",
            "health_number": "BC-1111-111-111",  # Same as test-patient-001
            "age": 45,
            "raw_symptoms": "Some symptoms here",
        })
        assert res.status_code == 409
        assert "already in the system" in res.json()["detail"]

    def test_intake_invalid_age_negative(self, client):
        res = client.post("/intake", json={
            "name": "Bad Age",
            "gender": "Male",
            "health_number": "BC-9999-888-777",
            "age": -5,
            "raw_symptoms": "Headache and nausea",
        })
        assert res.status_code == 422

    def test_intake_invalid_age_too_old(self, client):
        res = client.post("/intake", json={
            "name": "Too Old",
            "gender": "Female",
            "health_number": "BC-9999-888-777",
            "age": 200,
            "raw_symptoms": "Headache and nausea",
        })
        assert res.status_code == 422

    def test_intake_invalid_name_numbers(self, client):
        res = client.post("/intake", json={
            "name": "John123",
            "gender": "Male",
            "health_number": "BC-9999-888-777",
            "age": 30,
            "raw_symptoms": "Headache and nausea",
        })
        assert res.status_code == 422

    def test_intake_invalid_gender(self, client):
        res = client.post("/intake", json={
            "name": "Jane Doe",
            "gender": "invalid",
            "health_number": "BC-9999-888-777",
            "age": 30,
            "raw_symptoms": "Headache and nausea",
        })
        assert res.status_code == 422

    def test_intake_empty_symptoms(self, client):
        res = client.post("/intake", json={
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC-9999-888-777",
            "age": 30,
            "raw_symptoms": "",
        })
        assert res.status_code == 422

    def test_intake_short_health_number(self, client):
        res = client.post("/intake", json={
            "name": "Jane Doe",
            "gender": "Female",
            "health_number": "BC",
            "age": 30,
            "raw_symptoms": "Headache",
        })
        assert res.status_code == 422


# ── Routing load tracking ────────────────────────────────────────────

class TestRoutingLoadTracking:
    def test_override_updates_department_loads(self, client):
        """When routing overrides department, old dept load decreases, new dept load increases."""
        # Get initial department loads
        depts_before = {d["id"]: d["current_load"] for d in client.get("/departments").json()}

        # Override from dept-er to dept-cardio
        res = client.post("/route", json={
            "patient_id": "test-patient-001",
            "confirmed": True,
            "override_dept_id": "dept-cardio",
            "override_doctor_id": "doc-park",
        })
        assert res.status_code == 200

        # Check loads changed
        depts_after = {d["id"]: d["current_load"] for d in client.get("/departments").json()}
        assert depts_after["dept-cardio"] == depts_before.get("dept-cardio", 0) + 1
        assert depts_after["dept-er"] == max(0, depts_before.get("dept-er", 0) - 1)

    def test_confirm_same_dept_no_load_change(self, client):
        """Confirming same department shouldn't change loads."""
        depts_before = {d["id"]: d["current_load"] for d in client.get("/departments").json()}

        res = client.post("/route", json={
            "patient_id": "test-patient-001",
            "confirmed": True,
        })
        assert res.status_code == 200

        depts_after = {d["id"]: d["current_load"] for d in client.get("/departments").json()}
        assert depts_after["dept-er"] == depts_before["dept-er"]
