# TriageAssist

AI-powered emergency department triage system. Patients check in via a self-serve portal, and an AI pipeline (Claude) extracts symptoms, assigns a CTAS priority level, and routes patients to the appropriate department and doctor. Triage nurses can review and override routing decisions in real time.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/BidhanMainali/TriageAcceleration.git
cd TriageAcceleration
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create your environment file
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env

# Seed the database with departments, staff, and demo patients
python -m data.seed
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

---

## Running the App

Open **two terminals**.

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload
```
Backend runs at `http://localhost:8000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## Using TriageAssist

### Patient Portal
Navigate to `http://localhost:5173/patient`

1. Click **Check In** to begin the self-serve intake form
2. Fill in your personal information (name, date of birth, gender, BC health number, contact)
3. Describe your symptoms — select from the checklist and provide details
4. Review your information and click **Complete Check-In**
5. The AI pipeline will process your intake and assign a triage priority
6. You'll be redirected to your **Queue Status** page showing:
   - Your CTAS priority level (1–5)
   - Assigned department and doctor
   - Time waiting
   - AI clinical summary
7. Save your **Patient ID** to check your status later at `/patient/status`

### Doctor / Nurse Portal
Navigate to `http://localhost:5173`

**Dashboard** — Overview of:
- Total patients, waiting count, critical cases, in-progress
- Critical patients requiring immediate attention
- Patients assigned to Dr. Sarah Chen (default demo doctor)
- Department load overview

**Patient Queue** (`/queue`) — Full list of all patients sorted by CTAS priority:
- Search by name, ID, or health number
- Filter by CTAS level or status
- Auto-refreshes every 15 seconds
- Click **View Details** to open a patient's full record

**Patient Details** (`/patient/:id`) — Full patient record including:
- CTAS level and current status
- AI clinical summary
- Chief complaint, symptoms, severity indicators
- Assigned department and doctor
- **Routing Decision Panel** — triage nurses can review AI routing confidence scores per department and override the assignment if needed

---

## CTAS Priority Levels

| Level | Name | Description |
|-------|------|-------------|
| 1 | Resuscitation | Immediate life threat |
| 2 | Emergent | High risk, seen within 15 min |
| 3 | Urgent | Significant condition, seen within 30 min |
| 4 | Less Urgent | Stable, seen within 60 min |
| 5 | Non-Urgent | Minor, seen within 120 min |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend:** FastAPI, Python, SQLite
- **AI:** Anthropic Claude (claude-opus-4-6) — two-stage pipeline for symptom extraction and triage
