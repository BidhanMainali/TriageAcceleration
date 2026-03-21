import uuid
from fastapi import APIRouter, HTTPException
from models import RouteConfirmIn, RoutingDecisionOut
from database import get_db

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
        r = dict(row)
        r["confirmed"] = bool(r["confirmed"])
        return r
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

        db.execute(
            """
            UPDATE patients
            SET department_id = ?, assigned_doctor_id = ?, status = 'routed'
            WHERE id = ?
            """,
            (final_dept, final_doctor, route_in.patient_id),
        )

        db.commit()

        updated = dict(
            db.execute(
                "SELECT * FROM routing_decisions WHERE id = ?", (routing["id"],)
            ).fetchone()
        )
        updated["confirmed"] = bool(updated["confirmed"])
        return updated

    finally:
        db.close()
