"""
routers/ai_assistant.py
=======================
SmartHealthcare AI Assistant - Demo Mode

This version does not call Claude API.
Use this when Anthropic credits are low.
Later we can reconnect Claude after adding credits.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models import Patient, Admin
from dependencies import get_current_patient, get_current_admin

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class PatientAIRequest(BaseModel):
    question: str
    context: Optional[str] = None


class AIResponse(BaseModel):
    answer: str
    disclaimer: str
    source: str = "SmartHealthcare Demo AI"


def build_patient_answer(question: str, patient_name: str, city: str) -> str:
    q = question.lower()

    emergency_keywords = [
        "chest pain",
        "breathing difficulty",
        "shortness of breath",
        "unconscious",
        "severe bleeding",
        "stroke",
        "seizure",
        "suicide",
        "severe allergy",
    ]

    if any(word in q for word in emergency_keywords):
        return f"""Hi {patient_name},

Your symptoms may need urgent medical attention.

Please do this immediately:
- Visit the nearest emergency department.
- Call emergency support if symptoms are severe.
- Do not wait for online guidance in emergency situations.
- Carry your ID and any previous medical records.

SmartHealthcare can support appointment booking, but emergency symptoms should be treated immediately at the hospital."""

    if "fever" in q or "headache" in q or "cold" in q or "cough" in q:
        return f"""Hi {patient_name},

I understand you are not feeling well. Fever and headache can happen due to common infection, dehydration, stress, lack of sleep, or other causes.

Suggested next steps:
- Take proper rest.
- Drink enough water.
- Monitor your temperature.
- Avoid self-medicating without doctor advice.
- Book a doctor consultation if fever continues, headache becomes severe, or symptoms worsen.
- Visit emergency care if you have chest pain, breathing difficulty, confusion, severe weakness, or very high fever.

You can book an appointment through SmartHealthcare {city} branch for a smooth and safe consultation."""

    if "stomach" in q or "vomit" in q or "diarrhea" in q or "abdominal" in q:
        return f"""Hi {patient_name},

Stomach discomfort can happen due to food, infection, acidity, dehydration, or other reasons.

Suggested next steps:
- Drink fluids slowly and stay hydrated.
- Avoid oily or spicy food for now.
- Do not take medicines without doctor advice.
- Consult a doctor if pain is severe, vomiting continues, blood appears, or you feel very weak.

SmartHealthcare can help you book a suitable doctor appointment quickly."""

    return f"""Hi {patient_name},

Thank you for sharing your concern. I can provide general health guidance only.

Recommended next steps:
- Note your symptoms and how long they have been present.
- Avoid self-diagnosis.
- Do not take unnecessary medication without doctor advice.
- Book a consultation with a qualified doctor for proper diagnosis.
- Seek urgent care if symptoms become severe or sudden.

SmartHealthcare is designed to make your hospital visit smoother, safer, and easier from appointment booking to consultation."""


def build_admin_insight(role: str, city: str) -> str:
    if role == "SUPER_ADMIN":
        return """AI Executive Insight:

The Tamil Nadu SmartHealthcare network appears stable for daily operations.

Key observations:
- Major city branches may have higher appointment demand.
- Doctor availability should be monitored during peak morning hours.
- City Admin activity helps identify branch-level response quality.
- Emergency contact visibility improves leadership-level decision support.

Recommendation:
Use Super Admin analytics to monitor branch-wise appointments, doctor workload, department demand, and city admin activity before planning extra doctor slots."""

    return f"""AI City Admin Insight:

{city} branch operations are ready for daily monitoring.

Key observations:
- Track appointment queue and doctor availability.
- Watch high-demand departments during morning hours.
- Keep support number and emergency contact visible.
- Review pending and completed appointments regularly.

Recommendation:
Coordinate with available doctors to reduce waiting time and improve patient experience."""


@router.post("/patient", response_model=AIResponse)
def patient_health_assistant(
    request: PatientAIRequest,
    current_patient: Patient = Depends(get_current_patient),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    first_name = getattr(current_patient, "first_name", "") or ""
    last_name = getattr(current_patient, "last_name", "") or ""
    patient_name = f"{first_name} {last_name}".strip() or "Patient"
    city = getattr(current_patient, "city", None) or "your city"

    return AIResponse(
        answer=build_patient_answer(request.question, patient_name, city),
        disclaimer="This is general health guidance only. Please consult a qualified doctor for diagnosis or treatment. For emergencies, seek immediate medical care.",
        source="SmartHealthcare Demo AI",
    )


@router.post("/admin-insight", response_model=AIResponse)
def admin_ai_insight(
    current_admin: Admin = Depends(get_current_admin),
):
    role = getattr(current_admin, "_token_role", "ADMIN")
    city = getattr(current_admin, "city", None) or "Tamil Nadu"

    return AIResponse(
        answer=build_admin_insight(role, city),
        disclaimer="This is an AI-generated demo operational insight. Verify with actual hospital data before taking action.",
        source="SmartHealthcare Demo AI",
    )
