export interface Patient {
  patientId: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  healthNumber: string;
  age: number;
  dateOfBirth: string;
  contactNumber: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string[];
  currentMedications: string[];
  medicalHistory: MedicalHistoryEntry[];
  chiefComplaint: string;
  symptoms: string[];
  arrivalTime: string;
  triageSeverity: 'Critical' | 'Urgent' | 'Semi-Urgent' | 'Non-Urgent';
  assignedDepartment?: string;
  assignedDoctor?: string;
  status: 'Waiting' | 'In Progress' | 'Completed';
  vitalSigns: VitalSigns;
  aiSummary: string;
  recommendedSpecialist: string;
}

export interface MedicalHistoryEntry {
  date: string;
  condition: string;
  treatment: string;
  doctor: string;
  notes: string;
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  assignedPatients: number;
}

export const mockDoctors: Doctor[] = [
  {
    id: 'D001',
    name: 'Dr. Sarah Chen',
    specialization: 'Emergency Medicine',
    department: 'Emergency',
    assignedPatients: 3,
  },
  {
    id: 'D002',
    name: 'Dr. Michael Johnson',
    specialization: 'Cardiology',
    department: 'Cardiology',
    assignedPatients: 2,
  },
  {
    id: 'D003',
    name: 'Dr. Emily Rodriguez',
    specialization: 'Pulmonology',
    department: 'Respiratory',
    assignedPatients: 1,
  },
  {
    id: 'D004',
    name: 'Dr. James Wilson',
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    assignedPatients: 2,
  },
];

export const mockPatients: Patient[] = [
  {
    patientId: 'P20260321001',
    fullName: 'Robert Anderson',
    gender: 'Male',
    healthNumber: 'BC-9876-543-210',
    age: 68,
    dateOfBirth: '1958-05-14',
    contactNumber: '(604) 555-0123',
    emergencyContact: 'Mary Anderson (604) 555-0124',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish'],
    currentMedications: ['Lisinopril 10mg', 'Metformin 500mg', 'Aspirin 81mg'],
    medicalHistory: [
      {
        date: '2025-11-15',
        condition: 'Type 2 Diabetes',
        treatment: 'Metformin prescribed',
        doctor: 'Dr. Patricia Lee',
        notes: 'Patient responding well to treatment. HbA1c improved.',
      },
      {
        date: '2024-08-22',
        condition: 'Hypertension',
        treatment: 'Lisinopril prescribed',
        doctor: 'Dr. Patricia Lee',
        notes: 'Blood pressure controlled with medication.',
      },
      {
        date: '2023-03-10',
        condition: 'Mild Heart Attack',
        treatment: 'Angioplasty performed',
        doctor: 'Dr. Michael Johnson',
        notes: 'Successful procedure. Patient advised lifestyle changes.',
      },
    ],
    chiefComplaint: 'Severe chest pain and shortness of breath',
    symptoms: ['Chest pain', 'Shortness of breath', 'Sweating', 'Dizziness'],
    arrivalTime: '2026-03-21T08:15:00',
    triageSeverity: 'Critical',
    assignedDepartment: 'Cardiology',
    assignedDoctor: 'Dr. Michael Johnson',
    status: 'In Progress',
    vitalSigns: {
      bloodPressure: '165/95',
      heartRate: 102,
      temperature: 37.2,
      respiratoryRate: 22,
      oxygenSaturation: 94,
    },
    aiSummary: 'Patient presents with cardiac symptoms consistent with possible acute coronary syndrome. History of previous MI and current medications suggest cardiovascular risk. Immediate cardiology consultation recommended.',
    recommendedSpecialist: 'Cardiology',
  },
  {
    patientId: 'P20260321002',
    fullName: 'Jennifer Thompson',
    gender: 'Female',
    healthNumber: 'BC-8765-432-109',
    age: 34,
    dateOfBirth: '1991-12-08',
    contactNumber: '(778) 555-0198',
    emergencyContact: 'David Thompson (778) 555-0199',
    bloodType: 'A+',
    allergies: ['Latex'],
    currentMedications: ['Birth control'],
    medicalHistory: [
      {
        date: '2024-06-12',
        condition: 'Sprained ankle',
        treatment: 'RICE protocol, pain management',
        doctor: 'Dr. James Wilson',
        notes: 'Recovered fully in 6 weeks.',
      },
      {
        date: '2022-09-03',
        condition: 'Migraine',
        treatment: 'Prescribed sumatriptan',
        doctor: 'Dr. Amanda Foster',
        notes: 'Episodes reduced with medication.',
      },
    ],
    chiefComplaint: 'Severe wrist pain after fall',
    symptoms: ['Wrist pain', 'Swelling', 'Limited mobility'],
    arrivalTime: '2026-03-21T09:30:00',
    triageSeverity: 'Semi-Urgent',
    assignedDepartment: 'Orthopedics',
    assignedDoctor: 'Dr. James Wilson',
    status: 'Waiting',
    vitalSigns: {
      bloodPressure: '118/76',
      heartRate: 78,
      temperature: 36.8,
      respiratoryRate: 16,
      oxygenSaturation: 98,
    },
    aiSummary: 'Patient with acute wrist injury following fall. Possible fracture requiring X-ray imaging. Orthopedic assessment recommended.',
    recommendedSpecialist: 'Orthopedics',
  },
  {
    patientId: 'P20260321003',
    fullName: 'Marcus Williams',
    gender: 'Male',
    healthNumber: 'BC-7654-321-098',
    age: 52,
    dateOfBirth: '1973-07-22',
    contactNumber: '(604) 555-0287',
    emergencyContact: 'Lisa Williams (604) 555-0288',
    bloodType: 'B-',
    allergies: [],
    currentMedications: [],
    medicalHistory: [
      {
        date: '2020-11-20',
        condition: 'Pneumonia',
        treatment: 'Antibiotics, hospitalization',
        doctor: 'Dr. Emily Rodriguez',
        notes: 'Full recovery after 10 days.',
      },
    ],
    chiefComplaint: 'Persistent cough and difficulty breathing',
    symptoms: ['Cough with mucus', 'Difficulty breathing', 'Fever', 'Fatigue', 'Chest tightness'],
    arrivalTime: '2026-03-21T07:45:00',
    triageSeverity: 'Urgent',
    assignedDepartment: 'Respiratory',
    assignedDoctor: 'Dr. Emily Rodriguez',
    status: 'In Progress',
    vitalSigns: {
      bloodPressure: '128/82',
      heartRate: 88,
      temperature: 38.4,
      respiratoryRate: 24,
      oxygenSaturation: 91,
    },
    aiSummary: 'Patient showing respiratory distress with fever and productive cough. History of previous pneumonia. Chest X-ray and pulmonology consultation recommended to rule out infection or exacerbation.',
    recommendedSpecialist: 'Pulmonology',
  },
  {
    patientId: 'P20260321004',
    fullName: 'Sophia Martinez',
    gender: 'Female',
    healthNumber: 'BC-6543-210-987',
    age: 28,
    dateOfBirth: '1997-03-15',
    contactNumber: '(778) 555-0345',
    emergencyContact: 'Carlos Martinez (778) 555-0346',
    bloodType: 'AB+',
    allergies: ['Sulfa drugs'],
    currentMedications: ['Levothyroxine 50mcg'],
    medicalHistory: [
      {
        date: '2023-04-10',
        condition: 'Hypothyroidism',
        treatment: 'Levothyroxine prescribed',
        doctor: 'Dr. Rachel Kim',
        notes: 'TSH levels normalized with medication.',
      },
    ],
    chiefComplaint: 'Severe abdominal pain',
    symptoms: ['Lower right abdominal pain', 'Nausea', 'Vomiting', 'Loss of appetite'],
    arrivalTime: '2026-03-21T10:20:00',
    triageSeverity: 'Urgent',
    assignedDepartment: 'Emergency',
    assignedDoctor: 'Dr. Sarah Chen',
    status: 'Waiting',
    vitalSigns: {
      bloodPressure: '122/78',
      heartRate: 92,
      temperature: 38.1,
      respiratoryRate: 18,
      oxygenSaturation: 97,
    },
    aiSummary: 'Patient presenting with classic appendicitis symptoms. Immediate surgical consultation recommended. Imaging studies needed to confirm diagnosis.',
    recommendedSpecialist: 'General Surgery',
  },
  {
    patientId: 'P20260321005',
    fullName: 'David Lee',
    gender: 'Male',
    healthNumber: 'BC-5432-109-876',
    age: 45,
    dateOfBirth: '1980-11-30',
    contactNumber: '(604) 555-0412',
    emergencyContact: 'Susan Lee (604) 555-0413',
    bloodType: 'A-',
    allergies: ['Codeine'],
    currentMedications: ['Atorvastatin 20mg'],
    medicalHistory: [
      {
        date: '2024-01-18',
        condition: 'High Cholesterol',
        treatment: 'Atorvastatin prescribed',
        doctor: 'Dr. Michael Johnson',
        notes: 'Cholesterol levels improving. Continue medication.',
      },
      {
        date: '2021-05-25',
        condition: 'Fractured tibia',
        treatment: 'Cast applied, physical therapy',
        doctor: 'Dr. James Wilson',
        notes: 'Complete healing after 8 weeks.',
      },
    ],
    chiefComplaint: 'Laceration on left arm from accident',
    symptoms: ['Deep cut on arm', 'Bleeding'],
    arrivalTime: '2026-03-21T11:05:00',
    triageSeverity: 'Semi-Urgent',
    assignedDepartment: 'Emergency',
    assignedDoctor: 'Dr. Sarah Chen',
    status: 'Waiting',
    vitalSigns: {
      bloodPressure: '130/84',
      heartRate: 82,
      temperature: 36.9,
      respiratoryRate: 16,
      oxygenSaturation: 98,
    },
    aiSummary: 'Patient with traumatic laceration requiring suturing. Tetanus status should be verified. Wound cleaning and closure needed.',
    recommendedSpecialist: 'Emergency Medicine',
  },
  {
    patientId: 'P20260321006',
    fullName: 'Emma Brown',
    gender: 'Female',
    healthNumber: 'BC-4321-098-765',
    age: 71,
    dateOfBirth: '1954-08-05',
    contactNumber: '(778) 555-0567',
    emergencyContact: 'James Brown (778) 555-0568',
    bloodType: 'O-',
    allergies: ['Aspirin', 'NSAIDs'],
    currentMedications: ['Warfarin 5mg', 'Amlodipine 5mg', 'Furosemide 20mg'],
    medicalHistory: [
      {
        date: '2024-09-14',
        condition: 'Atrial Fibrillation',
        treatment: 'Warfarin anticoagulation therapy',
        doctor: 'Dr. Michael Johnson',
        notes: 'INR levels stable. Regular monitoring required.',
      },
      {
        date: '2023-06-08',
        condition: 'Congestive Heart Failure',
        treatment: 'Diuretics and ACE inhibitors',
        doctor: 'Dr. Michael Johnson',
        notes: 'Symptoms managed with medication adjustments.',
      },
      {
        date: '2022-02-19',
        condition: 'Hip Replacement',
        treatment: 'Total hip arthroplasty',
        doctor: 'Dr. James Wilson',
        notes: 'Successful surgery. Full mobility restored.',
      },
    ],
    chiefComplaint: 'Dizziness and irregular heartbeat',
    symptoms: ['Dizziness', 'Palpitations', 'Weakness', 'Confusion'],
    arrivalTime: '2026-03-21T08:50:00',
    triageSeverity: 'Urgent',
    assignedDepartment: 'Cardiology',
    assignedDoctor: 'Dr. Michael Johnson',
    status: 'Waiting',
    vitalSigns: {
      bloodPressure: '98/62',
      heartRate: 145,
      temperature: 36.7,
      respiratoryRate: 20,
      oxygenSaturation: 95,
    },
    aiSummary: 'Elderly patient with known AFib presenting with rapid ventricular response. On anticoagulation therapy. ECG and electrolyte panel needed. Cardiology assessment for rate control required.',
    recommendedSpecialist: 'Cardiology',
  },
];
