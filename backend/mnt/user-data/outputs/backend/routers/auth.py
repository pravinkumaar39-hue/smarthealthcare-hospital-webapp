"""
routers/auth.py
================
Authentication API:
    - POST /auth/login/patient   -> Patient ID + Password login
    - POST /auth/login/admin     -> Admin Username + Password login
    - POST /auth/register        -> New patient registration (auto-generates PTN ID)
    - GET  /auth/me               -> Get current authenticated user
    - POST /auth/change-password -> Change password (forced on first login)
"""
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Patient, Admin, Branch, AdminRoleEnum
from schemas import (
    PatientLoginRequest, AdminLoginRequest, Token,
    PatientRegisterRequest, PatientOut, CurrentUserOut,
    ChangePasswordRequest,
)
from security import hash_password, verify_password
from auth import (
    authenticate_patient, authenticate_admin,
    build_patient_token, build_admin_token,
)
from dependencies import get_current_user, get_current_patient

router = APIRouter(prefix="/auth", tags=["Authentication"])


# =========================================================
# PATIENT LOGIN
# =========================================================
@router.post("/login/patient", response_model=Token)
def login_patient(payload: PatientLoginRequest, db: Session = Depends(get_db)):
    """
    Login with Patient ID + Password.

    Default password for new patients = Patient ID (e.g. PTN0001 / PTN0001).
    The response includes `must_change_password` so the frontend can
    redirect to a forced password-change screen on first login.
    """
    patient = authenticate_patient(db, payload.patient_id, payload.password)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Patient ID or password.",
        )

    token = build_patient_token(patient)
    return Token(
        access_token=token,
        role="PATIENT",
        user_id=patient.patient_id,
        name=patient.name,
        must_change_password=patient.must_change_password,
    )


# =========================================================
# ADMIN LOGIN
# =========================================================
@router.post("/login/admin", response_model=Token)
def login_admin(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Login with Admin Username + Password.

    Covers all three admin tiers (single `admins` table):
        - SUPER_ADMIN  e.g. admin / admin123
        - STATE_ADMIN  e.g. SATN1 / SATN1@123
        - CITY_ADMIN   e.g. ADTNC1 / ADTNC1@123
    """
    admin = authenticate_admin(db, payload.username, payload.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = build_admin_token(admin)
    return Token(
        access_token=token,
        role=admin.role.value,
        user_id=admin.username,
        name=admin.username,
    )


# =========================================================
# PATIENT REGISTRATION
# =========================================================
@router.post("/register", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new patient.

    - Auto-generates the next sequential Patient ID (PTN0001, PTN0002, ...)
      based on the highest existing numeric suffix in the `patients` table.
    - Assigns the patient to the hospital branch matching their chosen city.
    - Default password = generated Patient ID (must be changed on first login).
    """
    # Resolve branch from city
    branch = db.query(Branch).filter(Branch.city == payload.city).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No hospital branch found for city '{payload.city}'. "
                   f"Supported cities: Chennai, Trichy, Madurai, Coimbatore, "
                   f"Thanjavur, Salem, Tirunelveli, Erode, Vellore, Hosur.",
        )

    # Uniqueness checks
    if db.query(Patient).filter(Patient.phone == payload.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this phone number is already registered.",
        )
    if payload.email and db.query(Patient).filter(Patient.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this email is already registered.",
        )

    # Generate next Patient ID: PTN0001, PTN0002, ...
    last_patient = (
        db.query(Patient)
        .filter(Patient.patient_id.like("PTN%"))
        .order_by(Patient.patient_id.desc())
        .first()
    )
    if last_patient:
        last_number = int(last_patient.patient_id.replace("PTN", ""))
    else:
        last_number = 0
    new_patient_id = f"PTN{last_number + 1:04d}"

    # Default password = Patient ID (hashed); must change on first login
    new_patient = Patient(
        patient_id=new_patient_id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        blood_group=payload.blood_group,
        state=payload.state,
        city=payload.city,
        branch_id=branch.branch_id,
        password_hash=hash_password(new_patient_id),
        must_change_password=True,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


# =========================================================
# GET CURRENT USER
# =========================================================
@router.get("/me", response_model=CurrentUserOut)
def get_me(current_user: Union[Patient, Admin] = Depends(get_current_user)):
    """
    Return profile/role information for the currently authenticated user
    (Patient or any Admin tier), based on the JWT bearer token.
    """
    role = getattr(current_user, "_token_role")

    if isinstance(current_user, Patient):
        return CurrentUserOut(
            user_id=current_user.patient_id,
            role=role,
            name=current_user.name,
            city=current_user.city,
            branch_id=current_user.branch_id,
            must_change_password=current_user.must_change_password,
        )

    # Admin (any tier)
    return CurrentUserOut(
        user_id=current_user.username,
        role=role,
        name=current_user.username,
        state=current_user.state,
        city=current_user.city,
        branch_id=current_user.branch_id,
    )


# =========================================================
# CHANGE PASSWORD (Patients - forced on first login)
# =========================================================
@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Change the current patient's password.

    Verifies the old password, then updates to the new password and
    clears `must_change_password`. Intended to be called immediately
    after first login (where old password == Patient ID).
    """
    if not verify_password(payload.old_password, current_patient.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect.",
        )

    current_patient.password_hash = hash_password(payload.new_password)
    current_patient.must_change_password = False
    db.commit()

    return {"message": "Password updated successfully."}
