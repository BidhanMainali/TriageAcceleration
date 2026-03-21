from fastapi import APIRouter
from typing import List, Optional
from models import StaffOut
from database import get_db

router = APIRouter()


@router.get("/staff", response_model=List[StaffOut])
def list_staff(on_shift: Optional[bool] = None, department_id: Optional[str] = None):
    """Return staff, optionally filtered by on-shift and/or department."""
    db = get_db()
    try:
        conditions = []
        params = []
        if on_shift is not None:
            conditions.append("on_shift = ?")
            params.append(1 if on_shift else 0)
        if department_id is not None:
            conditions.append("department_id = ?")
            params.append(department_id)

        query = "SELECT * FROM staff"
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY name"
        rows = db.execute(query, params).fetchall()

        result = []
        for r in rows:
            s = dict(r)
            s["on_shift"] = bool(s["on_shift"])
            result.append(s)
        return result
    finally:
        db.close()
