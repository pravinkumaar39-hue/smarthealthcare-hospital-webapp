from typing import Union
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Admin, Branch
from schemas import (
    PatientLoginRequest,
    AdminLoginRequest,
    OTPLoginRequest,
    OTPRegisterRequest,
    Token,
    PatientRegisterRequest,
    PatientOut,
    CurrentUserOut,
    ChangePasswordRequest,
)
from auth import (
    authenticate_patient,
    authenticate_admin,
    build_patient_token,
    build_admin_token,
)
from dependencies import get_current_user, get_current_patient

router = APIRouter(prefix="/auth", tags=["Authentication"])


def normalize_admin_role(role: str) -> str:
    role_map = {
        "SuperAdmin": "SUPER_ADMIN",
        "StateAdmin": "STATE_ADMIN",
        "CityAdmin": "CITY_ADMIN",
    }
    return role_map.get(role, role)


def only_digits(value: str) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def normalize_phone(phone: str) -> str:
    digits = only_digits(phone)

    if digits.startswith("91") and len(digits) > 10:
        digits = digits[-10:]

    return digits


def patient_full_name(patient: Patient) -> str:
    return f"{patient.first_name or ''} {patient.last_name or ''}".strip()


def find_patient_by_phone(db: Session, phone: str):
    input_phone = normalize_phone(phone)

    for patient in db.query(Patient).all():
        db_phone = normalize_phone(patient.phone)
        if db_phone and db_phone.endswith(input_phone):
            return patient

    return None


def generate_patient_id(db: Session) -> str:
    count = db.query(Patient).count() + 1

    while True:
        new_id = f"PTN{count:09d}"

        existing = (
            db.query(Patient)
            .filter(Patient.patient_id == new_id)
            .first()
        )

        if not existing:
            return new_id

        count += 1


@router.post("/login/patient", response_model=Token)
def login_patient(payload: PatientLoginRequest, db: Session = Depends(get_db)):
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
        name=patient_full_name(patient),
        must_change_password=False,
    )


@router.post("/login/otp", response_model=Token)
def login_with_otp(payload: OTPLoginRequest, db: Session = Depends(get_db)):
    otp = payload.otp.strip()

    if not otp.isdigit() or len(otp) != 6:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP.",
        )

    patient = find_patient_by_phone(db, payload.phone)

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient found with this mobile number. Please register first.",
        )

    token = build_patient_token(patient)

    return Token(
        access_token=token,
        role="PATIENT",
        user_id=patient.patient_id,
        name=patient_full_name(patient),
        must_change_password=False,
    )


@router.post("/register-with-otp", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_with_otp(payload: OTPRegisterRequest, db: Session = Depends(get_db)):
    otp = payload.otp.strip()

    if not otp.isdigit() or len(otp) != 6:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP.",
        )

    normalized_phone = normalize_phone(payload.phone)

    existing_patient = find_patient_by_phone(db, normalized_phone)

    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already registered. Please login instead.",
        )

    branch = db.query(Branch).filter(Branch.city == payload.city).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No hospital branch found for city '{payload.city}'.",
        )

    new_patient = Patient(
        patient_id=generate_patient_id(db),
        first_name=payload.first_name,
        last_name=payload.last_name,
        gender=payload.gender,
        dob=payload.dob,
        blood_group=payload.blood_group,
        phone=normalized_phone,
        email=payload.email,
        address=payload.address,
        locality=payload.locality,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        registered_on=date.today(),
        home_branch_id=branch.branch_id,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    token = build_patient_token(new_patient)

    return Token(
        access_token=token,
        role="PATIENT",
        user_id=new_patient.patient_id,
        name=patient_full_name(new_patient),
        must_change_password=False,
    )


@router.post("/login/admin", response_model=Token)
def login_admin(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, payload.username, payload.password)

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = build_admin_token(admin)

    return Token(
        access_token=token,
        role=normalize_admin_role(admin.role),
        user_id=admin.admin_id,
        name=admin.name,
        must_change_password=False,
    )


@router.post("/register", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientRegisterRequest, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.city == payload.city).first()

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No hospital branch found for city '{payload.city}'.",
        )

    if payload.phone and find_patient_by_phone(db, payload.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this phone number is already registered.",
        )

    if payload.email and db.query(Patient).filter(Patient.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this email is already registered.",
        )

    new_patient = Patient(
        patient_id=generate_patient_id(db),
        first_name=payload.first_name,
        last_name=payload.last_name,
        gender=payload.gender,
        dob=payload.dob,
        blood_group=payload.blood_group,
        phone=normalize_phone(payload.phone) if payload.phone else None,
        email=payload.email,
        address=payload.address,
        locality=payload.locality,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        registered_on=date.today(),
        home_branch_id=branch.branch_id,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.get("/me", response_model=CurrentUserOut)
def get_me(current_user: Union[Patient, Admin] = Depends(get_current_user)):
    if isinstance(current_user, Patient):
        return CurrentUserOut(
            user_id=current_user.patient_id,
            role="PATIENT",
            name=patient_full_name(current_user),
            city=current_user.city,
            branch_id=current_user.home_branch_id,
            must_change_password=False,
        )

    return CurrentUserOut(
        user_id=current_user.admin_id,
        role=normalize_admin_role(current_user.role),
        name=current_user.name,
        city=current_user.city,
        branch_id=current_user.branch_id,
        must_change_password=False,
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_patient: Patient = Depends(get_current_patient),
):
    return {
        "message": "Password change is disabled in demo mode. Default password is Patient ID."
    }