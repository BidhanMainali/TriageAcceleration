from pydantic import BaseModel
from typing import Optional, List


# ── Patients ──────────────────────────────────────────────────────────────────

class PatientOut(BaseModel):
    patient_id: str
    full_name: str
    gender: str
    health_number: str
    age: int
    date_of_birth: Optional[str]
    blood_type: Optional[str]
    contact_phone: Optional[str]
    created_at: str


# ── Sub-records (used by history router) ──────────────────────────────────────

class ConditionCreate(BaseModel):
    condition_name: str
    icd_code: Optional[str] = None
    diagnosed_date: Optional[str] = None
    status: str = "active"
    severity: str = "moderate"
    notes: Optional[str] = None

class ConditionOut(ConditionCreate):
    id: int
    patient_id: str


class MedicationCreate(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    active: bool = True
    prescribing_doctor: Optional[str] = None

class MedicationOut(MedicationCreate):
    id: int
    patient_id: str


class AllergyCreate(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    severity: str = "moderate"

class AllergyOut(AllergyCreate):
    id: int
    patient_id: str


class LabResultCreate(BaseModel):
    test_name: str
    result: str
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    test_date: Optional[str] = None
    flagged: bool = False
    notes: Optional[str] = None

class LabResultOut(LabResultCreate):
    id: int
    patient_id: str


class VisitCreate(BaseModel):
    visit_date: Optional[str] = None
    chief_complaint: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    department: Optional[str] = None
    doctor_name: Optional[str] = None
    status: str = "Waiting"
    notes: Optional[str] = None
    discharge_summary: Optional[str] = None

class VisitOut(VisitCreate):
    id: int
    patient_id: str


class FamilyHistoryCreate(BaseModel):
    relation: str
    condition: str
    notes: Optional[str] = None

class FamilyHistoryOut(FamilyHistoryCreate):
    id: int
    patient_id: str


# ── AI Analysis ───────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    current_complaint: str

class RiskFactor(BaseModel):
    risk: str
    explanation: str
    timeframe: str

class SpecialistRecommendation(BaseModel):
    specialty: str
    reason: str
    priority: str

class AnalysisOut(BaseModel):
    id: int
    patient_id: str
    current_complaint: str
    summary: str
    relevant_history_summary: str
    risk_factors: List[RiskFactor]
    specialist_recommendation: List[SpecialistRecommendation]
    urgency_level: str
    reasoning: str
    created_at: str


# ── Intake (patient check-in form) ────────────────────────────────────────────

class IntakeRequest(BaseModel):
    # Personal info
    full_name: str
    date_of_birth: str
    gender: str
    health_number: str
    contact_phone: str
    emergency_contact: Optional[str] = None
    blood_type: Optional[str] = None
    # Medical background (free text, comma-separated)
    allergies: Optional[str] = ""
    current_medications: Optional[str] = ""
    # Current visit
    chief_complaint: str
    symptoms: List[str]
    symptom_details: Optional[str] = ""


class IntakeResponse(BaseModel):
    patient_id: str
    urgency_level: str          # critical | high | medium | low
    triage_severity: str        # Critical | Urgent | Semi-Urgent | Non-Urgent
    ai_summary: str
    recommended_specialist: str


# ── Queue view (combined patient + latest visit + latest analysis) ─────────────

class QueuePatient(BaseModel):
    patient_id: str
    full_name: str
    gender: str
    health_number: str
    age: int
    blood_type: Optional[str]
    chief_complaint: Optional[str]
    symptoms: List[str]
    arrival_time: Optional[str]
    triage_severity: str        # Critical | Urgent | Semi-Urgent | Non-Urgent
    assigned_department: Optional[str]
    assigned_doctor: Optional[str]
    status: str                 # Waiting | In Progress | Completed
    ai_summary: str
    recommended_specialist: str


# ── Full patient detail (for doctor's PatientDetails view) ────────────────────

class FullPatient(BaseModel):
    patient_id: str
    full_name: str
    gender: str
    health_number: str
    age: int
    date_of_birth: Optional[str]
    blood_type: Optional[str]
    contact_phone: Optional[str]
    # Current visit context
    chief_complaint: Optional[str]
    symptoms: List[str]
    arrival_time: Optional[str]
    triage_severity: str
    assigned_department: Optional[str]
    assigned_doctor: Optional[str]
    status: str
    # AI result
    ai_summary: str
    recommended_specialist: str
    # Medical history
    allergies: List[str]
    current_medications: List[str]
    medical_history: List[dict]
    vital_signs: Optional[dict]
