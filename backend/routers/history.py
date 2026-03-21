"""
CRUD routes for all patient sub-records:
  conditions, medications, allergies, lab results, visits, family history.
"""
from fastapi import APIRouter, HTTPException
from database import get_db
from models import (
    ConditionCreate, ConditionOut,
    MedicationCreate, MedicationOut,
    AllergyCreate, AllergyOut,
    LabResultCreate, LabResultOut,
    VisitCreate, VisitOut,
    FamilyHistoryCreate, FamilyHistoryOut,
)

router = APIRouter(prefix="/patients/{patient_id}", tags=["history"])


def _patient_exists(conn, patient_id: str):
    row = conn.execute(
        "SELECT patient_id FROM patients WHERE patient_id = ?", (patient_id,)
    ).fetchone()
    if not row:
        raise HTTPException(404, "Patient not found")


# ── Conditions ────────────────────────────────────────────────────────────────

@router.post("/conditions", response_model=ConditionOut, status_code=201)
def add_condition(patient_id: str, body: ConditionCreate):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        cur = conn.execute(
            """INSERT INTO medical_conditions
               (patient_id, condition_name, icd_code, diagnosed_date, status, severity, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (patient_id, body.condition_name, body.icd_code, body.diagnosed_date,
             body.status, body.severity, body.notes),
        )
        row = conn.execute(
            "SELECT * FROM medical_conditions WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@router.get("/conditions", response_model=list[ConditionOut])
def list_conditions(patient_id: str):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        rows = conn.execute(
            "SELECT * FROM medical_conditions WHERE patient_id = ? ORDER BY diagnosed_date DESC",
            (patient_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.delete("/conditions/{condition_id}", status_code=204)
def delete_condition(patient_id: str, condition_id: int):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        conn.execute(
            "DELETE FROM medical_conditions WHERE id = ? AND patient_id = ?",
            (condition_id, patient_id),
        )


# ── Medications ───────────────────────────────────────────────────────────────

@router.post("/medications", response_model=MedicationOut, status_code=201)
def add_medication(patient_id: str, body: MedicationCreate):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        cur = conn.execute(
            """INSERT INTO medications
               (patient_id, name, dosage, frequency, start_date, end_date, active, prescribing_doctor)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (patient_id, body.name, body.dosage, body.frequency,
             body.start_date, body.end_date, int(body.active), body.prescribing_doctor),
        )
        row = conn.execute(
            "SELECT * FROM medications WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@router.get("/medications", response_model=list[MedicationOut])
def list_medications(patient_id: str, active_only: bool = False):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        query = "SELECT * FROM medications WHERE patient_id = ?"
        params = [patient_id]
        if active_only:
            query += " AND active = 1"
        query += " ORDER BY active DESC, start_date DESC"
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


@router.delete("/medications/{medication_id}", status_code=204)
def delete_medication(patient_id: str, medication_id: int):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        conn.execute(
            "DELETE FROM medications WHERE id = ? AND patient_id = ?",
            (medication_id, patient_id),
        )


# ── Allergies ─────────────────────────────────────────────────────────────────

@router.post("/allergies", response_model=AllergyOut, status_code=201)
def add_allergy(patient_id: str, body: AllergyCreate):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        cur = conn.execute(
            "INSERT INTO allergies (patient_id, allergen, reaction, severity) VALUES (?, ?, ?, ?)",
            (patient_id, body.allergen, body.reaction, body.severity),
        )
        row = conn.execute(
            "SELECT * FROM allergies WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@router.get("/allergies", response_model=list[AllergyOut])
def list_allergies(patient_id: str):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        rows = conn.execute(
            "SELECT * FROM allergies WHERE patient_id = ? ORDER BY severity DESC",
            (patient_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.delete("/allergies/{allergy_id}", status_code=204)
def delete_allergy(patient_id: str, allergy_id: int):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        conn.execute(
            "DELETE FROM allergies WHERE id = ? AND patient_id = ?",
            (allergy_id, patient_id),
        )


# ── Lab Results ───────────────────────────────────────────────────────────────

@router.post("/labs", response_model=LabResultOut, status_code=201)
def add_lab(patient_id: str, body: LabResultCreate):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        cur = conn.execute(
            """INSERT INTO lab_results
               (patient_id, test_name, result, unit, normal_range, test_date, flagged, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (patient_id, body.test_name, body.result, body.unit,
             body.normal_range, body.test_date, int(body.flagged), body.notes),
        )
        row = conn.execute(
            "SELECT * FROM lab_results WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@router.get("/labs", response_model=list[LabResultOut])
def list_labs(patient_id: str, flagged_only: bool = False):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        query = "SELECT * FROM lab_results WHERE patient_id = ?"
        params = [patient_id]
        if flagged_only:
            query += " AND flagged = 1"
        query += " ORDER BY flagged DESC, test_date DESC"
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


@router.delete("/labs/{lab_id}", status_code=204)
def delete_lab(patient_id: str, lab_id: int):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        conn.execute(
            "DELETE FROM lab_results WHERE id = ? AND patient_id = ?",
            (lab_id, patient_id),
        )


# ── Visits ────────────────────────────────────────────────────────────────────

@router.post("/visits", response_model=VisitOut, status_code=201)
def add_visit(patient_id: str, body: VisitCreate):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        cur = conn.execute(
            """INSERT INTO visits
               (patient_id, visit_date, chief_complaint, diagnosis,
                department, doctor_name, notes, discharge_summary)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (patient_id, body.visit_date, body.chief_complaint, body.diagnosis,
             body.department, body.doctor_name, body.notes, body.discharge_summary),
        )
        row = conn.execute(
            "SELECT * FROM visits WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@router.get("/visits", response_model=list[VisitOut])
def list_visits(patient_id: str):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        rows = conn.execute(
            "SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC",
            (patient_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.delete("/visits/{visit_id}", status_code=204)
def delete_visit(patient_id: str, visit_id: int):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        conn.execute(
            "DELETE FROM visits WHERE id = ? AND patient_id = ?",
            (visit_id, patient_id),
        )


# ── Family History ────────────────────────────────────────────────────────────

@router.post("/family-history", response_model=FamilyHistoryOut, status_code=201)
def add_family_history(patient_id: str, body: FamilyHistoryCreate):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        cur = conn.execute(
            "INSERT INTO family_history (patient_id, relation, condition, notes) VALUES (?, ?, ?, ?)",
            (patient_id, body.relation, body.condition, body.notes),
        )
        row = conn.execute(
            "SELECT * FROM family_history WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@router.get("/family-history", response_model=list[FamilyHistoryOut])
def list_family_history(patient_id: str):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        rows = conn.execute(
            "SELECT * FROM family_history WHERE patient_id = ? ORDER BY relation",
            (patient_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.delete("/family-history/{entry_id}", status_code=204)
def delete_family_history(patient_id: str, entry_id: int):
    with get_db() as conn:
        _patient_exists(conn, patient_id)
        conn.execute(
            "DELETE FROM family_history WHERE id = ? AND patient_id = ?",
            (entry_id, patient_id),
        )
