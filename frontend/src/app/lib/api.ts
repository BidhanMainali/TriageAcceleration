const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface QueuePatient {
  patient_id: string;
  full_name: string;
  gender: string;
  health_number: string;
  age: number;
  blood_type: string | null;
  chief_complaint: string | null;
  symptoms: string[];
  arrival_time: string | null;
  triage_severity: "Critical" | "Urgent" | "Semi-Urgent" | "Non-Urgent";
  assigned_department: string | null;
  assigned_doctor: string | null;
  status: "Waiting" | "In Progress" | "Completed";
  ai_summary: string;
  recommended_specialist: string;
}

export interface FullPatient extends QueuePatient {
  date_of_birth: string | null;
  contact_phone: string | null;
  allergies: string[];
  current_medications: string[];
  medical_history: {
    date: string;
    condition: string;
    treatment: string;
    doctor: string;
    notes: string;
  }[];
  vital_signs: null;
}

export interface IntakePayload {
  full_name: string;
  date_of_birth: string;
  gender: string;
  health_number: string;
  contact_phone: string;
  emergency_contact?: string;
  blood_type?: string;
  allergies?: string;
  current_medications?: string;
  chief_complaint: string;
  symptoms: string[];
  symptom_details?: string;
}

export interface IntakeResponse {
  patient_id: string;
  urgency_level: string;
  triage_severity: string;
  ai_summary: string;
  recommended_specialist: string;
}

// ── API functions ──────────────────────────────────────────────────────────

export const api = {
  getQueue: () => request<QueuePatient[]>("/queue"),

  getPatient: (id: string) => request<FullPatient>(`/patients/${id}/full`),

  submitCheckIn: (payload: IntakePayload) =>
    request<IntakeResponse>("/intake", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
