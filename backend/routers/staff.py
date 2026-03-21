from fastapi import APIRouter
from typing import List, Optional
from models import StaffOut
from database import get_db

router = APIRouter()


@router.get("/staff", response_model=List[StaffOut])
def list_staff(on_shift: Optional[bool] = None):
    """Return staff, optionally filtered to on-shift only."""
    db = get_db()
    try:
        if on_shift is not None:
            rows = db.execute(
                "SELECT * FROM staff WHERE on_shift = ? ORDER BY name",
                (1 if on_shift else 0,),
            ).fetchall()
        else:
            rows = db.execute("SELECT * FROM staff ORDER BY name").fetchall()

        result = []
        for r in rows:
            s = dict(r)
            s["on_shift"] = bool(s["on_shift"])
            result.append(s)
        return result
    finally:
        db.close()
