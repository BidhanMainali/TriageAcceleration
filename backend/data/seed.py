"""
Run this once to populate the database with synthetic departments and staff.
Usage: python -m data.seed   (from the backend/ directory)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import get_db, init_db

DEPARTMENTS = [
    {"id": "dept-er", "name": "Emergency", "capacity": 20, "current_load": 0},
    {"id": "dept-cardio", "name": "Cardiology", "capacity": 8, "current_load": 0},
    {"id": "dept-radiology", "name": "Radiology", "capacity": 6, "current_load": 0},
    {"id": "dept-resp", "name": "Respiratory / Pulmonology", "capacity": 8, "current_load": 0},
    {"id": "dept-neuro", "name": "Neurology", "capacity": 6, "current_load": 0},
    {"id": "dept-ortho", "name": "Orthopedics", "capacity": 8, "current_load": 0},
    {"id": "dept-general", "name": "General Medicine", "capacity": 10, "current_load": 0},
    {"id": "dept-peds", "name": "Pediatrics", "capacity": 8, "current_load": 0},
]

STAFF = [
    # Doctors
    {
        "id": "doc-chen",
        "name": "Dr. Sarah Chen",
        "role": "doctor",
        "department_id": "dept-er",
        "specialization": "Emergency Medicine",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-park",
        "name": "Dr. James Park",
        "role": "doctor",
        "department_id": "dept-cardio",
        "specialization": "Interventional Cardiology",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-mohammed",
        "name": "Dr. Aisha Mohammed",
        "role": "doctor",
        "department_id": "dept-neuro",
        "specialization": "Stroke Neurology",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-williams",
        "name": "Dr. Robert Williams",
        "role": "doctor",
        "department_id": "dept-ortho",
        "specialization": "Trauma Orthopedics",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-santos",
        "name": "Dr. Maria Santos",
        "role": "doctor",
        "department_id": "dept-general",
        "specialization": "Internal Medicine",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-kim",
        "name": "Dr. Lisa Kim",
        "role": "doctor",
        "department_id": "dept-peds",
        "specialization": "Pediatric Emergency Medicine",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-thompson",
        "name": "Dr. David Thompson",
        "role": "doctor",
        "department_id": "dept-resp",
        "specialization": "Pulmonology & Critical Care",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-patel",
        "name": "Dr. Priya Patel",
        "role": "doctor",
        "department_id": "dept-radiology",
        "specialization": "Diagnostic Imaging",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "doc-nguyen",
        "name": "Dr. Kevin Nguyen",
        "role": "doctor",
        "department_id": "dept-er",
        "specialization": "Emergency Medicine",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    # Nurses
    {
        "id": "nurse-brown",
        "name": "Nurse Michael Brown",
        "role": "nurse",
        "department_id": "dept-er",
        "specialization": "Trauma & Emergency",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "nurse-johnson",
        "name": "Nurse Emma Johnson",
        "role": "nurse",
        "department_id": "dept-er",
        "specialization": "Triage",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "nurse-davis",
        "name": "Nurse Rachel Davis",
        "role": "nurse",
        "department_id": "dept-cardio",
        "specialization": "Cardiac Care",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "nurse-wilson",
        "name": "Nurse Tom Wilson",
        "role": "nurse",
        "department_id": "dept-neuro",
        "specialization": "Neurology",
        "on_shift": 1,
        "current_patient_count": 0,
    },
    {
        "id": "nurse-garcia",
        "name": "Nurse Sofia Garcia",
        "role": "nurse",
        "department_id": "dept-peds",
        "specialization": "Pediatric Care",
        "on_shift": 1,
        "current_patient_count": 0,
    },
]


def seed():
    init_db()
    db = get_db()

    # Clear existing seed data
    db.execute("DELETE FROM staff")
    db.execute("DELETE FROM departments")
    db.commit()

    for dept in DEPARTMENTS:
        db.execute(
            "INSERT INTO departments (id, name, capacity, current_load) VALUES (?, ?, ?, ?)",
            (dept["id"], dept["name"], dept["capacity"], dept["current_load"]),
        )

    for s in STAFF:
        db.execute(
            """
            INSERT INTO staff (id, name, role, department_id, specialization, on_shift, current_patient_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                s["id"], s["name"], s["role"], s["department_id"],
                s["specialization"], s["on_shift"], s["current_patient_count"],
            ),
        )

    db.commit()
    db.close()

    print(f"Seeded {len(DEPARTMENTS)} departments and {len(STAFF)} staff members.")


if __name__ == "__main__":
    seed()
