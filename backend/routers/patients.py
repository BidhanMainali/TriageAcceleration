import json
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import PatientOut
from database import get_db

router = APIRouter()


def _parse_patient(row) -> dict:
    p = dict(row)
    if p.get("structured_symptoms"):
        p["structured_symptoms"] = json.loads(p["structured_symptoms"])
    return p


@router.get("/patients", response_model=List[PatientOut])
def list_patients(status: Optional[str] = None):
    """
    Return all patients sorted by CTAS level (most urgent first),
    then by arrival time. Optionally filter by status.
    """
    db = get_db()
    try:
        if status:
            rows = db.execute(
                "SELECT * FROM patients WHERE status = ? ORDER BY ctas_level ASC, created_at ASC",
                (status,),
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM patients ORDER BY ctas_level ASC, created_at ASC"
            ).fetchall()
        return [_parse_patient(r) for r in rows]
    finally:
        db.close()


@router.get("/patients/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str):
    db = get_db()
    try:
        row = db.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Patient not found")
        return _parse_patient(row)
    finally:
        db.close()


@router.patch("/patients/{patient_id}/status")
def update_status(patient_id: str, status: str):
    """Update patient status: waiting | routed | in_progress | discharged"""
    valid = {"waiting", "routed", "in_progress", "discharged"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    db = get_db()
    try:
        result = db.execute(
            "UPDATE patients SET status = ? WHERE id = ?", (status, patient_id)
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        db.commit()
        return {"patient_id": patient_id, "status": status}
    finally:
        db.close()
