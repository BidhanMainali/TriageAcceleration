import uuid
import json
from fastapi import APIRouter, HTTPException
from models import PatientIn, PatientOut, FollowUpOut
from database import get_db
from ai.pipeline import run_pipeline
from ai.followup import generate_followup

router = APIRouter()


@router.post("/intake", response_model=PatientOut)
def intake(patient_in: PatientIn):
    """
    Accept patient symptom submission, run AI pipeline,
    and return the triaged patient record.
    """
    patient_id = str(uuid.uuid4())
    db = get_db()
    try:
        departments = [dict(r) for r in db.execute("SELECT * FROM departments").fetchall()]
        doctors = [
            dict(r) for r in db.execute(
                "SELECT * FROM staff WHERE on_shift = 1 AND role = 'doctor'"
            ).fetchall()
        ]

        if not departments:
            raise HTTPException(
                status_code=503,
                detail="No departments available. Run seed.py first.",
            )

        result = run_pipeline(
            patient=patient_in.model_dump(),
            departments=departments,
            doctors=doctors,
        )

        structured_json = json.dumps(result["structured_symptoms"])
        ctas = int(result.get("ctas_level", 5))
        dept_id = result.get("recommended_department_id")
        doctor_id = result.get("recommended_doctor_id")
        summary = result.get("clinical_summary", "")

        db.execute(
            """
            INSERT INTO patients
              (id, name, gender, health_number, age, raw_symptoms,
               structured_symptoms, ctas_level, ai_summary,
               department_id, assigned_doctor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id, patient_in.name, patient_in.gender,
                patient_in.health_number, patient_in.age,
                patient_in.raw_symptoms, structured_json,
                ctas, summary, dept_id, doctor_id,
            ),
        )

        dept_scores_json = json.dumps(result.get("department_scores", []))

        routing_id = str(uuid.uuid4())
        db.execute(
            """
            INSERT INTO routing_decisions
              (id, patient_id, recommended_dept_id, recommended_doctor_id,
               ai_reasoning, confidence, department_scores)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                routing_id, patient_id, dept_id, doctor_id,
                result.get("ai_reasoning", ""),
                float(result.get("confidence", 0.0)),
                dept_scores_json,
            ),
        )

        if dept_id:
            db.execute(
                "UPDATE departments SET current_load = current_load + 1 WHERE id = ?",
                (dept_id,),
            )
        if doctor_id:
            db.execute(
                "UPDATE staff SET current_patient_count = current_patient_count + 1 WHERE id = ?",
                (doctor_id,),
            )

        db.commit()

        row = dict(db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone())
        if row.get("structured_symptoms"):
            row["structured_symptoms"] = json.loads(row["structured_symptoms"])
        return row

    finally:
        db.close()


@router.post("/followup", response_model=FollowUpOut)
def followup(patient_id: str):
    """
    Generate clarifying follow-up questions for a patient
    based on their already-extracted structured symptoms.
    """
    db = get_db()
    try:
        row = db.execute(
            "SELECT structured_symptoms FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Patient not found")

        structured = json.loads(row["structured_symptoms"] or "{}")
        questions = generate_followup(structured)
        return {"questions": questions}
    finally:
        db.close()
