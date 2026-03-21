const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface IntakePayload {
  name: string;
  gender: string;
  health_number: string;
  age: number;
  raw_symptoms: string;
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
