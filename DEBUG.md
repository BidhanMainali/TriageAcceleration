# Debug Guide

## Common Issues & Fixes

### Frontend (Next.js + Tailwind)

#### Next.js dev server won't start
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

#### Tailwind styles not applying
- Verify `tailwind.config.js` includes all content paths
- Restart the dev server after config changes
- Check for typos in class names

#### Patient form not submitting
- Check browser console for CORS errors
- Verify the backend API URL in environment variables
- Ensure all required fields are filled and validated

#### Live updates not refreshing
- Check WebSocket or polling connection to backend
- Verify the endpoint returns updated queue data
- Inspect network tab for failed requests

---

### Backend (FastAPI + Flask + SQLite3)

#### FastAPI server fails to start
```bash
# Check for port conflicts
lsof -i :8000
# Install missing dependencies
pip install -r requirements.txt
# Run with reload
uvicorn main:app --reload
```

#### SQLite3 database locked
- Ensure only one process writes at a time
- Close any open DB browser connections
- Use WAL mode for concurrent reads:
```python
conn.execute("PRAGMA journal_mode=WAL;")
```

#### 422 Unprocessable Entity on API calls
- Request body doesn't match the Pydantic model
- Check field names, types, and required vs optional
- Use FastAPI's `/docs` endpoint to test requests

#### Patient data not saving
- Verify the SQLite3 database file path is correct
- Check that the table schema matches the data model
- Ensure `conn.commit()` is called after inserts

---

### AI / NLP

#### Symptom parsing returns garbage
- Check that the AI model/API is reachable
- Verify the prompt template includes proper context
- Test with known symptom inputs and compare outputs

#### Severity ranking seems off
- Review the ranking logic weights (age, symptom type, history)
- Check edge cases: very young, very old, multiple symptoms
- Log intermediate scores for debugging

#### Patient-doctor matching ignores department load
- Verify department busyness data is being updated in real time
- Check the matching algorithm inputs — ensure load data is passed
- Print the candidate list before and after filtering

#### Medical summary too long or missing key info
- Adjust the summarization prompt length constraints
- Ensure all relevant patient fields are included in the input
- Test with varied patient histories (short, long, complex)

---

### Database

#### Schema mismatch after updates
```bash
# Check current schema
sqlite3 hospital.db ".schema"
# Recreate tables (dev only — destroys data)
python init_db.py
```

#### Duplicate patient IDs
- Ensure `patient_id` column has a UNIQUE constraint
- Check the ID generation logic for collisions
- Add error handling for `IntegrityError` on inserts

#### Queries running slow
- Add indexes on frequently queried columns (patient_id, health_number)
- Use `EXPLAIN QUERY PLAN` to identify full table scans
- Keep the database file on local storage, not network drives

---

### Environment & Setup

#### Python dependency conflicts
```bash
# Use a virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

#### Node dependency issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### CORS errors between frontend and backend
- Add CORS middleware in FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Debug Workflow
1. **Reproduce** — Get the exact steps to trigger the bug
2. **Isolate** — Determine if it's frontend, backend, AI, or database
3. **Log** — Add print/console.log statements at key points
4. **Fix** — Make the smallest change that resolves the issue
5. **Verify** — Confirm the fix works and doesn't break other features
6. **Document** — Add the issue and fix to this file if it's likely to recur
