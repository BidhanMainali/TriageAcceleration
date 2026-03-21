import json
from fastapi import APIRouter, HTTPException
from database import get_db
from models import PatientOut, QueuePatient, FullPatient

router = APIRouter(tags=["patients"])

URGENCY_TO_SEVERITY = {
    "critical": "Critical",
    "high": "Urgent",
    "medium": "Semi-Urgent",
    "low": "Non-Urgent",
}


def _parse_symptoms(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return [s.strip() for s in raw.split(",") if s.strip()]


def _parse_specialist(raw: str | None) -> str:
    if not raw:
        return "General Medicine"
    try:
        recs = json.loads(raw)
        if isinstance(recs, list) and recs:
            return recs[0].get("specialty", "General Medicine")
    except Exception:
        pass
    return str(raw)


# ── GET /patients ─────────────────────────────────────────────────────────────

@router.get("/patients", response_model=list[PatientOut])
def list_patients(search: str = ""):
    with get_db() as conn:
        if search:
            pattern = f"%{search}%"
            rows = conn.execute(
                "SELECT * FROM patients WHERE full_name LIKE ? OR health_number LIKE ? ORDER BY full_name",
                (pattern, pattern),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM patients ORDER BY full_name").fetchall()
    return [dict(r) for r in rows]


# ── GET /patients/{id} ────────────────────────────────────────────────────────

@router.get("/patients/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
        ).fetchone()
    if not row:
        raise HTTPException(404, "Patient not found")
    return dict(row)


# ── GET /queue — enriched list for doctor queue view ──────────────────────────

@router.get("/queue", response_model=list[QueuePatient])
def get_queue():
    with get_db() as conn:
        patients = conn.execute("SELECT * FROM patients").fetchall()
        result = []
        for p in patients:
            pid = p["patient_id"]

            # Latest visit
            visit = conn.execute(
                "SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC LIMIT 1",
                (pid,),
            ).fetchone()

            # Latest analysis
            analysis = conn.execute(
                "SELECT * FROM analysis_results WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1",
                (pid,),
            ).fetchone()

            urgency = (analysis["urgency_level"] if analysis else "medium") or "medium"
            specialist = _parse_specialist(analysis["specialist_recommendation"] if analysis else None)

            result.append(QueuePatient(
                patient_id=pid,
                full_name=p["full_name"],
                gender=p["gender"],
                health_number=p["health_number"],
                age=p["age"],
                blood_type=p["blood_type"],
                chief_complaint=visit["chief_complaint"] if visit else None,
                symptoms=_parse_symptoms(visit["symptoms"] if visit else None),
                arrival_time=visit["visit_date"] if visit else p["created_at"],
                triage_severity=URGENCY_TO_SEVERITY.get(urgency, "Semi-Urgent"),
                assigned_department=visit["department"] if visit else None,
                assigned_doctor=visit["doctor_name"] if visit else None,
                status=visit["status"] if visit else "Waiting",
                ai_summary=analysis["summary"] if analysis else "",
                recommended_specialist=specialist,
            ))

        # Sort: critical → urgent → semi-urgent → low, then by arrival time
        order = {"Critical": 0, "Urgent": 1, "Semi-Urgent": 2, "Non-Urgent": 3}
        result.sort(key=lambda p: (order.get(p.triage_severity, 4), p.arrival_time or ""))
    return result


# ── GET /patients/{id}/full — detailed view for PatientDetails page ────────────

@router.get("/patients/{patient_id}/full", response_model=FullPatient)
def get_patient_full(patient_id: str):
    with get_db() as conn:
        p = conn.execute(
            "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
        ).fetchone()
        if not p:
            raise HTTPException(404, "Patient not found")

        visit = conn.execute(
            "SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC LIMIT 1",
            (patient_id,),
        ).fetchone()

        analysis = conn.execute(
            "SELECT * FROM analysis_results WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1",
            (patient_id,),
        ).fetchone()

        allergies = conn.execute(
            "SELECT allergen FROM allergies WHERE patient_id = ?", (patient_id,)
        ).fetchall()

        medications = conn.execute(
            "SELECT name, dosage FROM medications WHERE patient_id = ? AND active = 1",
            (patient_id,),
        ).fetchall()

        conditions = conn.execute(
            "SELECT condition_name, diagnosed_date, status, notes FROM medical_conditions WHERE patient_id = ? ORDER BY diagnosed_date DESC",
            (patient_id,),
        ).fetchall()

        past_visits = conn.execute(
            "SELECT visit_date, chief_complaint, diagnosis, doctor_name, notes FROM visits WHERE patient_id = ? ORDER BY visit_date DESC",
            (patient_id,),
        ).fetchall()

    urgency = (analysis["urgency_level"] if analysis else "medium") or "medium"
    specialist = _parse_specialist(analysis["specialist_recommendation"] if analysis else None)

    # Build medical_history combining conditions + past visits
    medical_history = []
    for c in conditions:
        medical_history.append({
            "date": c["diagnosed_date"] or "",
            "condition": c["condition_name"],
            "treatment": "",
            "doctor": "",
            "notes": c["notes"] or "",
        })
    for v in past_visits:
        if v["diagnosis"]:
            medical_history.append({
                "date": v["visit_date"] or "",
                "condition": v["diagnosis"],
                "treatment": v["chief_complaint"] or "",
                "doctor": v["doctor_name"] or "",
                "notes": v["notes"] or "",
            })

    med_strings = []
    for m in medications:
        label = m["name"]
        if m["dosage"]:
            label += f" {m['dosage']}"
        med_strings.append(label)

    return FullPatient(
        patient_id=p["patient_id"],
        full_name=p["full_name"],
        gender=p["gender"],
        health_number=p["health_number"],
        age=p["age"],
        date_of_birth=p["date_of_birth"],
        blood_type=p["blood_type"],
        contact_phone=p["contact_phone"],
        chief_complaint=visit["chief_complaint"] if visit else None,
        symptoms=_parse_symptoms(visit["symptoms"] if visit else None),
        arrival_time=visit["visit_date"] if visit else p["created_at"],
        triage_severity=URGENCY_TO_SEVERITY.get(urgency, "Semi-Urgent"),
        assigned_department=visit["department"] if visit else None,
        assigned_doctor=visit["doctor_name"] if visit else None,
        status=visit["status"] if visit else "Waiting",
        ai_summary=analysis["summary"] if analysis else "",
        recommended_specialist=specialist,
        allergies=[a["allergen"] for a in allergies],
        current_medications=med_strings,
        medical_history=medical_history,
        vital_signs=None,
    )
