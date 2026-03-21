"""
Run this once to populate the database with synthetic departments, staff, and demo patients.
Usage: python -m data.seed   (from the backend/ directory)
"""
import sys
import os
import json

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


DEMO_PATIENTS = [
    {
        "id": "demo-patient-001",
        "name": "Robert Anderson",
        "gender": "Male",
        "health_number": "BC-9876-543-210",
        "age": 68,
        "raw_symptoms": "Severe chest pain and shortness of breath. Symptoms: Chest pain, Shortness of breath, Sweating, Dizziness.",
        "structured_symptoms": json.dumps({
            "chief_complaint": "Severe chest pain and shortness of breath",
            "symptoms": ["Chest pain", "Shortness of breath", "Sweating", "Dizziness"],
            "symptom_duration": "unknown",
            "severity_indicators": ["severe"],
            "relevant_history": "Previous MI, Hypertension, Type 2 Diabetes. Medications: Lisinopril, Metformin, Aspirin.",
            "vital_concerns": ["possible acute coronary syndrome"],
        }),
        "ctas_level": 1,
        "ai_summary": "Patient presents with cardiac symptoms consistent with possible acute coronary syndrome. History of previous MI and current medications suggest cardiovascular risk. Immediate cardiology consultation recommended.",
        "department_id": "dept-cardio",
        "assigned_doctor_id": "doc-park",
        "status": "in_progress",
        "created_at": "2026-03-21 08:15:00",
    },
    {
        "id": "demo-patient-002",
        "name": "Jennifer Thompson",
        "gender": "Female",
        "health_number": "BC-8765-432-109",
        "age": 34,
        "raw_symptoms": "Severe wrist pain after fall. Symptoms: Wrist pain, Swelling, Limited mobility. Allergies: Latex.",
        "structured_symptoms": json.dumps({
            "chief_complaint": "Severe wrist pain after fall",
            "symptoms": ["Wrist pain", "Swelling", "Limited mobility"],
            "symptom_duration": "acute",
            "severity_indicators": ["severe"],
            "relevant_history": "Allergies: Latex.",
            "vital_concerns": ["possible fracture"],
        }),
        "ctas_level": 4,
        "ai_summary": "Patient with acute wrist injury following fall. Possible fracture requiring X-ray imaging. Orthopedic assessment recommended.",
        "department_id": "dept-ortho",
        "assigned_doctor_id": "doc-williams",
        "status": "waiting",
        "created_at": "2026-03-21 09:30:00",
    },
    {
        "id": "demo-patient-003",
        "name": "Marcus Williams",
        "gender": "Male",
        "health_number": "BC-7654-321-098",
        "age": 52,
        "raw_symptoms": "Persistent cough and difficulty breathing. Symptoms: Cough with mucus, Difficulty breathing, Fever, Fatigue, Chest tightness.",
        "structured_symptoms": json.dumps({
            "chief_complaint": "Persistent cough and difficulty breathing",
            "symptoms": ["Cough with mucus", "Difficulty breathing", "Fever", "Fatigue", "Chest tightness"],
            "symptom_duration": "persistent",
            "severity_indicators": ["fever", "difficulty breathing"],
            "relevant_history": "Previous pneumonia in 2020.",
            "vital_concerns": ["respiratory distress", "low oxygen saturation"],
        }),
        "ctas_level": 2,
        "ai_summary": "Patient showing respiratory distress with fever and productive cough. History of previous pneumonia. Chest X-ray and pulmonology consultation recommended to rule out infection or exacerbation.",
        "department_id": "dept-resp",
        "assigned_doctor_id": "doc-thompson",
        "status": "in_progress",
        "created_at": "2026-03-21 07:45:00",
    },
    {
        "id": "demo-patient-004",
        "name": "Sophia Martinez",
        "gender": "Female",
        "health_number": "BC-6543-210-987",
        "age": 28,
        "raw_symptoms": "Severe abdominal pain. Symptoms: Lower right abdominal pain, Nausea, Vomiting, Loss of appetite. Allergies: Sulfa drugs. Current medications: Levothyroxine 50mcg.",
        "structured_symptoms": json.dumps({
            "chief_complaint": "Severe abdominal pain",
            "symptoms": ["Lower right abdominal pain", "Nausea", "Vomiting", "Loss of appetite"],
            "symptom_duration": "acute",
            "severity_indicators": ["severe", "fever"],
            "relevant_history": "Hypothyroidism on Levothyroxine. Allergies: Sulfa drugs.",
            "vital_concerns": ["possible appendicitis"],
        }),
        "ctas_level": 2,
        "ai_summary": "Patient presenting with classic appendicitis symptoms. Immediate surgical consultation recommended. Imaging studies needed to confirm diagnosis.",
        "department_id": "dept-er",
        "assigned_doctor_id": "doc-chen",
        "status": "waiting",
        "created_at": "2026-03-21 10:20:00",
    },
    {
        "id": "demo-patient-005",
        "name": "David Lee",
        "gender": "Male",
        "health_number": "BC-5432-109-876",
        "age": 45,
        "raw_symptoms": "Laceration on left arm from accident. Symptoms: Deep cut on arm, Bleeding. Allergies: Codeine. Current medications: Atorvastatin 20mg.",
        "structured_symptoms": json.dumps({
            "chief_complaint": "Laceration on left arm from accident",
            "symptoms": ["Deep cut on arm", "Bleeding"],
            "symptom_duration": "acute",
            "severity_indicators": ["bleeding"],
            "relevant_history": "High cholesterol on Atorvastatin. Allergies: Codeine.",
            "vital_concerns": [],
        }),
        "ctas_level": 4,
        "ai_summary": "Patient with traumatic laceration requiring suturing. Tetanus status should be verified. Wound cleaning and closure needed.",
        "department_id": "dept-er",
        "assigned_doctor_id": "doc-nguyen",
        "status": "waiting",
        "created_at": "2026-03-21 11:05:00",
    },
    {
        "id": "demo-patient-006",
        "name": "Emma Brown",
        "gender": "Female",
        "health_number": "BC-4321-098-765",
        "age": 71,
        "raw_symptoms": "Dizziness and irregular heartbeat. Symptoms: Dizziness, Palpitations, Weakness, Confusion. Allergies: Aspirin, NSAIDs. Current medications: Warfarin 5mg, Amlodipine 5mg, Furosemide 20mg.",
        "structured_symptoms": json.dumps({
            "chief_complaint": "Dizziness and irregular heartbeat",
            "symptoms": ["Dizziness", "Palpitations", "Weakness", "Confusion"],
            "symptom_duration": "acute",
            "severity_indicators": ["rapid heartbeat", "confusion"],
            "relevant_history": "Known AFib, Congestive Heart Failure, Hip Replacement. On anticoagulation. Allergies: Aspirin, NSAIDs.",
            "vital_concerns": ["rapid ventricular response", "hemodynamic instability"],
        }),
        "ctas_level": 2,
        "ai_summary": "Elderly patient with known AFib presenting with rapid ventricular response. On anticoagulation therapy. ECG and electrolyte panel needed. Cardiology assessment for rate control required.",
        "department_id": "dept-cardio",
        "assigned_doctor_id": "doc-park",
        "status": "waiting",
        "created_at": "2026-03-21 08:50:00",
    },
]


def seed():
    init_db()
    db = get_db()

    # Clear existing seed data
    db.execute("DELETE FROM staff")
    db.execute("DELETE FROM departments")
    db.execute("DELETE FROM patients WHERE id LIKE 'demo-patient-%'")
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

    for p in DEMO_PATIENTS:
        db.execute(
            """
            INSERT OR IGNORE INTO patients
              (id, name, gender, health_number, age, raw_symptoms,
               structured_symptoms, ctas_level, ai_summary,
               department_id, assigned_doctor_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                p["id"], p["name"], p["gender"], p["health_number"], p["age"],
                p["raw_symptoms"], p["structured_symptoms"], p["ctas_level"],
                p["ai_summary"], p["department_id"], p["assigned_doctor_id"],
                p["status"], p["created_at"],
            ),
        )

    db.commit()
    db.close()

    print(f"Seeded {len(DEPARTMENTS)} departments, {len(STAFF)} staff members, and {len(DEMO_PATIENTS)} demo patients.")


if __name__ == "__main__":
    seed()
