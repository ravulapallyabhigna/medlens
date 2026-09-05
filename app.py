"""
MedLens - AI-Powered Clinical Information Intelligence (Backend)
================================================================
Single-file Python backend using Flask + SQLite.

RUN:
    pip install flask
    python app.py
    -> http://127.0.0.1:5000

FRONTEND INTEGRATION (existing vanilla JS can call):
    fetch("http://127.0.0.1:5000/api/health")
    fetch("http://127.0.0.1:5000/api/patients")
    fetch("http://127.0.0.1:5000/api/patients/P-1002/record")
    fetch("http://127.0.0.1:5000/api/dashboard")
    fetch("http://127.0.0.1:5000/api/search?q=rahul")

All responses are JSON:
  Success: {"success": true, "data": {...}, "message": "..."}
  Error:   {"success": false, "error": "...", "message": "..."}

Notes:
- SQLite database file (medlens.db) is created automatically on start.
- Uploads folder (uploads/) is created automatically.
- Fictional demo data is seeded automatically on first run.
- No files are sent to external services. Report processing is simulated.
- Uploaded files are never executed.
"""
import os
import json
import sqlite3
import datetime
from pathlib import Path
from flask import Flask, request, jsonify, g, send_from_directory
from werkzeug.utils import secure_filename

# ---------------- Config ----------------
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = str(BASE_DIR / "medlens.db")
UPLOAD_FOLDER = str(BASE_DIR / "uploads")
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
MAX_UPLOAD_MB = 15

DISCLAIMER = ("MedLens assists with organizing and understanding medical "
              "information. It does not replace professional medical "
              "diagnosis or treatment.")

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
app.config["JSON_SORT_KEYS"] = False

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------- CORS (no extra dependency) ----------------
@app.before_request
def _handle_preflight():
    if request.method == "OPTIONS":
        resp = jsonify({"success": True})
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return resp, 200

@app.after_request
def _add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# ---------------- DB connection ----------------
def get_db():
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db

@app.teardown_appcontext
def close_db(_exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def query_all(sql, params=()):
    cur = get_db().execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    return rows

def query_one(sql, params=()):
    cur = get_db().execute(sql, params)
    row = cur.fetchone()
    cur.close()
    return row

def execute_write(sql, params=()):
    db = get_db()
    cur = db.execute(sql, params)
    db.commit()
    last_id = cur.lastrowid
    cur.close()
    return last_id

# ---------------- JSON helpers ----------------
def success(data=None, message="OK", code=200):
    return jsonify({"success": True, "data": data, "message": message}), code

def error(error_code="ERROR", message="Something went wrong", code=400):
    return jsonify({"success": False, "error": error_code, "message": message}), code

def now_iso():
    return datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

def today_str():
    return datetime.date.today().isoformat()

def parse_list(value):
    """Parse a JSON list stored as TEXT. Returns python list."""
    if value is None or value == "":
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else [parsed]
    except (ValueError, TypeError):
        return [str(value)]

def dump_list(value):
    if value is None:
        return json.dumps([])
    if isinstance(value, str):
        # allow comma-separated strings from forms
        items = [p.strip() for p in value.split(",") if p.strip()]
        return json.dumps(items if "," in value else [value] if value else [])
    if isinstance(value, list):
        return json.dumps(value)
    return json.dumps([str(value)])

def compute_status(value, ref_min, ref_max, ref_text):
    """Only Low/Normal/High when a reference range is available.
    Otherwise Unknown. Never invents a range."""
    if ref_text is None or str(ref_text).strip() == "":
        return "Unknown"
    if ref_min is None or ref_max is None:
        return "Unknown"
    try:
        v = float(value)
        lo = float(ref_min)
        hi = float(ref_max)
    except (TypeError, ValueError):
        return "Unknown"
    if v < lo:
        return "Low"
    if v > hi:
        return "High"
    return "Normal"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------------- Schema ----------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            sex TEXT NOT NULL,
            date_of_birth TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            symptoms TEXT DEFAULT '[]',
            existing_conditions TEXT DEFAULT '[]',
            allergies TEXT DEFAULT '[]',
            medications TEXT DEFAULT '[]',
            emergency_contact TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            status TEXT DEFAULT 'Active',
            risk TEXT DEFAULT 'Low',
            verified INTEGER DEFAULT 0,
            last_report TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            updated_at TEXT DEFAULT ''
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT DEFAULT '',
            file_path TEXT DEFAULT '',
            file_size INTEGER DEFAULT 0,
            file_type TEXT DEFAULT '',
            report_type TEXT DEFAULT 'General',
            status TEXT DEFAULT 'Uploaded',
            confidence TEXT DEFAULT 'Medium',
            confidence_pct INTEGER DEFAULT 80,
            upload_date TEXT DEFAULT '',
            processed_date TEXT DEFAULT '',
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lab_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            report_id INTEGER,
            test_name TEXT NOT NULL,
            value REAL,
            value_text TEXT DEFAULT '',
            unit TEXT DEFAULT '',
            reference_range TEXT DEFAULT '',
            ref_min REAL,
            ref_max REAL,
            status TEXT DEFAULT 'Unknown',
            date TEXT DEFAULT '',
            source TEXT DEFAULT '',
            source_type TEXT DEFAULT 'report',
            confidence TEXT DEFAULT 'Medium',
            confidence_pct INTEGER DEFAULT 80,
            verified INTEGER DEFAULT 0,
            verified_by TEXT DEFAULT '',
            verified_at TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            updated_at TEXT DEFAULT '',
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS conflicts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            source_a TEXT DEFAULT '',
            source_b TEXT DEFAULT '',
            conflict_type TEXT DEFAULT 'general',
            status TEXT DEFAULT 'open',
            resolution TEXT DEFAULT '',
            resolved_by TEXT DEFAULT '',
            resolved_at TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS timeline_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            event_type TEXT DEFAULT 'note',
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            source TEXT DEFAULT '',
            source_type TEXT DEFAULT 'input',
            actor TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_labs_patient ON lab_results(patient_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_labs_report ON lab_results(report_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_conflicts_patient ON conflicts(patient_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_timeline_patient ON timeline_events(patient_id)")
    conn.commit()
    conn.close()

# ---------------- Serializers ----------------
def serialize_patient(row):
    if row is None:
        return None
    d = dict(row)
    symptoms = parse_list(d.get("symptoms"))
    conditions = parse_list(d.get("existing_conditions"))
    allergies = parse_list(d.get("allergies"))
    meds = parse_list(d.get("medications"))
    return {
        "patient_id": d["patient_id"],
        "full_name": d["full_name"],
        "age": d["age"],
        "sex": d["sex"],
        "date_of_birth": d.get("date_of_birth") or "",
        "phone": d.get("phone") or "",
        "symptoms": symptoms,
        "existing_conditions": conditions,
        "allergies": allergies,
        "medications": meds,
        "emergency_contact": d.get("emergency_contact") or "",
        "notes": d.get("notes") or "",
        "status": d.get("status") or "Active",
        "risk": d.get("risk") or "Low",
        "verified": bool(d.get("verified")),
        "last_report": d.get("last_report") or "",
        "created_at": d.get("created_at") or "",
        "updated_at": d.get("updated_at") or "",
        # aliases for the existing vanilla-JS frontend
        "id": d["patient_id"],
        "name": d["full_name"],
        "dob": d.get("date_of_birth") or "",
        "conditions": conditions,
        "meds": meds,
        "emergency": d.get("emergency_contact") or "",
        "lastReport": d.get("last_report") or "",
    }

def serialize_report(row):
    if row is None:
        return None
    d = dict(row)
    return {
        "id": d["id"],
        "patient_id": d["patient_id"],
        "filename": d["filename"],
        "original_filename": d.get("original_filename") or d["filename"],
        "file_size": d.get("file_size") or 0,
        "file_type": d.get("file_type") or "",
        "report_type": d.get("report_type") or "General",
        "type": d.get("report_type") or "General",
        "status": d.get("status") or "Uploaded",
        "confidence": d.get("confidence") or "Medium",
        "confidence_pct": d.get("confidence_pct") or 0,
        "upload_date": d.get("upload_date") or "",
        "processed_date": d.get("processed_date") or "",
        "date": d.get("upload_date") or "",
        "file": d.get("original_filename") or d["filename"],
        "patient": d.get("patient_name") or d["patient_id"],
        "pct": d.get("confidence_pct") or 0,
        "size": d.get("file_size") or 0,
    }

def serialize_lab(row):
    if row is None:
        return None
    d = dict(row)
    verified = bool(d.get("verified"))
    return {
        "id": d["id"],
        "patient_id": d["patient_id"],
        "report_id": d.get("report_id"),
        "test_name": d["test_name"],
        "value": d.get("value"),
        "value_text": d.get("value_text") or "",
        "unit": d.get("unit") or "",
        "reference_range": d.get("reference_range") or "",
        "ref_min": d.get("ref_min"),
        "ref_max": d.get("ref_max"),
        "status": d.get("status") or "Unknown",
        "date": d.get("date") or "",
        "source": d.get("source") or "",
        "source_type": d.get("source_type") or "report",
        "confidence": d.get("confidence") or "Medium",
        "confidence_pct": d.get("confidence_pct") or 0,
        "verified": verified,
        "verified_by": d.get("verified_by") or "",
        "verified_at": d.get("verified_at") or "",
        "verification_label": "Verified by reviewer" if verified else "Needs verification",
        "created_at": d.get("created_at") or "",
        "updated_at": d.get("updated_at") or "",
        # aliases for existing frontend
        "test": d["test_name"],
        "result": d.get("value"),
        "ref": d.get("reference_range") or "",
        "min": d.get("ref_min"),
        "max": d.get("ref_max"),
        "conf": d.get("confidence") or "Medium",
        "confPct": d.get("confidence_pct") or 0,
    }

def serialize_conflict(row):
    if row is None:
        return None
    d = dict(row)
    return {
        "id": d["id"],
        "patient_id": d["patient_id"],
        "title": d["title"],
        "description": d.get("description") or "",
        "source_a": d.get("source_a") or "",
        "source_b": d.get("source_b") or "",
        "conflict_type": d.get("conflict_type") or "general",
        "status": d.get("status") or "open",
        "resolution": d.get("resolution") or "",
        "resolved_by": d.get("resolved_by") or "",
        "resolved_at": d.get("resolved_at") or "",
        "created_at": d.get("created_at") or "",
        "a": d.get("source_a") or "",
        "b": d.get("source_b") or "",
        "desc": d.get("description") or "",
    }

def serialize_timeline(row):
    if row is None:
        return None
    d = dict(row)
    return {
        "id": d["id"],
        "patient_id": d["patient_id"],
        "event_type": d.get("event_type") or "note",
        "title": d.get("title") or "",
        "description": d.get("description") or "",
        "source": d.get("source") or "",
        "source_type": d.get("source_type") or "input",
        "actor": d.get("actor") or "",
        "created_at": d.get("created_at") or "",
        "date": (d.get("created_at") or "")[:10],
        "event": d.get("title") or "",
        "desc": d.get("description") or "",
    }

# ---------------- Validation ----------------
VALID_SEX = {"Female", "Male", "Other", "Prefer not to say"}
VALID_STATUS = {"Active", "Verified", "Pending Review", "Needs Attention"}
VALID_RISK = {"Low", "Moderate", "High"}
VALID_LAB_STATUS = {"Low", "Normal", "High", "Unknown"}
VALID_SOURCE_TYPES = {"input", "report", "ai"}
VALID_CONFLICT_STATUS = {"open", "reviewed", "resolved", "dismissed"}

def validate_patient_input(data, is_update=False):
    errs = []
    if not isinstance(data, dict):
        return ["Request body must be a JSON object."]
    if not is_update:
        if not str(data.get("patient_id", "")).strip():
            errs.append("patient_id is required.")
        if not str(data.get("full_name", "")).strip():
            errs.append("full_name is required.")
        if data.get("age") is None or str(data.get("age")).strip() == "":
            errs.append("age is required.")
        if not str(data.get("sex", "")).strip():
            errs.append("sex is required.")
    if "full_name" in data and data["full_name"] is not None:
        if len(str(data["full_name"])) > 120:
            errs.append("full_name is too long (max 120).")
    if "age" in data and data["age"] is not None and str(data["age"]).strip() != "":
        try:
            a = int(data["age"])
            if a < 0 or a > 130:
                errs.append("age must be between 0 and 130.")
        except (ValueError, TypeError):
            errs.append("age must be a number.")
    if "sex" in data and data["sex"] not in (None, "") and data["sex"] not in VALID_SEX:
        errs.append("sex must be one of: Female, Male, Other, Prefer not to say.")
    if "status" in data and data["status"] not in (None, "") and data["status"] not in VALID_STATUS:
        errs.append("status is invalid.")
    if "risk" in data and data["risk"] not in (None, "") and data["risk"] not in VALID_RISK:
        errs.append("risk must be Low, Moderate or High.")
    for f in ("patient_id", "phone", "date_of_birth", "emergency_contact"):
        if f in data and data[f] is not None and len(str(data[f])) > 120:
            errs.append(f + " is too long (max 120).")
    if "notes" in data and data["notes"] is not None and len(str(data["notes"])) > 5000:
        errs.append("notes is too long (max 5000).")
    return errs

def normalize_list_field(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x)[:300] for x in value][:50]
    if isinstance(value, str):
        if "," in value:
            return [p.strip()[:300] for p in value.split(",") if p.strip()][:50]
        return [value[:300]] if value.strip() else []
    return [str(value)[:300]]

def normalize_meds(value):
    if value is None:
        return []
    if isinstance(value, str):
        items = [p.strip() for p in value.split(",") if p.strip()]
        return [{"n": i[:200], "d": ""} for i in items[:30]]
    if isinstance(value, list):
        out = []
        for x in value[:30]:
            if isinstance(x, dict):
                out.append({"n": str(x.get("n", x.get("name", "")))[:200],
                            "d": str(x.get("d", x.get("detail", x.get("dosage", ""))))[:200]})
            else:
                out.append({"n": str(x)[:200], "d": ""})
        return out
    return [{"n": str(value)[:200], "d": ""}]

def log_event(patient_id, event_type, title, description="", source="", source_type="input", actor="System"):
    try:
        execute_write(
            """INSERT INTO timeline_events
               (patient_id, event_type, title, description, source, source_type, actor, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (patient_id, event_type[:40], title[:200], description[:1000],
             source[:300], source_type[:20], actor[:120], now_iso()))
    except Exception:
        pass

# ---------------- Known reference ranges (used ONLY as simulated source-report ranges) ----------------
KNOWN_RANGES = {
    "Hemoglobin": ("g/dL", 13.0, 17.0, "13.0 - 17.0 g/dL"),
    "Hemoglobin (F)": ("g/dL", 12.0, 15.5, "12.0 - 15.5 g/dL"),
    "WBC Count": ("/uL", 4000, 11000, "4,000 - 11,000 /uL"),
    "Platelet Count": ("/uL", 150000, 410000, "150,000 - 410,000 /uL"),
    "Glucose (Fasting)": ("mg/dL", 70, 100, "70 - 100 mg/dL"),
    "Creatinine": ("mg/dL", 0.6, 1.2, "0.6 - 1.2 mg/dL"),
    "TSH": ("uIU/mL", 0.4, 4.0, "0.4 - 4.0 uIU/mL"),
    "Vitamin D": ("ng/mL", 30, 100, "30 - 100 ng/mL"),
    "Total Cholesterol": ("mg/dL", 125, 200, "125 - 200 mg/dL"),
    "HbA1c": ("%", 4.0, 5.6, "4.0 - 5.6 %"),
}

DEMO_PATIENTS = [
    {"patient_id": "P-1001", "full_name": "Ananya Sharma", "age": 34, "sex": "Female",
     "date_of_birth": "1992-04-18", "phone": "+91 98110 22334",
     "symptoms": ["Persistent fatigue", "Occasional headache"],
     "existing_conditions": ["Iron-deficiency anemia", "Migraine"],
     "allergies": ["Sulfa drugs"],
     "medications": [{"n": "Iron supplement 60 mg", "d": "Once daily after food"},
                     {"n": "Paracetamol 500 mg", "d": "As needed"}],
     "emergency_contact": "Rohit Sharma - +91 98110 55667",
     "notes": "Vegetarian diet. Reports irregular sleep.",
     "status": "Active", "risk": "Low", "verified": 1, "last_report": "2026-08-28"},
    {"patient_id": "P-1002", "full_name": "Rahul Verma", "age": 58, "sex": "Male",
     "date_of_birth": "1968-03-12", "phone": "+91 99301 44556",
     "symptoms": ["Increased thirst", "Frequent urination", "Fatigue"],
     "existing_conditions": ["Type 2 Diabetes", "Hypertension", "Hypothyroidism (under review)"],
     "allergies": ["Penicillin (patient-reported)"],
     "medications": [{"n": "Metformin 500 mg", "d": "Twice daily (under review)"},
                     {"n": "Amlodipine 5 mg", "d": "Once daily, morning"},
                     {"n": "Atorvastatin 10 mg", "d": "Once daily, night"}],
     "emergency_contact": "Sunita Verma - +91 99301 77889",
     "notes": "Quit smoking 2020. Family history of diabetes.",
     "status": "Pending Review", "risk": "High", "verified": 0, "last_report": "2026-09-02"},
    {"patient_id": "P-1003", "full_name": "Maria Dsouza", "age": 45, "sex": "Female",
     "date_of_birth": "1981-07-09", "phone": "+91 98200 11223",
     "symptoms": ["Weight gain", "Cold intolerance"],
     "existing_conditions": ["Hypothyroidism", "High cholesterol"],
     "allergies": ["None reported"],
     "medications": [{"n": "Levothyroxine 50 mcg", "d": "Once daily, empty stomach"},
                     {"n": "Rosuvastatin 10 mg", "d": "Once daily, night"}],
     "emergency_contact": "Joseph Dsouza - +91 98200 33445",
     "notes": "Thyroid review due in 6 weeks.",
     "status": "Active", "risk": "Moderate", "verified": 1, "last_report": "2026-09-01"},
    {"patient_id": "P-1004", "full_name": "James Carter", "age": 62, "sex": "Male",
     "date_of_birth": "1964-01-25", "phone": "+1 415-555-0132",
     "symptoms": ["Swelling in ankles", "Reduced appetite"],
     "existing_conditions": ["Chronic Kidney Disease (Stage 2)", "Hypertension"],
     "allergies": ["Latex"],
     "medications": [{"n": "Lisinopril 10 mg", "d": "Once daily"},
                     {"n": "Furosemide 20 mg", "d": "Once daily, morning"}],
     "emergency_contact": "Emily Carter - +1 415-555-0199",
     "notes": "Low-sodium diet advised. Nephrology follow-up pending.",
     "status": "Needs Attention", "risk": "High", "verified": 0, "last_report": "2026-08-30"},
    {"patient_id": "P-1005", "full_name": "Priya Nair", "age": 29, "sex": "Female",
     "date_of_birth": "1997-11-02", "phone": "+91 97450 66778",
     "symptoms": ["No symptoms (annual checkup)"],
     "existing_conditions": ["Vitamin D insufficiency"],
     "allergies": ["None reported"],
     "medications": [{"n": "Vitamin D3 60,000 IU", "d": "Once weekly for 8 weeks"}],
     "emergency_contact": "Arun Nair - +91 97450 99001",
     "notes": "Active lifestyle, regular exercise.",
     "status": "Verified", "risk": "Low", "verified": 1, "last_report": "2026-08-22"},
]

DEMO_REPORTS = [
    ("P-1002", "Thyroid_Sep02_RVerma.pdf", "Thyroid", "2026-09-02", "Pending Review", "Medium", 82),
    ("P-1002", "Prescription_Sep02_RVerma.jpg", "Prescription", "2026-09-02", "Pending Review", "Medium", 82),
    ("P-1002", "HbA1c_Aug10_RVerma.pdf", "HbA1c", "2026-08-10", "Verified", "High", 95),
    ("P-1003", "Lipid_Sep01_MDsouza.pdf", "Lipid Panel", "2026-09-01", "Processed", "High", 95),
    ("P-1001", "CBC_Aug28_ASharma.pdf", "CBC", "2026-08-28", "Processed", "High", 96),
    ("P-1004", "Kidney_Aug30_JCarter.pdf", "Kidney Function", "2026-08-30", "Pending Review", "Medium", 86),
    ("P-1004", "CBC_Sep03_JCarter.pdf", "CBC", "2026-09-03", "Processing", "Medium", 74),
    ("P-1005", "Vitamin_Aug22_PNair.pdf", "Vitamin Panel", "2026-08-22", "Verified", "High", 97),
]

# (test, value, range_key_or_None, date, conf, pct, verified, source)
DEMO_LABS = {
    "P-1001": [
        ("Hemoglobin", 10.8, "Hemoglobin (F)", "2026-08-28", "High", 97, 0),
        ("WBC Count", 6800, "WBC Count", "2026-08-28", "High", 96, 1),
        ("Platelet Count", 262000, "Platelet Count", "2026-08-28", "High", 95, 1),
        ("Glucose (Fasting)", 88, "Glucose (Fasting)", "2026-08-28", "High", 94, 1),
        ("Creatinine", 0.8, "Creatinine", "2026-08-28", "High", 93, 1),
        ("TSH", 2.1, "TSH", "2026-08-28", "Medium", 84, 0),
        ("Vitamin D", 26, "Vitamin D", "2026-08-28", "Medium", 81, 0),
        ("Total Cholesterol", 178, "Total Cholesterol", "2026-08-28", "High", 92, 1),
    ],
    "P-1002": [
        ("Hemoglobin", 13.8, "Hemoglobin", "2026-09-02", "High", 98, 1),
        ("WBC Count", 7200, "WBC Count", "2026-09-02", "High", 96, 1),
        ("Platelet Count", 245000, "Platelet Count", "2026-09-02", "High", 95, 1),
        ("Glucose (Fasting)", 142, "Glucose (Fasting)", "2026-09-02", "High", 97, 0),
        ("Creatinine", 1.1, "Creatinine", "2026-09-02", "High", 93, 1),
        ("TSH", 6.8, "TSH", "2026-09-02", "Medium", 82, 0),
        ("Vitamin D", 18, "Vitamin D", "2026-09-02", "Medium", 80, 0),
        ("Total Cholesterol", 186, "Total Cholesterol", "2026-09-02", "High", 91, 1),
        ("TSH", 4.1, "TSH", "2026-08-10", "High", 93, 1),
    ],
    "P-1003": [
        ("Hemoglobin", 12.9, "Hemoglobin (F)", "2026-09-01", "High", 95, 1),
        ("WBC Count", 5900, "WBC Count", "2026-09-01", "High", 94, 1),
        ("Platelet Count", 228000, "Platelet Count", "2026-09-01", "High", 93, 1),
        ("Glucose (Fasting)", 94, "Glucose (Fasting)", "2026-09-01", "High", 92, 1),
        ("Creatinine", 0.9, "Creatinine", "2026-09-01", "High", 91, 1),
        ("TSH", 5.4, "TSH", "2026-09-01", "High", 94, 0),
        ("Vitamin D", 32, "Vitamin D", "2026-09-01", "Medium", 83, 1),
        ("Total Cholesterol", 224, "Total Cholesterol", "2026-09-01", "High", 93, 0),
    ],
    "P-1004": [
        ("Hemoglobin", 12.4, "Hemoglobin", "2026-08-30", "High", 92, 0),
        ("WBC Count", 8100, "WBC Count", "2026-08-30", "High", 91, 1),
        ("Platelet Count", 198000, "Platelet Count", "2026-08-30", "High", 90, 1),
        ("Glucose (Fasting)", 104, "Glucose (Fasting)", "2026-08-30", "Medium", 84, 0),
        ("Creatinine", 1.6, "Creatinine", "2026-08-30", "High", 95, 0),
        ("Creatinine", 1.3, "Creatinine", "2026-08-02", "High", 90, 1),
        ("TSH", 2.8, "TSH", "2026-08-30", "Medium", 82, 1),
        ("Vitamin D", 24, "Vitamin D", "2026-08-30", "Medium", 80, 0),
        ("Total Cholesterol", 190, "Total Cholesterol", "2026-08-30", "High", 89, 1),
    ],
    "P-1005": [
        ("Hemoglobin", 13.2, "Hemoglobin (F)", "2026-08-22", "High", 97, 1),
        ("WBC Count", 6400, "WBC Count", "2026-08-22", "High", 96, 1),
        ("Platelet Count", 275000, "Platelet Count", "2026-08-22", "High", 95, 1),
        ("Glucose (Fasting)", 86, "Glucose (Fasting)", "2026-08-22", "High", 95, 1),
        ("Creatinine", 0.7, "Creatinine", "2026-08-22", "High", 94, 1),
        ("TSH", 1.9, "TSH", "2026-08-22", "High", 93, 1),
        ("Vitamin D", 22, "Vitamin D", "2026-08-22", "High", 92, 1),
        ("Total Cholesterol", 168, "Total Cholesterol", "2026-08-22", "High", 93, 1),
        ("ESR", 22, None, "2026-08-22", "Medium", 70, 0),
    ],
}

DEMO_CONFLICTS = [
    ("P-1002", "Medication dosage differs across reports",
     "Metformin strength appears differently in two documents dated 3 weeks apart. Confirm the current prescribed strength before verification.",
     "Prescription, 12 Aug 2026: Metformin 500 mg, twice daily",
     "Discharge summary, 02 Sep 2026: Metformin 850 mg, twice daily", "medication", "open"),
    ("P-1002", "Allergy record mismatch",
     "Patient-reported allergy does not match the previous structured record. Confirm with the patient and update the allergy list.",
     "Patient intake, 02 Sep 2026: Allergic to Penicillin (rash)",
     "Previous record, 18 Jun 2026: No known drug allergies", "allergy", "open"),
    ("P-1002", "Same test, different values on close dates",
     "TSH changed from 4.1 to 6.8 within 3 weeks. Both values are extracted correctly from their documents.",
     "Panel 10 Aug 2026: TSH 4.1 (ref 0.4-4.0)",
     "Panel 02 Sep 2026: TSH 6.8 (ref 0.4-4.0)", "lab_value", "open"),
    ("P-1004", "Creatinine trend needs confirmation",
     "Creatinine rose from 1.3 to 1.6 mg/dL. Confirm sample dates and hydration status.",
     "Kidney panel 02 Aug 2026: Creatinine 1.3 mg/dL",
     "Kidney panel 30 Aug 2026: Creatinine 1.6 mg/dL", "lab_value", "open"),
]

DEMO_TIMELINE = [
    ("P-1002", "report_added", "New report added", "Prescription scan linked to record.", "Prescription_Sep02_RVerma.jpg", "report", "Dr. Rao", "2026-09-04T10:20:00"),
    ("P-1002", "extracted", "Lab results extracted", "8 values extracted; 3 flagged against reference ranges.", "Thyroid_Sep02_RVerma.pdf", "report", "MedLens AI", "2026-09-02T14:05:00"),
    ("P-1002", "report_uploaded", "Report uploaded", "Thyroid panel uploaded and queued.", "Thyroid_Sep02_RVerma.pdf", "report", "Front desk", "2026-09-02T13:58:00"),
    ("P-1002", "conflict_detected", "Conflict flagged", "Metformin 500 mg vs 850 mg mismatch detected.", "Cross-report check", "ai", "MedLens AI", "2026-09-01T09:12:00"),
    ("P-1002", "value_verified", "Value verified", "Hemoglobin 13.8 g/dL verified by reviewer.", "Lab table", "input", "Dr. Rao", "2026-08-28T11:40:00"),
    ("P-1002", "record_reviewed", "Record reviewed", "HbA1c report reviewed; no conflicts at that time.", "HbA1c_Aug10_RVerma.pdf", "report", "Dr. Rao", "2026-08-10T16:00:00"),
    ("P-1002", "patient_created", "Patient registered", "Rahul Verma registered via intake form.", "Intake form", "input", "Front desk", "2026-06-18T10:00:00"),
    ("P-1003", "extracted", "Lab results extracted", "Lipid panel extracted; cholesterol flagged High.", "Lipid_Sep01_MDsouza.pdf", "report", "MedLens AI", "2026-09-01T12:30:00"),
    ("P-1004", "extracted", "Lab results extracted", "Kidney panel extracted; creatinine flagged High.", "Kidney_Aug30_JCarter.pdf", "report", "MedLens AI", "2026-08-30T15:10:00"),
    ("P-1001", "record_reviewed", "Record reviewed", "CBC reviewed by clinician.", "CBC_Aug28_ASharma.pdf", "report", "Dr. Rao", "2026-08-28T17:20:00"),
    ("P-1005", "value_verified", "Value verified", "Vitamin D 22 ng/mL verified.", "Lab table", "input", "Dr. Rao", "2026-08-22T10:30:00"),
    ("P-1005", "patient_created", "Patient registered", "Priya Nair registered via intake form.", "Intake form", "input", "Front desk", "2026-08-20T09:00:00"),
]

def seed_demo_data():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) AS c FROM patients")
        if cur.fetchone()["c"] > 0:
            conn.close()
            return False
    except Exception:
        conn.close()
        return False
    ts = now_iso()
    for p in DEMO_PATIENTS:
        cur.execute("""
            INSERT INTO patients (patient_id, full_name, age, sex, date_of_birth, phone,
              symptoms, existing_conditions, allergies, medications, emergency_contact,
              notes, status, risk, verified, last_report, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p["patient_id"], p["full_name"], p["age"], p["sex"], p["date_of_birth"],
              p["phone"], json.dumps(p["symptoms"]), json.dumps(p["existing_conditions"]),
              json.dumps(p["allergies"]), json.dumps(p["medications"]),
              p["emergency_contact"], p["notes"], p["status"], p["risk"],
              p["verified"], p["last_report"], ts, ts))
    report_ids = {}
    for (pid, fname, rtype, date, status, conf, pct) in DEMO_REPORTS:
        cur.execute("""
            INSERT INTO reports (patient_id, filename, original_filename, file_path,
              file_size, file_type, report_type, status, confidence, confidence_pct,
              upload_date, processed_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (pid, fname, fname, "", 1200000, fname.rsplit(".", 1)[-1].lower(),
              rtype, status, conf, pct, date,
              date if status in ("Processed", "Verified") else ""))
        report_ids.setdefault(pid, []).append(cur.lastrowid)
    for pid, labs in DEMO_LABS.items():
        rids = report_ids.get(pid, [None])
        for (test, val, rkey, date, conf, pct, ver) in labs:
            if rkey and rkey in KNOWN_RANGES:
                unit, lo, hi, disp = KNOWN_RANGES[rkey]
            else:
                unit, lo, hi, disp = ("mm/hr" if test == "ESR" else "", None, None, "")
            status = compute_status(val, lo, hi, disp)
            cur.execute("""
                INSERT INTO lab_results (patient_id, report_id, test_name, value, value_text,
                  unit, reference_range, ref_min, ref_max, status, date, source,
                  source_type, confidence, confidence_pct, verified, verified_by,
                  verified_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (pid, rids[0], test, float(val) if isinstance(val, (int, float)) else None,
                  str(val), unit, disp, lo, hi, status, date,
                  "CityCare Diagnostics (fictional)", "report", conf, pct,
                  ver, "Dr. Rao" if ver else "", "2026-08-28T12:00:00" if ver else "",
                  ts, ts))
    for (pid, title, desc, a, b, ctype, st) in DEMO_CONFLICTS:
        cur.execute("""
            INSERT INTO conflicts (patient_id, title, description, source_a, source_b,
              conflict_type, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (pid, title, desc, a, b, ctype, st, ts))
    for (pid, etype, title, desc, src, stype, actor, when) in DEMO_TIMELINE:
        cur.execute("""
            INSERT INTO timeline_events (patient_id, event_type, title, description,
              source, source_type, actor, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (pid, etype, title, desc, src, stype, actor, when))
    conn.commit()
    conn.close()
    return True

# ---------------- Simulated extraction ----------------
def demo_panel_for_patient(patient_id, report_type):
    """Deterministic demo extraction. Ranges below represent the printed
    ranges from the simulated source report (not invented per value)."""
    presets = {
        "P-1001": [("Hemoglobin", 10.8, "Hemoglobin (F)"), ("WBC Count", 6800, "WBC Count"),
                   ("Platelet Count", 262000, "Platelet Count"), ("Glucose (Fasting)", 88, "Glucose (Fasting)"),
                   ("Creatinine", 0.8, "Creatinine"), ("TSH", 2.1, "TSH"),
                   ("Vitamin D", 26, "Vitamin D"), ("Total Cholesterol", 178, "Total Cholesterol")],
        "P-1002": [("Hemoglobin", 13.8, "Hemoglobin"), ("WBC Count", 7200, "WBC Count"),
                   ("Platelet Count", 245000, "Platelet Count"), ("Glucose (Fasting)", 142, "Glucose (Fasting)"),
                   ("Creatinine", 1.1, "Creatinine"), ("TSH", 6.8, "TSH"),
                   ("Vitamin D", 18, "Vitamin D"), ("Total Cholesterol", 186, "Total Cholesterol")],
        "P-1003": [("Hemoglobin", 12.9, "Hemoglobin (F)"), ("WBC Count", 5900, "WBC Count"),
                   ("Platelet Count", 228000, "Platelet Count"), ("Glucose (Fasting)", 94, "Glucose (Fasting)"),
                   ("Creatinine", 0.9, "Creatinine"), ("TSH", 5.4, "TSH"),
                   ("Vitamin D", 32, "Vitamin D"), ("Total Cholesterol", 224, "Total Cholesterol")],
        "P-1004": [("Hemoglobin", 12.4, "Hemoglobin"), ("WBC Count", 8100, "WBC Count"),
                   ("Platelet Count", 198000, "Platelet Count"), ("Glucose (Fasting)", 104, "Glucose (Fasting)"),
                   ("Creatinine", 1.6, "Creatinine"), ("TSH", 2.8, "TSH"),
                   ("Vitamin D", 24, "Vitamin D"), ("Total Cholesterol", 190, "Total Cholesterol")],
    }
    default = [("Hemoglobin", 13.5, "Hemoglobin"), ("WBC Count", 7000, "WBC Count"),
               ("Platelet Count", 250000, "Platelet Count"), ("Glucose (Fasting)", 95, "Glucose (Fasting)"),
               ("Creatinine", 0.9, "Creatinine"), ("TSH", 2.2, "TSH"),
               ("Vitamin D", 30, "Vitamin D"), ("Total Cholesterol", 180, "Total Cholesterol")]
    rows = presets.get(patient_id, default)
    if report_type == "Thyroid":
        rows = [r for r in rows if r[0] in ("TSH", "Hemoglobin", "WBC Count", "Vitamin D")] or rows[:4]
    elif report_type == "Lipid Panel":
        rows = [r for r in rows if r[0] in ("Total Cholesterol", "Hemoglobin", "Glucose (Fasting)", "Creatinine")] or rows[:4]
    elif report_type == "Kidney Function":
        rows = [r for r in rows if r[0] in ("Creatinine", "Hemoglobin", "WBC Count", "Glucose (Fasting)")] or rows[:4]
    elif report_type == "CBC":
        rows = [r for r in rows if r[0] in ("Hemoglobin", "WBC Count", "Platelet Count", "Creatinine")] or rows[:4]
    out = []
    for (test, val, rkey) in rows:
        unit, lo, hi, disp = KNOWN_RANGES[rkey]
        out.append({"test_name": test, "value": val, "unit": unit,
                    "reference_range": disp, "ref_min": lo, "ref_max": hi,
                    "confidence": "High" if test not in ("TSH", "Vitamin D") else "Medium",
                    "confidence_pct": 95 if test not in ("TSH", "Vitamin D") else 82})
    return out

def run_conflict_detection(patient_id):
    """Detect same-test value differences across dates. Never auto-decides
    which value is correct; only flags for human review."""
    rows = query_all(
        "SELECT * FROM lab_results WHERE patient_id = ? ORDER BY test_name, date", (patient_id,))
    by_test = {}
    for r in rows:
        by_test.setdefault(r["test_name"], []).append(dict(r))
    created = []
    for test, items in by_test.items():
        vals = [(i.get("value"), i.get("date"), i.get("id")) for i in items if i.get("value") is not None]
        if len(vals) < 2:
            continue
        first = vals[0][0]
        differs = any(abs(v - first) > 1e-9 for (v, _d, _i) in vals)
        if not differs:
            continue
        existing = query_one(
            "SELECT id FROM conflicts WHERE patient_id = ? AND title LIKE ? AND status IN ('open','reviewed')",
            (patient_id, "%" + test + "%"))
        if existing:
            continue
        lo, hi = vals[0], vals[-1]
        title = "Same test, different values: " + test
        desc = (test + " has different reported values on different dates. "
                "Both values are kept as extracted; a reviewer must confirm context.")
        a = "Earlier entry " + str(lo[1]) + ": " + test + " " + str(lo[0])
        b = "Later entry " + str(hi[1]) + ": " + test + " " + str(hi[0])
        cid = execute_write(
            """INSERT INTO conflicts (patient_id, title, description, source_a, source_b,
               conflict_type, status, created_at) VALUES (?, ?, ?, ?, ?, 'lab_value', 'open', ?)""",
            (patient_id, title, desc, a, b, now_iso()))
        log_event(patient_id, "conflict_detected", "Conflict flagged",
                  title + " (" + str(lo[0]) + " vs " + str(hi[0]) + ")",
                  "Auto cross-check", "ai", "MedLens AI")
        created.append(cid)
    return created

def generate_summary_data(patient_id):
    """Patient-friendly, non-diagnostic summary. No diagnosis, prescription,
    dosage or treatment advice is ever produced."""
    p = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    if not p:
        return None
    labs = [serialize_lab(r) for r in query_all(
        "SELECT * FROM lab_results WHERE patient_id = ? ORDER BY date DESC, id DESC", (patient_id,))]
    seen, latest = set(), []
    for l in labs:
        if l["test_name"] not in seen:
            seen.add(l["test_name"])
            latest.append(l)
    normal = [l for l in latest if l["status"] == "Normal"]
    review = [l for l in latest if l["status"] in ("Low", "High")]
    unknown = [l for l in latest if l["status"] == "Unknown"]
    pd = serialize_patient(p)
    key_obs = [(l["test_name"] + " " + str(l["value"]) + " " + l["unit"] +
                " is within its printed range (" + l["reference_range"] + ").") for l in normal[:4]]
    if not key_obs:
        key_obs = ["No within-range values found in the latest extraction."]
    key_obs.append("Record for " + pd["full_name"] + " links structured values with source tags intact.")
    findings = ["Patient reports: " + s + "." for s in pd["symptoms"][:5]]
    findings.append("Conditions on file: " + ("; ".join(pd["existing_conditions"]) if pd["existing_conditions"] else "none recorded") + ".")
    need_review = [(l["test_name"] + ": " + str(l["value"]) + " " + l["unit"] + " is " +
                    l["status"].lower() + " compared with its printed range " + l["reference_range"] +
                    " - worth discussing with the clinician.") for l in review]
    if unknown:
        need_review.append(str(len(unknown)) + " value(s) have no printed reference range and are marked Unknown - ask the lab or clinician for context.")
    if not need_review:
        need_review = ["No out-of-range values in the latest extraction."]
    gaps = ["Blood pressure and weight are not present in the latest documents.",
            "Bring prior prescriptions to complete medication history.",
            "Confirm allergy list at the next visit."]
    high = sum(1 for l in latest if l["confidence"] == "High")
    med = sum(1 for l in latest if l["confidence"] == "Medium")
    need_ver = sum(1 for l in latest if not l["verified"])
    return {
        "patient_id": patient_id,
        "patient_name": pd["full_name"],
        "key_observations": key_obs,
        "important_findings": findings,
        "values_needing_review": need_review,
        "information_gaps": gaps,
        "confidence": {"high": high, "medium": med, "needs_verification": need_ver,
                       "label": "High confidence" if need_ver == 0 else ("Medium confidence" if need_ver <= 2 else "Needs verification")},
        "disclaimer": DISCLAIMER,
        "generated_at": now_iso(),
        "source_type": "ai",
    }

# ================= PATIENTS =================
@app.route("/api/patients", methods=["GET"])
def api_list_patients():
    try:
        status = request.args.get("status", "").strip()
        risk = request.args.get("risk", "").strip()
        q = request.args.get("q", "").strip().lower()
        sql = "SELECT * FROM patients ORDER BY updated_at DESC, full_name ASC"
        rows = query_all(sql)
        out = []
        for r in rows:
            p = serialize_patient(r)
            if status and p["status"] != status:
                continue
            if risk and p["risk"] != risk:
                continue
            if q and q not in p["full_name"].lower() and q not in p["patient_id"].lower():
                continue
            # attach report counts
            c = query_one("SELECT COUNT(*) AS n FROM reports WHERE patient_id = ?", (p["patient_id"],))
            p["reports"] = c["n"] if c else 0
            p["report_count"] = p["reports"]
            out.append(p)
        return success(out, "Patients retrieved.")
    except Exception:
        return error("SERVER_ERROR", "Could not retrieve patients.", 500)

@app.route("/api/patients", methods=["POST"])
def api_create_patient():
    try:
        data = request.get_json(force=True, silent=True) or {}
        # accept frontend aliases
        if "name" in data and "full_name" not in data:
            data["full_name"] = data["name"]
        if "id" in data and "patient_id" not in data:
            data["patient_id"] = data["id"]
        if "dob" in data and "date_of_birth" not in data:
            data["date_of_birth"] = data["dob"]
        if "conditions" in data and "existing_conditions" not in data:
            data["existing_conditions"] = data["conditions"]
        if "emergency" in data and "emergency_contact" not in data:
            data["emergency_contact"] = data["emergency"]
        if "meds" in data and "medications" not in data:
            data["medications"] = data["meds"]
        errs = validate_patient_input(data)
        if errs:
            return error("VALIDATION_ERROR", "; ".join(errs), 400)
        pid = str(data["patient_id"]).strip()
        if query_one("SELECT patient_id FROM patients WHERE patient_id = ?", (pid,)):
            return error("DUPLICATE_ID", "A patient with this patient_id already exists.", 409)
        ts = now_iso()
        execute_write("""
            INSERT INTO patients (patient_id, full_name, age, sex, date_of_birth, phone,
              symptoms, existing_conditions, allergies, medications, emergency_contact,
              notes, status, risk, verified, last_report, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        """, (pid, str(data["full_name"]).strip(), int(data["age"]), data["sex"],
              str(data.get("date_of_birth", "") or "")[:40], str(data.get("phone", "") or "")[:40],
              json.dumps(normalize_list_field(data.get("symptoms"))),
              json.dumps(normalize_list_field(data.get("existing_conditions"))),
              json.dumps(normalize_list_field(data.get("allergies")) or ["None reported"]),
              json.dumps(normalize_meds(data.get("medications"))),
              str(data.get("emergency_contact", "") or "")[:200],
              str(data.get("notes", "") or "")[:5000],
              str(data.get("status", "Pending Review") or "Pending Review")[:40],
              str(data.get("risk", "Low") or "Low")[:20],
              today_str(), ts, ts))
        actor = request.headers.get("X-Reviewer", "Front desk")[:120]
        log_event(pid, "patient_created", "Patient registered",
                  str(data["full_name"]).strip() + " registered.", "Intake form", "input", actor)
        row = query_one("SELECT * FROM patients WHERE patient_id = ?", (pid,))
        return success(serialize_patient(row), "Patient created.", 201)
    except Exception:
        return error("SERVER_ERROR", "Could not create patient.", 500)

@app.route("/api/patients/<patient_id>", methods=["GET"])
def api_get_patient(patient_id):
    try:
        row = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
        if not row:
            return error("NOT_FOUND", "Patient not found.", 404)
        p = serialize_patient(row)
        c = query_one("SELECT COUNT(*) AS n FROM reports WHERE patient_id = ?", (patient_id,))
        p["reports"] = c["n"] if c else 0
        p["report_count"] = p["reports"]
        return success(p, "Patient retrieved.")
    except Exception:
        return error("SERVER_ERROR", "Could not retrieve patient.", 500)

@app.route("/api/patients/<patient_id>", methods=["PUT"])
def api_update_patient(patient_id):
    try:
        row = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
        if not row:
            return error("NOT_FOUND", "Patient not found.", 404)
        data = request.get_json(force=True, silent=True) or {}
        errs = validate_patient_input(data, is_update=True)
        if errs:
            return error("VALIDATION_ERROR", "; ".join(errs), 400)
        cur = serialize_patient(row)
        full_name = str(data.get("full_name", cur["full_name"])).strip() or cur["full_name"]
        try:
            age = int(data.get("age", cur["age"]))
        except (ValueError, TypeError):
            return error("VALIDATION_ERROR", "age must be a number.", 400)
        sex = data.get("sex", cur["sex"])
        dob = str(data.get("date_of_birth", cur["date_of_birth"]) or "")[:40]
        phone = str(data.get("phone", cur["phone"]) or "")[:40]
        symptoms = normalize_list_field(data.get("symptoms", cur["symptoms"]))
        conditions = normalize_list_field(data.get("existing_conditions", data.get("conditions", cur["existing_conditions"])))
        allergies = normalize_list_field(data.get("allergies", cur["allergies"]))
        meds = normalize_meds(data.get("medications", data.get("meds", cur["medications"])))
        emergency = str(data.get("emergency_contact", data.get("emergency", cur["emergency_contact"])) or "")[:200]
        notes = str(data.get("notes", cur["notes"]) or "")[:5000]
        status = str(data.get("status", cur["status"]) or cur["status"])[:40]
        risk = str(data.get("risk", cur["risk"]) or cur["risk"])[:20]
        if status not in VALID_STATUS or risk not in VALID_RISK:
            return error("VALIDATION_ERROR", "Invalid status or risk value.", 400)
        execute_write("""
            UPDATE patients SET full_name=?, age=?, sex=?, date_of_birth=?, phone=?,
              symptoms=?, existing_conditions=?, allergies=?, medications=?,
              emergency_contact=?, notes=?, status=?, risk=?, updated_at=?
            WHERE patient_id=?
        """, (full_name, age, sex, dob, phone, json.dumps(symptoms), json.dumps(conditions),
              json.dumps(allergies), json.dumps(meds), emergency, notes, status, risk,
              now_iso(), patient_id))
        log_event(patient_id, "patient_updated", "Patient updated",
                  full_name + " record updated.", "Patient form", "input", "Reviewer")
        updated = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
        return success(serialize_patient(updated), "Patient updated.")
    except Exception:
        return error("SERVER_ERROR", "Could not update patient.", 500)

@app.route("/api/patients/<patient_id>", methods=["DELETE"])
def api_delete_patient(patient_id):
    try:
        row = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
        if not row:
            return error("NOT_FOUND", "Patient not found.", 404)
        execute_write("DELETE FROM patients WHERE patient_id = ?", (patient_id,))
        return success({"patient_id": patient_id}, "Patient deleted.")
    except Exception:
        return error("SERVER_ERROR", "Could not delete patient.", 500)

@app.route("/api/labs/<int:lab_id>", methods=["PUT"])
def api_update_lab(lab_id):
    try:
        row = query_one("SELECT * FROM lab_results WHERE id = ?", (lab_id,))
        if not row:
            return error("NOT_FOUND", "Lab result not found.", 404)
        data = request.get_json(force=True, silent=True) or {}
        try:
            value = float(data.get("value"))
        except (TypeError, ValueError):
            return error("VALIDATION_ERROR", "value must be a number.", 400)
        ref_min, ref_max, ref_text = row["ref_min"], row["ref_max"], row["reference_range"]
        status = compute_status(value, ref_min, ref_max, ref_text)
        verified_by = str(data.get("verified_by") or request.headers.get("X-Reviewer", "Reviewer"))[:120]
        execute_write("""UPDATE lab_results SET value=?, value_text=?, status=?, verified=1,
          verified_by=?, verified_at=?, updated_at=? WHERE id=?""",
                      (value, str(value), status, verified_by, now_iso(), now_iso(), lab_id))
        log_event(row["patient_id"], "value_verified", "Lab value updated",
                  row["test_name"] + " updated and verified.", "Lab table", "input", verified_by)
        return success(serialize_lab(query_one("SELECT * FROM lab_results WHERE id = ?", (lab_id,))),
                       "Lab result updated.")
    except Exception:
        return error("SERVER_ERROR", "Could not update lab result.", 500)

@app.route("/api/conflicts/<int:conflict_id>", methods=["PUT"])
def api_resolve_conflict(conflict_id):
    try:
        row = query_one("SELECT * FROM conflicts WHERE id = ?", (conflict_id,))
        if not row:
            return error("NOT_FOUND", "Conflict not found.", 404)
        data = request.get_json(force=True, silent=True) or {}
        resolution = str(data.get("resolution") or "").strip()
        if not resolution:
            return error("VALIDATION_ERROR", "resolution is required.", 400)
        reviewer_name = str(data.get("resolved_by") or request.headers.get("X-Reviewer", "Reviewer"))[:120]
        execute_write("""UPDATE conflicts SET status='resolved', resolution=?, resolved_by=?,
          resolved_at=? WHERE id=?""", (resolution, reviewer_name, now_iso(), conflict_id))
        log_event(row["patient_id"], "conflict_resolved", "Conflict resolved",
                  row["title"] + " resolved.", "Conflict review", "input", reviewer_name)
        return success(serialize_conflict(query_one("SELECT * FROM conflicts WHERE id = ?", (conflict_id,))),
                       "Conflict resolved.")
    except Exception:
        return error("SERVER_ERROR", "Could not resolve conflict.", 500)

# ================= STRUCTURED RECORD =================
@app.route("/api/reports", methods=["GET"])
def api_list_reports():
    try:
        rows = query_all("""
            SELECT reports.*, patients.full_name AS patient_name
            FROM reports LEFT JOIN patients ON patients.patient_id = reports.patient_id
            ORDER BY reports.upload_date DESC, reports.id DESC
        """)
        return success([serialize_report(r) for r in rows], "Reports retrieved.")
    except Exception:
        return error("SERVER_ERROR", "Could not retrieve reports.", 500)

@app.route("/api/patients/<patient_id>/record", methods=["GET"])
def api_structured_record(patient_id):
    try:
        p = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
        if not p:
            return error("NOT_FOUND", "Patient not found.", 404)
        patient = serialize_patient(p)
        labs = [serialize_lab(r) for r in query_all(
            "SELECT * FROM lab_results WHERE patient_id = ? ORDER BY date DESC, id DESC", (patient_id,))]
        reps = [serialize_report(r) for r in query_all(
            "SELECT * FROM reports WHERE patient_id = ? ORDER BY upload_date DESC, id DESC", (patient_id,))]
        confs = [serialize_conflict(r) for r in query_all(
            "SELECT * FROM conflicts WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,))]
        events = [serialize_timeline(r) for r in query_all(
            "SELECT * FROM timeline_events WHERE patient_id = ? ORDER BY created_at DESC LIMIT 50", (patient_id,))]
        summary = generate_summary_data(patient_id)
        verified = sum(1 for l in labs if l["verified"])
        total = len(labs)
        pct = round((verified / total) * 100) if total else 0
        completeness = round(60 + pct * 0.35) if total else 55
        prov = {"input": 2 + len(patient["symptoms"]),
                "report": len(labs) + len(patient["medications"]),
                "ai": 4}
        alerts = [l for l in labs if l["status"] in ("Low", "High")]
        open_confs = [c for c in confs if c["status"] in ("open", "reviewed")]
        data = {
            "patient": patient,
            "patient_information": patient,
            "symptoms": patient["symptoms"],
            "conditions": patient["existing_conditions"],
            "existing_conditions": patient["existing_conditions"],
            "allergies": patient["allergies"],
            "medications": patient["medications"],
            "laboratory_results": labs,
            "lab_results": labs,
            "reports": reps,
            "previous_reports": reps,
            "ai_summary": summary,
            "summary": summary,
            "conflicts": confs,
            "timeline": events,
            "timeline_events": events,
            "verification": {"verified": verified, "total": total, "percent": pct,
                             "label": "Verified by reviewer" if total and verified == total else "Needs verification"},
            "verification_status": "Verified by reviewer" if total and verified == total else "Needs verification",
            "provenance": prov,
            "source_provenance": prov,
            "completeness": completeness,
            "alerts": {"out_of_range": len(alerts), "open_conflicts": len(open_confs),
                       "total": len(alerts) + len(open_confs)},
        }
        return success(data, "Structured record retrieved.")
    except Exception:
        return error("SERVER_ERROR", "Could not build structured record.", 500)

# ================= AI SUMMARY =================
@app.route("/api/patients/<patient_id>/summary", methods=["GET", "POST"])
def api_summary(patient_id):
    try:
        if not query_one("SELECT patient_id FROM patients WHERE patient_id = ?", (patient_id,)):
            return error("NOT_FOUND", "Patient not found.", 404)
        data = generate_summary_data(patient_id)
        log_event(patient_id, "summary_generated", "Summary generated",
                  "Patient-friendly summary generated.", "AI summary", "ai", "MedLens AI")
        return success(data, "Summary generated.")
    except Exception:
        return error("SERVER_ERROR", "Could not generate summary.", 500)

# ================= DASHBOARD =================
@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    try:
        tp = query_one("SELECT COUNT(*) AS n FROM patients")["n"]
        rp = query_one("SELECT COUNT(*) AS n FROM reports WHERE status IN ('Processed','Verified')")["n"]
        pend = query_one("SELECT COUNT(*) AS n FROM reports WHERE status IN ('Uploaded','Processing','Pending Review')")["n"]
        unverified = query_one("SELECT COUNT(*) AS n FROM lab_results WHERE verified = 0")["n"]
        open_c = query_one("SELECT COUNT(*) AS n FROM conflicts WHERE status IN ('open','reviewed')")["n"]
        oor = query_one("SELECT COUNT(*) AS n FROM lab_results WHERE status IN ('Low','High')")["n"]
        ver_labs = query_one("SELECT COUNT(*) AS n FROM lab_results WHERE verified = 1")["n"]
        ver_pat = query_one("SELECT COUNT(*) AS n FROM patients WHERE verified = 1")["n"]
        data = {
            "total_patients": tp,
            "reports_processed": rp,
            "pending_review": pend,
            "alerts_detected": open_c + oor,
            "verified_records": ver_labs,
            "verified_patients": ver_pat,
            "open_conflicts": open_c,
            "out_of_range": oor,
            "unverified_values": unverified,
            "total_reports": query_one("SELECT COUNT(*) AS n FROM reports")["n"],
            "total_labs": query_one("SELECT COUNT(*) AS n FROM lab_results")["n"],
        }
        return success(data, "Dashboard statistics.")
    except Exception:
        return error("SERVER_ERROR", "Could not load dashboard.", 500)

# ================= SEARCH =================
@app.route("/api/search", methods=["GET"])
def api_search():
    try:
        q = (request.args.get("q", "") or "").strip().lower()
        if not q:
            return success({"patients": [], "reports": [], "labs": [], "query": ""}, "Empty query.")
        pats = []
        for r in query_all("SELECT * FROM patients"):
            p = serialize_patient(r)
            hay = " ".join([p["full_name"], p["patient_id"], " ".join(p["symptoms"]),
                            " ".join(p["existing_conditions"]), " ".join(
                                a if isinstance(a, str) else str(a) for a in p["allergies"])]).lower()
            if q in hay:
                pats.append(p)
        reps = []
        for r in query_all("SELECT * FROM reports"):
            s = serialize_report(r)
            hay = " ".join([s["filename"], s["report_type"], s["patient_id"], str(s["id"])]).lower()
            prow = query_one("SELECT full_name FROM patients WHERE patient_id = ?", (s["patient_id"],))
            if prow:
                s["patient_name"] = prow["full_name"]
                hay += " " + prow["full_name"].lower()
            if q in hay:
                reps.append(s)
        labs = []
        for r in query_all("SELECT * FROM lab_results"):
            s = serialize_lab(r)
            if q in s["test_name"].lower() or q in s["patient_id"].lower() or q in (s["status"] or "").lower():
                labs.append(s)
        return success({"patients": pats[:30], "reports": reps[:30], "labs": labs[:50],
                        "lab_results": labs[:50], "query": q,
                        "counts": {"patients": len(pats), "reports": len(reps), "labs": len(labs)}},
                       "Search completed.")
    except Exception:
        return error("SERVER_ERROR", "Search failed.", 500)

# ================= TIMELINE =================
@app.route("/api/timeline", methods=["GET"])
def api_timeline():
    try:
        pid = request.args.get("patient_id", "").strip()
        try:
            limit = min(max(int(request.args.get("limit", 100)), 1), 500)
        except (ValueError, TypeError):
            limit = 100
        if pid:
            rows = query_all("SELECT * FROM timeline_events WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?",
                             (pid, limit))
        else:
            rows = query_all("SELECT * FROM timeline_events ORDER BY created_at DESC LIMIT ?", (limit,))
        out = [serialize_timeline(r) for r in rows]
        for e in out:
            prow = query_one("SELECT full_name FROM patients WHERE patient_id = ?", (e["patient_id"],))
            e["patient_name"] = prow["full_name"] if prow else e["patient_id"]
        return success(out, "Timeline retrieved.")
    except Exception:
        return error("SERVER_ERROR", "Could not retrieve timeline.", 500)

@app.route("/api/health", methods=["GET"])
def api_health():
    return success({"status": "ok"}, "Backend is running.")

@app.route("/api/reports", methods=["POST"])
def api_upload_report():
    try:
        patient_id = (request.form.get("patient_id") or "").strip()
        patient = query_one("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
        if not patient:
            return error("NOT_FOUND", "Patient not found.", 404)
        uploaded = request.files.get("file")
        if uploaded is None or not uploaded.filename:
            return error("VALIDATION_ERROR", "A report file is required.", 400)
        if not allowed_file(uploaded.filename):
            return error("VALIDATION_ERROR", "Use a PDF, JPG, JPEG, or PNG file.", 400)
        safe_name = secure_filename(uploaded.filename)
        if not safe_name:
            return error("VALIDATION_ERROR", "The selected filename is invalid.", 400)
        stored_name = today_str() + "_" + safe_name
        path = Path(app.config["UPLOAD_FOLDER"]) / stored_name
        uploaded.save(path)
        file_size = path.stat().st_size
        report_type = (request.form.get("report_type") or "General").strip()[:80]
        report_id = execute_write(
            """INSERT INTO reports (patient_id, filename, original_filename, file_path,
               file_size, file_type, report_type, status, confidence, confidence_pct,
               upload_date, processed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (patient_id, stored_name, uploaded.filename[:255], str(path), file_size,
             safe_name.rsplit(".", 1)[-1].lower(), report_type, "Processed", "Medium", 85,
             today_str(), today_str()))
        extracted = demo_panel_for_patient(patient_id, report_type)
        ts = now_iso()
        for item in extracted:
            execute_write(
                """INSERT INTO lab_results (patient_id, report_id, test_name, value, value_text,
                   unit, reference_range, ref_min, ref_max, status, date, source, source_type,
                   confidence, confidence_pct, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'report', ?, ?, ?, ?)""",
                (patient_id, report_id, item["test_name"], item["value"], str(item["value"]),
                 item["unit"], item["reference_range"], item["ref_min"], item["ref_max"],
                 compute_status(item["value"], item["ref_min"], item["ref_max"], item["reference_range"]),
                 today_str(), uploaded.filename[:300], item["confidence"], item["confidence_pct"], ts, ts))
        execute_write("UPDATE patients SET last_report = ?, updated_at = ? WHERE patient_id = ?",
                      (today_str(), ts, patient_id))
        log_event(patient_id, "report_uploaded", "Report uploaded",
                  uploaded.filename + " uploaded and processed.", uploaded.filename, "report", "Reviewer")
        run_conflict_detection(patient_id)
        report = query_one("SELECT * FROM reports WHERE id = ?", (report_id,))
        return success({"report": serialize_report(report), "extracted": extracted},
                       "Report uploaded and processed.", 201)
    except Exception:
        return error("SERVER_ERROR", "Could not upload the report.", 500)

@app.route("/", methods=["GET"])
def serve_frontend():
    return send_from_directory(str(BASE_DIR), "index.html")

@app.route("/<path:filename>", methods=["GET"])
def serve_static(filename):
    if filename.startswith("api/"):
        return error("NOT_FOUND", "Endpoint not found.", 404)
    return send_from_directory(str(BASE_DIR), filename)

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
