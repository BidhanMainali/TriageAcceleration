from fastapi import APIRouter
from typing import List
from models import DepartmentOut
from database import get_db

router = APIRouter()


@router.get("/departments", response_model=List[DepartmentOut])
def list_departments():
    """Return all departments with current load and capacity."""
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM departments ORDER BY name").fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()
