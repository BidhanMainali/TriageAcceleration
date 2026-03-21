"""
POST /intake — patient check-in endpoint.
Receives the check-in form, creates patient + sub-records, triggers AI analysis.
"""
import json
import uuid
from datetime import date, datetime
from fastapi import APIRouter, HTTPException
from database import get_db
from models import IntakeRequest, IntakeResponse
from ai_service import analyze_patient_history

router = APIRouter(tags=["intake"])

URGENCY_TO_SEVERITY = {
    "critical": "Critical",
    "high": "Urgent",
    "medium": "Semi-Urgent",
    "low": "Non-Urgent",
}


def _calc_age(dob_str: str) -> int:
    try:
        dob = date.fromisoformat(dob_str)
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return 0


def _parse_specialist(recs: list) -> str:
    if recs and isinstance(recs, list):
        return recs[0].get("specialty", "General Medicine")
    return "General Medicine"


@router.post("/intake", response_model=IntakeResponse, status_code=201)
async def intake(body: IntakeRequest):
    patient_id = f"P{datetime.now().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:4].upper()}"
    age = _calc_age(body.date_of_birth)

    # ── 1. Persist patient ────────────────────────────────────────────────────
    with get_db() as conn:
        existing = conn.execute(
            "SELECT patient_id FROM patients WHERE health_number = ?",
            (body.health_number,),
        ).fetchone()

        if existing:
            # Returning patient — reuse their ID
            patient_id = existing["patient_id"]
        else:
            conn.execute(
                """INSERT INTO patients
                   (patient_id, full_name, gender, health_number, age, date_of_birth,
                    blood_type, contact_phone)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (patient_id, body.full_name, body.gender, body.health_number,
                 age, body.date_of_birth, body.blood_type, body.contact_phone),
            )

        # ── 2. Allergies ──────────────────────────────────────────────────────
        if body.allergies:
            for allergen in [a.strip() for a in body.allergies.split(",") if a.strip()]:
                exists = conn.execute(
                    "SELECT id FROM allergies WHERE patient_id = ? AND allergen = ?",
                    (patient_id, allergen),
                ).fetchone()
                if not exists:
                    conn.execute(
                        "INSERT INTO allergies (patient_id, allergen) VALUES (?, ?)",
                        (patient_id, allergen),
                    )

        # ── 3. Medications ────────────────────────────────────────────────────
        if body.current_medications:
            for med in [m.strip() for m in body.current_medications.replace("\n", ",").split(",") if m.strip()]:
                exists = conn.execute(
                    "SELECT id FROM medications WHERE patient_id = ? AND name = ? AND active = 1",
                    (patient_id, med),
                ).fetchone()
                if not exists:
                    conn.execute(
                        "INSERT INTO medications (patient_id, name, active) VALUES (?, ?, 1)",
                        (patient_id, med),
                    )

        # ── 4. Visit record ───────────────────────────────────────────────────
        symptom_text = body.chief_complaint
        if body.symptom_details:
            symptom_text += f". Additional details: {body.symptom_details}"

        conn.execute(
            """INSERT INTO visits
               (patient_id, visit_date, chief_complaint, symptoms, status)
               VALUES (?, datetime('now'), ?, ?, 'Waiting')""",
            (patient_id, symptom_text, json.dumps(body.symptoms)),
        )

        # ── 5. Pull history for AI ────────────────────────────────────────────
        patient_row = dict(conn.execute(
            "SELECT * FROM patients WHERE patient_id = ?", (patient_id,)
        ).fetchone())

        history = {
            "conditions": [dict(r) for r in conn.execute(
                "SELECT * FROM medical_conditions WHERE patient_id = ?", (patient_id,)
            ).fetchall()],
            "medications": [dict(r) for r in conn.execute(
                "SELECT * FROM medications WHERE patient_id = ?", (patient_id,)
            ).fetchall()],
            "allergies": [dict(r) for r in conn.execute(
                "SELECT * FROM allergies WHERE patient_id = ?", (patient_id,)
            ).fetchall()],
            "labs": [],
            "visits": [],
            "family_history": [],
        }

    # ── 6. AI analysis ────────────────────────────────────────────────────────
    full_complaint = body.chief_complaint
    if body.symptoms:
        full_complaint += f". Symptoms: {', '.join(body.symptoms)}"
    if body.symptom_details:
        full_complaint += f". {body.symptom_details}"

    try:
        result = await analyze_patient_history(patient_row, history, full_complaint)
    except Exception as e:
        # Don't fail check-in if AI is unavailable
        result = {
            "urgency_level": "medium",
            "summary": "AI analysis unavailable. Manual triage required.",
            "specialist_recommendation": [],
            "risk_factors": [],
            "relevant_history_summary": "",
            "reasoning": str(e),
        }

    # ── 7. Persist analysis ───────────────────────────────────────────────────
    with get_db() as conn:
        conn.execute(
            """INSERT INTO analysis_results
               (patient_id, current_complaint, relevant_history_summary,
                risk_factors, specialist_recommendation, urgency_level, summary, reasoning)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                patient_id,
                full_complaint,
                result.get("relevant_history_summary", ""),
                json.dumps(result.get("risk_factors", [])),
                json.dumps(result.get("specialist_recommendation", [])),
                result.get("urgency_level", "medium"),
                result.get("summary", ""),
                result.get("reasoning", ""),
            ),
        )

    urgency = result.get("urgency_level", "medium")
    specialist = _parse_specialist(result.get("specialist_recommendation", []))

    return IntakeResponse(
        patient_id=patient_id,
        urgency_level=urgency,
        triage_severity=URGENCY_TO_SEVERITY.get(urgency, "Semi-Urgent"),
        ai_summary=result.get("summary", ""),
        recommended_specialist=specialist,
    )
