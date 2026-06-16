"""
routers/appointments.py
========================
Appointment booking and management API.

Routes:
    POST /appointments/                 -> Book appointment as PATIENT
    GET  /appointments/me               -> Current patient's appointments
    GET  /appointments/                  -> Admin appointment list
    GET  /appointments/{appointment_id} -> Single appointment details
"""

from typing import List, Optional, Union
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Appointment, Doctor, Patient, Admin, Branch
from schemas import AppointmentCreateRequest, AppointmentOut
from dependencies import get_current_patient, get_current_admin, get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

MAX_PATIENTS_PER_SLOT = 25


def clean_value(value) -> str:
    return str(value or "").strip().upper().replace("\r", "").replace("\n", "")


def get_token_role(current_user: Union[Patient, Admin]) -> str:
    return getattr(current_user, "_token_role", "")


def generate_appointment_id(db: Session) -> str:
    count = db.query(Appointment).count() + 1

    while True:
        new_id = f"APT{count:06d}"

        existing = (
            db.query(Appointment)
            .filter(Appointment.appointment_id == new_id)
            .first()
        )

        if not existing:
            return new_id

        count += 1


@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreateRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(Doctor.doctor_id == payload.doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    doctor_branch = clean_value(doctor.branch_id)
    payload_branch = clean_value(payload.branch_id)
    patient_branch = clean_value(current_patient.home_branch_id)

    doctor_department = clean_value(doctor.department)
    payload_department = clean_value(payload.department)

    if doctor_branch != payload_branch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Selected doctor belongs to {doctor.branch_id}, not {payload.branch_id}.",
        )

    if doctor_department != payload_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Selected doctor belongs to {doctor.department}, not {payload.department}.",
        )

    if patient_branch and patient_branch != payload_branch:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Patients can book appointments only in their home branch. Patient branch: {current_patient.home_branch_id}, selected branch: {payload.branch_id}",
        )

    existing_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == payload.doctor_id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.slot_time == payload.slot_time,
            Appointment.status != "Cancelled",
        )
        .scalar()
    )

    if existing_count >= MAX_PATIENTS_PER_SLOT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This slot is fully booked. Please choose another slot.",
        )

    appointment = Appointment(
        appointment_id=generate_appointment_id(db),
        patient_id=current_patient.patient_id,
        doctor_id=doctor.doctor_id,
        branch_id=doctor.branch_id,
        department=doctor.department,
        appointment_date=payload.appointment_date,
        slot_time=payload.slot_time,
        status="Scheduled",
        consult_fee=doctor.consult_fee,
        payment_mode=payload.payment_mode or "Cash",
        booked_on=date.today(),
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


@router.get("/me", response_model=List[AppointmentOut])
def get_my_appointments(
    status_filter: Optional[str] = None,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Appointment)
        .filter(Appointment.patient_id == current_patient.patient_id)
    )

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = (
        query
        .order_by(Appointment.appointment_date.desc())
        .all()
    )

    return appointments


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(
    city: Optional[str] = None,
    branch_id: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)
    role = get_token_role(current_admin)

    if role == "CITY_ADMIN":
        query = query.filter(Appointment.branch_id == current_admin.branch_id)
    else:
        if branch_id:
            query = query.filter(Appointment.branch_id == branch_id)
        elif city:
            query = (
                query.join(Branch, Appointment.branch_id == Branch.branch_id)
                .filter(Branch.city == city)
            )

    if department:
        query = query.filter(Appointment.department == department)

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = (
        query
        .order_by(Appointment.appointment_date.desc())
        .offset(skip)
        .limit(min(limit, 500))
        .all()
    )

    return appointments


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: str,
    current_user: Union[Patient, Admin] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.appointment_id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    if isinstance(current_user, Patient):
        if appointment.patient_id != current_user.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own appointments.",
            )

    if isinstance(current_user, Admin):
        role = get_token_role(current_user)

        if role == "CITY_ADMIN" and appointment.branch_id != current_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="City Admins can only view appointments from their own branch.",
            )

    return appointment