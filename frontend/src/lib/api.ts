const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface IntakePayload {
  name: string;
  gender: string;
  health_number: string;
  age: number;
  raw_symptoms: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  gender: string;
  health_number: string;
  age: number;
  raw_symptoms: string;
  structured_symptoms: Record<string, unknown> | null;
  ctas_level: number | null;
  ai_summary: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  department_id: string | null;
  assigned_doctor_id: string | null;
  status: string;
  created_at: string;
}

export async function submitIntake(payload: IntakePayload): Promise<PatientRecord> {
  const res = await fetch(`${API_URL}/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function getPatient(patientId: string): Promise<PatientRecord> {
  const res = await fetch(`${API_URL}/patients/${patientId}`);
  if (!res.ok) throw new Error(`Patient not found`);
  return res.json();
}

export async function getDepartments() {
  const res = await fetch(`${API_URL}/departments`);
  if (!res.ok) throw new Error("Failed to load departments");
  return res.json();
}

export async function getPatients(status?: string) {
  const url = status ? `${API_URL}/patients?status=${status}` : `${API_URL}/patients`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load patients");
  return res.json();
}

export async function getStaff(onShift?: boolean) {
  const url = onShift !== undefined
    ? `${API_URL}/staff?on_shift=${onShift}`
    : `${API_URL}/staff`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load staff");
  return res.json();
}

export interface DepartmentScore {
  department_id: string;
  score: number;
  reasoning: string;
}

export interface RoutingDecision {
  id: string;
  patient_id: string;
  recommended_dept_id: string | null;
  recommended_doctor_id: string | null;
  ai_reasoning: string | null;
  confidence: number | null;
  department_scores: DepartmentScore[] | null;
  confirmed: boolean;
  override_dept_id: string | null;
  override_doctor_id: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  capacity: number;
  current_load: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department_id: string | null;
  specialization: string | null;
  on_shift: boolean;
  current_patient_count: number;
}

export async function getRouting(patientId: string): Promise<RoutingDecision> {
  const res = await fetch(`${API_URL}/routing/${patientId}`);
  if (!res.ok) throw new Error("No routing decision found");
  return res.json();
}

export async function getStaffByDepartment(departmentId: string): Promise<StaffMember[]> {
  const res = await fetch(`${API_URL}/staff?on_shift=true&department_id=${departmentId}`);
  if (!res.ok) throw new Error("Failed to load staff");
  return res.json();
}

export async function confirmRouting(
  patientId: string,
  confirmed: boolean,
  overrideDeptId?: string,
  overrideDoctorId?: string
) {
  const res = await fetch(`${API_URL}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: patientId,
      confirmed,
      override_dept_id: overrideDeptId ?? null,
      override_doctor_id: overrideDoctorId ?? null,
    }),
  });
  if (!res.ok) throw new Error("Failed to confirm routing");
  return res.json();
}
