"""
Shared test fixtures for the TriageAcceleration backend tests.
Uses a fresh in-memory SQLite database for each test to ensure isolation.
"""
import sys
import os
import json
import pytest
from unittest.mock import patch

# Ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import database
from database import init_db, get_db


@pytest.fixture(autouse=True)
def use_test_db(tmp_path):
    """Use a temporary database file for every test."""
    test_db = str(tmp_path / "test_triage.db")
    with patch.object(database, "DB_PATH", test_db):
        init_db()
        _seed_test_data(test_db)
        yield test_db


def _seed_test_data(db_path):
    """Insert minimal seed data needed by tests."""
    import sqlite3
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Departments
    departments = [
        ("dept-er", "Emergency", 20, 0),
        ("dept-cardio", "Cardiology", 8, 0),
        ("dept-neuro", "Neurology", 6, 0),
        ("dept-general", "General Medicine", 10, 0),
        ("dept-peds", "Pediatrics", 8, 0),
    ]
    conn.executemany(
        "INSERT INTO departments (id, name, capacity, current_load) VALUES (?, ?, ?, ?)",
        departments,
    )

    # Staff
    staff = [
        ("doc-chen", "Dr. Sarah Chen", "doctor", "dept-er", "Emergency Medicine", 1, 0),
        ("doc-park", "Dr. James Park", "doctor", "dept-cardio", "Interventional Cardiology", 1, 0),
        ("doc-santos", "Dr. Maria Santos", "doctor", "dept-general", "Internal Medicine", 1, 0),
        ("nurse-brown", "Nurse Michael Brown", "nurse", "dept-er", "Trauma", 1, 0),
    ]
    conn.executemany(
        "INSERT INTO staff (id, name, role, department_id, specialization, on_shift, current_patient_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
        staff,
    )

    # A test patient
    structured = json.dumps({
        "chief_complaint": "Chest pain",
        "symptoms": ["Chest pain", "Shortness of breath"],
        "symptom_duration": "2 hours",
        "severity_indicators": ["severe"],
        "relevant_history": "none",
        "vital_concerns": [],
    })
    conn.execute(
        """INSERT INTO patients
           (id, name, gender, health_number, age, raw_symptoms,
            structured_symptoms, ctas_level, ai_summary,
            department_id, assigned_doctor_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
        (
            "test-patient-001", "John Doe", "Male", "BC-1111-111-111", 45,
            "Chest pain and shortness of breath", structured, 2,
            "Test patient summary", "dept-er", "doc-chen", "waiting",
        ),
    )

    # Routing decision for the test patient
    dept_scores = json.dumps([
        {"department_id": "dept-er", "score": 0.9, "reasoning": "Emergency case"},
        {"department_id": "dept-cardio", "score": 0.7, "reasoning": "Cardiac symptoms"},
        {"department_id": "dept-neuro", "score": 0.1, "reasoning": "Not neuro"},
        {"department_id": "dept-general", "score": 0.3, "reasoning": "Could be general"},
        {"department_id": "dept-peds", "score": 0.0, "reasoning": "Not pediatric"},
    ])
    conn.execute(
        """INSERT INTO routing_decisions
           (id, patient_id, recommended_dept_id, recommended_doctor_id,
            ai_reasoning, confidence, department_scores, confirmed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            "route-001", "test-patient-001", "dept-er", "doc-chen",
            "Emergency presentation", 0.9, dept_scores, 0,
        ),
    )

    conn.commit()
    conn.close()


@pytest.fixture
def client(use_test_db):
    """Create a FastAPI test client using the test database."""
    from starlette.testclient import TestClient
    from main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
