"""
routers/patients.py
====================
Patient resource API:
    - GET /patients/me              -> Patient's own profile (PATIENT role)
    - GET /patients/{patient_id}    -> Lookup a patient by ID (admin only)
    - GET /patients/                -> List patients, RBAC-scoped by city/state
"""
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Admin, AdminRoleEnum
from schemas import PatientOut
from dependencies import (
    get_current_patient, get_current_admin, ensure_city_scope,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


# =========================================================
# CURRENT PATIENT PROFILE
# =========================================================
@router.get("/me", response_model=PatientOut)
def get_my_profile(current_patient: Patient = Depends(get_current_patient)):
    """Return the profile of the currently logged-in patient."""
    return current_patient


# =========================================================
# LIST PATIENTS (ADMIN ONLY, RBAC-SCOPED)
# =========================================================
@router.get("/", response_model=List[PatientOut])
def list_patients(
    city: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    List patients.

    RBAC scoping:
        - SUPER_ADMIN / STATE_ADMIN: can view all patients, optionally
          filtered by `city`.
        - CITY_ADMIN: restricted to their own city only. If `city` is
          provided and differs from the admin's city, returns 403.
    """
    query = db.query(Patient)

    if current_admin.role == AdminRoleEnum.CITY_ADMIN:
        target_city = city or current_admin.city
        ensure_city_scope(current_admin, target_city)
        query = query.filter(Patient.city == current_admin.city)
    elif city:
        query = query.filter(Patient.city == city)

    patients = query.offset(skip).limit(min(limit, 200)).all()
    return patients


# =========================================================
# GET PATIENT BY ID (ADMIN ONLY, RBAC-SCOPED)
# =========================================================
@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Fetch a single patient by Patient ID (admin only, city-scoped for CITY_ADMIN)."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    if current_admin.role == AdminRoleEnum.CITY_ADMIN:
        ensure_city_scope(current_admin, patient.city)

    return patient
