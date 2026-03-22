from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
import re


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

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        if not re.match(r"^[a-zA-Z\s'\-]+$", v):
            raise ValueError("Name can only contain letters, spaces, hyphens, and apostrophes")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Age cannot be negative")
        if v > 150:
            raise ValueError("Age cannot exceed 150")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        allowed = {"Male", "Female", "Other"}
        if v not in allowed:
            raise ValueError(f"Gender must be one of: {', '.join(allowed)}")
        return v

    @field_validator("health_number")
    @classmethod
    def validate_health_number(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Health number must be at least 5 characters")
        return v

    @field_validator("raw_symptoms")
    @classmethod
    def validate_raw_symptoms(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Symptoms description is required")
        return v


class StatusUpdateIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = {"waiting", "routed", "in_progress", "discharged"}
        if v not in valid:
            raise ValueError(f"Status must be one of: {', '.join(valid)}")
        return v


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


class DepartmentScore(BaseModel):
    department_id: str
    score: float
    reasoning: str


class RoutingDecisionOut(BaseModel):
    id: str
    patient_id: str
    recommended_dept_id: Optional[str] = None
    recommended_doctor_id: Optional[str] = None
    ai_reasoning: Optional[str] = None
    confidence: Optional[float] = None
    department_scores: Optional[List[DepartmentScore]] = None
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
