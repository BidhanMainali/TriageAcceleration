from pydantic import BaseModel
from typing import Optional, List, Any


class DepartmentOut(BaseModel):
    id: str
    name: str
    capacity: int
    current_load: int


class StaffOut(BaseModel):
    id: str
    name: str
    role: str
    department_id: Optional[str] = None
    specialization: Optional[str] = None
    on_shift: bool
    current_patient_count: int


class PatientIn(BaseModel):
    name: str
    gender: str
    health_number: str
    age: int
    raw_symptoms: str


class PatientOut(BaseModel):
    id: str
    name: str
    gender: Optional[str] = None
    health_number: Optional[str] = None
    age: Optional[int] = None
    raw_symptoms: Optional[str] = None
    structured_symptoms: Optional[Any] = None
    ctas_level: Optional[int] = None
    ai_summary: Optional[str] = None
    department_id: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    status: str
    created_at: str


class RoutingDecisionOut(BaseModel):
    id: str
    patient_id: str
    recommended_dept_id: Optional[str] = None
    recommended_doctor_id: Optional[str] = None
    ai_reasoning: Optional[str] = None
    confidence: Optional[float] = None
    confirmed: bool
    override_dept_id: Optional[str] = None
    override_doctor_id: Optional[str] = None
    created_at: str


class RouteConfirmIn(BaseModel):
    patient_id: str
    confirmed: bool
    override_dept_id: Optional[str] = None
    override_doctor_id: Optional[str] = None


class FollowUpOut(BaseModel):
    questions: List[str]
