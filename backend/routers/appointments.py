"""
routers/appointments.py
========================
Appointment booking and management API.

Token logic:
    - Same doctor + same date = one daily queue
    - Same doctor + same date + same slot = slot capacity
    - Same patient + same doctor + same date = duplicate blocked
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

MAX_PATIENTS_PER_SLOT = 6
WAIT_MINUTES_PER_TOKEN = 5


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

    duplicate_appointment = (
        db.query(Appointment)
        .filter(
            Appointment.patient_id == current_patient.patient_id,
            Appointment.doctor_id == payload.doctor_id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.status != "Cancelled",
        )
        .first()
    )

    if duplicate_appointment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "You already have an appointment with this doctor on this date. "
                f"Appointment ID: {duplicate_appointment.appointment_id}"
            ),
        )

    slot_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == payload.doctor_id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.slot_time == payload.slot_time,
            Appointment.status != "Cancelled",
        )
        .scalar()
    )

    if slot_count >= MAX_PATIENTS_PER_SLOT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This slot is fully booked. Maximum {MAX_PATIENTS_PER_SLOT} patients allowed per slot.",
        )

    day_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == payload.doctor_id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.status != "Cancelled",
        )
        .scalar()
    )

    token_number = day_count + 1
    estimated_wait_minutes = (token_number - 1) * WAIT_MINUTES_PER_TOKEN

    appointment = Appointment(
        appointment_id=generate_appointment_id(db),
        patient_id=current_patient.patient_id,
        doctor_id=doctor.doctor_id,
        branch_id=doctor.branch_id,
        department=doctor.department,
        appointment_date=payload.appointment_date,
        slot_time=payload.slot_time,
        token_number=token_number,
        estimated_wait_minutes=estimated_wait_minutes,
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
        .order_by(Appointment.appointment_date.desc(), Appointment.token_number.asc())
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
        .order_by(Appointment.appointment_date.desc(), Appointment.token_number.asc())
        .offset(skip)
        .limit(min(limit, 500))
        .all()
    )

    return appointments



@router.get("/availability/check")
def check_slot_availability(
    doctor_id: str,
    appointment_date: date,
    slot_time: str,
    db: Session = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
):
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    booked_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.slot_time == slot_time,
            Appointment.status != "Cancelled",
        )
        .scalar()
    )

    available = booked_count < MAX_PATIENTS_PER_SLOT

    return {
        "doctor_id": doctor_id,
        "appointment_date": appointment_date,
        "slot_time": slot_time,
        "booked_count": booked_count,
        "capacity": MAX_PATIENTS_PER_SLOT,
        "available_slots": max(MAX_PATIENTS_PER_SLOT - booked_count, 0),
        "available": available,
        "message": (
            "Slot is available."
            if available
            else "This slot is fully booked. Please choose another slot or contact support."
        ),
    }


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_my_appointment(
    appointment_id: str,
    current_patient: Patient = Depends(get_current_patient),
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

    if appointment.patient_id != current_patient.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own appointments.",
        )

    if appointment.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment is already cancelled.",
        )

    appointment.status = "Cancelled"

    db.commit()
    db.refresh(appointment)

    return appointment


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_my_appointment(
    appointment_id: str,
    new_date: date,
    new_slot_time: str,
    current_patient: Patient = Depends(get_current_patient),
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

    if appointment.patient_id != current_patient.patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own appointments.",
        )

    if appointment.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled appointments cannot be modified.",
        )

    slot_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == new_date,
            Appointment.slot_time == new_slot_time,
            Appointment.status != "Cancelled",
            Appointment.appointment_id != appointment.appointment_id,
        )
        .scalar()
    )

    if slot_count >= MAX_PATIENTS_PER_SLOT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected slot is fully booked. Please choose another slot or contact support.",
        )

    day_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == new_date,
            Appointment.status != "Cancelled",
            Appointment.appointment_id != appointment.appointment_id,
        )
        .scalar()
    )

    appointment.appointment_date = new_date
    appointment.slot_time = new_slot_time
    appointment.token_number = day_count + 1
    appointment.estimated_wait_minutes = day_count * WAIT_MINUTES_PER_TOKEN
    appointment.status = "Scheduled"

    db.commit()
    db.refresh(appointment)

    return appointment



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