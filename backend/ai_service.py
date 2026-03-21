"""
AI analysis service — uses Claude Opus 4.6 with adaptive thinking to analyse
patient history against a current complaint and return structured triage output.
"""
import json
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are an expert clinical decision-support AI embedded in a hospital triage system.
Your role is to analyse a patient's complete medical history in the context of their current presenting complaint
and produce a structured assessment that helps triage staff act quickly and accurately.

You must respond ONLY with a valid JSON object — no prose, no markdown fences — matching this exact schema:

{
  "summary": "<2-3 sentence plain-English overview a triage nurse can read in 10 seconds>",
  "relevant_history_summary": "<paragraph highlighting the history most directly relevant to the current complaint>",
  "risk_factors": [
    {
      "risk": "<risk name>",
      "explanation": "<why this is a risk given the history + complaint>",
      "timeframe": "short-term | long-term"
    }
  ],
  "specialist_recommendation": [
    {
      "specialty": "<specialty name>",
      "reason": "<why this specialist is needed>",
      "priority": "urgent | routine | elective"
    }
  ],
  "urgency_level": "low | medium | high | critical",
  "reasoning": "<detailed clinical reasoning paragraph explaining the urgency level and all recommendations>"
}

Guidelines:
- Urgency levels: critical = life-threatening/immediate, high = serious/same-day, medium = soon/within hours, low = non-urgent
- Highlight flagged lab results, drug interactions, contraindications, or history that changes risk
- Always consider age, chronic conditions, and current medications when assessing risk
- Be specific: name the exact conditions, medications, and values that drive your assessment
- If family history is relevant to the current complaint, call it out explicitly
"""


def _build_patient_context(patient: dict, history: dict) -> str:
    """Format all patient data into a readable context block for the AI."""
    lines = [
        "=== PATIENT DEMOGRAPHICS ===",
        f"Name: {patient['full_name']}",
        f"Age: {patient['age']} | Gender: {patient['gender']} | Blood Type: {patient.get('blood_type', 'Unknown')}",
        f"Health Number: {patient['health_number']}",
        "",
    ]

    # Conditions
    conditions = history.get("conditions", [])
    if conditions:
        lines.append("=== MEDICAL CONDITIONS ===")
        for c in conditions:
            status_tag = f"[{c['status'].upper()}]" if c.get("status") else ""
            sev_tag = f"[{c['severity'].upper()}]" if c.get("severity") else ""
            icd = f" ({c['icd_code']})" if c.get("icd_code") else ""
            dx_date = f" — diagnosed {c['diagnosed_date']}" if c.get("diagnosed_date") else ""
            lines.append(f"  • {c['condition_name']}{icd} {status_tag} {sev_tag}{dx_date}")
            if c.get("notes"):
                lines.append(f"    Notes: {c['notes']}")
        lines.append("")

    # Medications
    medications = history.get("medications", [])
    active_meds = [m for m in medications if m.get("active")]
    inactive_meds = [m for m in medications if not m.get("active")]
    if active_meds:
        lines.append("=== CURRENT MEDICATIONS ===")
        for m in active_meds:
            dosage = f" {m['dosage']}" if m.get("dosage") else ""
            freq = f" ({m['frequency']})" if m.get("frequency") else ""
            lines.append(f"  • {m['name']}{dosage}{freq}")
        lines.append("")
    if inactive_meds:
        lines.append("=== PAST MEDICATIONS ===")
        for m in inactive_meds:
            lines.append(f"  • {m['name']} (discontinued)")
        lines.append("")

    # Allergies
    allergies = history.get("allergies", [])
    if allergies:
        lines.append("=== ALLERGIES ===")
        for a in allergies:
            reaction = f" → {a['reaction']}" if a.get("reaction") else ""
            sev = f" [{a['severity'].upper()}]" if a.get("severity") else ""
            lines.append(f"  • {a['allergen']}{reaction}{sev}")
        lines.append("")

    # Lab Results — flagged first
    labs = history.get("labs", [])
    if labs:
        flagged = [l for l in labs if l.get("flagged")]
        normal = [l for l in labs if not l.get("flagged")]
        lines.append("=== LAB RESULTS ===")
        if flagged:
            lines.append("  ** FLAGGED **")
            for l in flagged:
                ref = f" (normal: {l['normal_range']})" if l.get("normal_range") else ""
                unit = f" {l['unit']}" if l.get("unit") else ""
                date = f" [{l['test_date']}]" if l.get("test_date") else ""
                lines.append(f"  ⚠ {l['test_name']}: {l['result']}{unit}{ref}{date}")
                if l.get("notes"):
                    lines.append(f"    {l['notes']}")
        for l in normal:
            ref = f" (normal: {l['normal_range']})" if l.get("normal_range") else ""
            unit = f" {l['unit']}" if l.get("unit") else ""
            date = f" [{l['test_date']}]" if l.get("test_date") else ""
            lines.append(f"  • {l['test_name']}: {l['result']}{unit}{ref}{date}")
        lines.append("")

    # Recent visits (last 5)
    visits = history.get("visits", [])
    if visits:
        lines.append("=== VISIT HISTORY (most recent) ===")
        for v in visits[:5]:
            date = v.get("visit_date", "unknown date")
            complaint = v.get("chief_complaint", "")
            diagnosis = v.get("diagnosis", "")
            dept = f" [{v['department']}]" if v.get("department") else ""
            lines.append(f"  • {date}{dept}: {complaint}")
            if diagnosis:
                lines.append(f"    Dx: {diagnosis}")
            if v.get("discharge_summary"):
                lines.append(f"    Discharge: {v['discharge_summary']}")
        lines.append("")

    # Family History
    family = history.get("family_history", [])
    if family:
        lines.append("=== FAMILY HISTORY ===")
        for f in family:
            notes = f" ({f['notes']})" if f.get("notes") else ""
            lines.append(f"  • {f['relation']}: {f['condition']}{notes}")
        lines.append("")

    return "\n".join(lines)


async def analyze_patient_history(patient: dict, history: dict, current_complaint: str) -> dict:
    """
    Run AI analysis on patient history against the current complaint.
    Uses Claude Opus 4.6 with adaptive thinking and streaming.
    Returns a parsed dict matching the AnalysisOut schema.
    """
    patient_context = _build_patient_context(patient, history)

    user_message = f"""{patient_context}
=== CURRENT PRESENTING COMPLAINT ===
{current_complaint}

Please analyse this patient's history in the context of the current complaint and return your structured assessment."""

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        final = stream.get_final_message()

    # Extract the text block (thinking blocks are separate)
    raw_text = next(
        (block.text for block in final.content if block.type == "text"),
        None,
    )
    if not raw_text:
        raise ValueError("AI returned no text content")

    # Strip any accidental markdown fences
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {e}\nRaw: {raw_text[:500]}")

    # Normalise risk_factors and specialist_recommendation to lists
    if not isinstance(parsed.get("risk_factors"), list):
        parsed["risk_factors"] = []
    if not isinstance(parsed.get("specialist_recommendation"), list):
        parsed["specialist_recommendation"] = []

    return parsed
