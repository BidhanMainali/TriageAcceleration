import uuid
import json
from fastapi import APIRouter, HTTPException
from models import RouteConfirmIn, RoutingDecisionOut
from database import get_db


def _parse_routing_row(row) -> dict:
    """Convert a routing_decisions DB row to a dict with parsed fields."""
    r = dict(row)
    r["confirmed"] = bool(r["confirmed"])
    if r.get("department_scores"):
        r["department_scores"] = json.loads(r["department_scores"])
    return r

router = APIRouter()


@router.get("/routing/{patient_id}", response_model=RoutingDecisionOut)
def get_routing(patient_id: str):
    """Get the latest routing decision for a patient."""
    db = get_db()
    try:
        row = db.execute(
            """
            SELECT * FROM routing_decisions
            WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (patient_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No routing decision found")
        return _parse_routing_row(row)
    finally:
        db.close()


@router.post("/route", response_model=RoutingDecisionOut)
def confirm_route(route_in: RouteConfirmIn):
    """
    Confirm or override the AI routing recommendation.
    Triage staff can override the department or doctor assignment.
    """
    db = get_db()
    try:
        row = db.execute(
            """
            SELECT * FROM routing_decisions
            WHERE patient_id = ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (route_in.patient_id,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="No routing decision found for this patient",
            )

        routing = dict(row)
        final_dept = route_in.override_dept_id or routing["recommended_dept_id"]
        final_doctor = route_in.override_doctor_id or routing["recommended_doctor_id"]

        # Get current patient assignment to adjust loads
        patient_row = db.execute(
            "SELECT department_id, assigned_doctor_id FROM patients WHERE id = ?",
            (route_in.patient_id,),
        ).fetchone()
        current_dept = patient_row["department_id"] if patient_row else None
        current_doctor = patient_row["assigned_doctor_id"] if patient_row else None

        db.execute(
            """
            UPDATE routing_decisions
            SET confirmed = ?, override_dept_id = ?, override_doctor_id = ?
            WHERE id = ?
            """,
            (
                1 if route_in.confirmed else 0,
                route_in.override_dept_id,
                route_in.override_doctor_id,
                routing["id"],
            ),
        )

        # Update department loads when department changes
        if final_dept != current_dept:
            if current_dept:
                db.execute(
                    "UPDATE departments SET current_load = MAX(0, current_load - 1) WHERE id = ?",
                    (current_dept,),
                )
            if final_dept:
                db.execute(
                    "UPDATE departments SET current_load = current_load + 1 WHERE id = ?",
                    (final_dept,),
                )

        # Update doctor patient counts when doctor changes
        if final_doctor != current_doctor:
            if current_doctor:
                db.execute(
                    "UPDATE staff SET current_patient_count = MAX(0, current_patient_count - 1) WHERE id = ?",
                    (current_doctor,),
                )
            if final_doctor:
                db.execute(
                    "UPDATE staff SET current_patient_count = current_patient_count + 1 WHERE id = ?",
                    (final_doctor,),
                )

        db.execute(
            """
            UPDATE patients
            SET department_id = ?, assigned_doctor_id = ?, status = 'routed'
            WHERE id = ?
            """,
            (final_dept, final_doctor, route_in.patient_id),
        )

        db.commit()

        updated_row = db.execute(
            "SELECT * FROM routing_decisions WHERE id = ?", (routing["id"],)
        ).fetchone()
        return _parse_routing_row(updated_row)

    finally:
        db.close()
