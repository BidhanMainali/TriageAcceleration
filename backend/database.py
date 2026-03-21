import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "triage.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS patients (
                patient_id      TEXT PRIMARY KEY,
                full_name       TEXT NOT NULL,
                gender          TEXT NOT NULL,
                health_number   TEXT UNIQUE NOT NULL,
                age             INTEGER NOT NULL,
                date_of_birth   TEXT,
                blood_type      TEXT,
                contact_phone   TEXT,
                contact_email   TEXT,
                created_at      TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS medical_conditions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id      TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                condition_name  TEXT NOT NULL,
                icd_code        TEXT,
                diagnosed_date  TEXT,
                status          TEXT DEFAULT 'active',
                severity        TEXT DEFAULT 'moderate',
                notes           TEXT
            );

            CREATE TABLE IF NOT EXISTS medications (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id          TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                name                TEXT NOT NULL,
                dosage              TEXT,
                frequency           TEXT,
                start_date          TEXT,
                end_date            TEXT,
                active              INTEGER DEFAULT 1,
                prescribing_doctor  TEXT
            );

            CREATE TABLE IF NOT EXISTS allergies (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                allergen    TEXT NOT NULL,
                reaction    TEXT,
                severity    TEXT DEFAULT 'moderate'
            );

            CREATE TABLE IF NOT EXISTS lab_results (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id      TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                test_name       TEXT NOT NULL,
                result          TEXT NOT NULL,
                unit            TEXT,
                normal_range    TEXT,
                test_date       TEXT,
                flagged         INTEGER DEFAULT 0,
                notes           TEXT
            );

            CREATE TABLE IF NOT EXISTS visits (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id          TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                visit_date          TEXT DEFAULT (datetime('now')),
                chief_complaint     TEXT,
                symptoms            TEXT,
                diagnosis           TEXT,
                department          TEXT,
                doctor_name         TEXT,
                status              TEXT DEFAULT 'Waiting',
                notes               TEXT,
                discharge_summary   TEXT
            );

            CREATE TABLE IF NOT EXISTS family_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                relation    TEXT NOT NULL,
                condition   TEXT NOT NULL,
                notes       TEXT
            );

            CREATE TABLE IF NOT EXISTS analysis_results (
                id                          INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id                  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
                current_complaint           TEXT NOT NULL,
                relevant_history_summary    TEXT,
                risk_factors                TEXT,
                specialist_recommendation   TEXT,
                urgency_level               TEXT DEFAULT 'medium',
                summary                     TEXT,
                reasoning                   TEXT,
                created_at                  TEXT DEFAULT (datetime('now'))
            );
        """)
        # Add symptoms/status columns to visits if they were created without them
        existing = {row[1] for row in conn.execute("PRAGMA table_info(visits)").fetchall()}
        if "symptoms" not in existing:
            conn.execute("ALTER TABLE visits ADD COLUMN symptoms TEXT")
        if "status" not in existing:
            conn.execute("ALTER TABLE visits ADD COLUMN status TEXT DEFAULT 'Waiting'")
