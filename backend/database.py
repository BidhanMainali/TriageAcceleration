import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "triage.db")


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL DEFAULT 10,
            current_load INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS staff (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            department_id TEXT,
            specialization TEXT,
            on_shift INTEGER NOT NULL DEFAULT 1,
            current_patient_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            gender TEXT,
            health_number TEXT,
            age INTEGER,
            raw_symptoms TEXT,
            structured_symptoms TEXT,
            ctas_level INTEGER,
            ai_summary TEXT,
            department_id TEXT,
            assigned_doctor_id TEXT,
            emergency_contact_name TEXT,
            emergency_contact_number TEXT,
            status TEXT DEFAULT 'waiting',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS routing_decisions (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            recommended_dept_id TEXT,
            recommended_doctor_id TEXT,
            ai_reasoning TEXT,
            confidence REAL,
            department_scores TEXT,
            confirmed INTEGER DEFAULT 0,
            override_dept_id TEXT,
            override_doctor_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
    """)

    # Migration for existing DBs
    try:
        cur.execute("ALTER TABLE routing_decisions ADD COLUMN department_scores TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Column already exists

    for col in ("emergency_contact_name", "emergency_contact_number"):
        try:
            cur.execute(f"ALTER TABLE patients ADD COLUMN {col} TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists

    conn.commit()
    conn.close()
