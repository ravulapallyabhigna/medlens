# MedLens

MedLens turns medical reports into a clear, reviewable patient record. It keeps patient details, extracted lab results, reference ranges, conflicts, and review history together in one workspace.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000/.

## Demo flow

1. Add a patient from **Patients**.
2. Upload a PDF, JPG, or PNG report.
3. Choose the report type when uploading.
4. Review the AI-organized results and reference ranges.
5. Verify or edit a result, resolve a conflict, then reload to see the saved review state.
6. Use **Compare Reports** after uploading two reports for the same patient.

## What is simulated

Report processing is local and deterministic for the prototype. No external AI service is called. The interface makes extracted values traceable and keeps a human reviewer in control.

## Safety

MedLens helps organize medical information. It does not replace advice, diagnosis, or treatment from a qualified healthcare professional. Do not use this prototype with real patient data.

## Stack

- Flask and SQLite backend
- Vanilla HTML, CSS, and JavaScript frontend
- Local report storage in `uploads/`
