# Reviews

## Code Review Checklist

### Frontend (Next.js + Tailwind)
- [ ] Components are reusable and modular
- [ ] Tailwind classes are consistent and not duplicated inline
- [ ] Pages are responsive (mobile-first for patient web app)
- [ ] Forms validate patient input before submission
- [ ] Live wait-time updates render without full page reload
- [ ] No hardcoded patient data in frontend code

### Backend (FastAPI + Flask + SQLite3)
- [ ] API endpoints follow RESTful conventions
- [ ] Patient data is validated and sanitized on intake
- [ ] SQL queries use parameterized statements (no injection risk)
- [ ] Error responses return meaningful status codes and messages
- [ ] Database schema matches the patient data model (ID, name, gender, health number, age)
- [ ] Staff endpoints correctly filter by department and specialization

### AI / NLP
- [ ] Symptom parsing returns consistent hospital-standard terminology
- [ ] Severity ranking accounts for age, symptoms, and medical history
- [ ] Patient-doctor matching considers department busyness and specialization
- [ ] Medical summary output is concise and scannable
- [ ] AI outputs are deterministic or seeded for reproducibility during demos

### Data & Privacy
- [ ] Patient records stored locally (SQLite3), never sent to external services
- [ ] Synthetic data is realistic but contains no real patient information
- [ ] Health numbers and IDs are unique and properly indexed
- [ ] Database migrations are tracked and reversible

### General
- [ ] No API keys or secrets committed to the repo
- [ ] Code is commented where logic is non-obvious
- [ ] Branch naming follows convention (feature/, bugfix/, hotfix/)
- [ ] PRs include a description of what changed and why

## Review Log

| Date | Reviewer | Area | Status | Notes |
|------|----------|------|--------|-------|
|      |          |      |        |       |

## Review Process
1. Developer opens a PR with a clear description
2. At least one team member reviews the code against the checklist above
3. Reviewer leaves comments or approves
4. Developer addresses feedback and merges after approval
5. Log the review in the table above for tracking
