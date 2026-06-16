"""
routers/appointments.py
========================
Appointment booking & management API:
    - POST /appointments/                    -> Book a new appointment (PATIENT)
    - GET  /appointments/me                  -> List the current patient's appointments
    - GET  /appointments/{appointment_id}    -> Get a single appointment
    - GET  /appointments/                    -> List appointments (admin, RBAC-scoped)
"""
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Appointment, Doctor, Patient, Admin, AppointmentStatusEnum, AdminRoleEnum
from schemas import AppointmentCreateRequest, AppointmentOut
from dependencies import get_current_patient, get_current_admin, ensure_city_scope

router = APIRouter(prefix="/appointments", tags=["Appointments"])

MAX_PATIENTS_PER_SLOT = 25
WAIT_MINUTES_PER_TOKEN = 5


# =========================================================
# BOOK APPOINTMENT
# =========================================================
@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreateRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Book an appointment for the current patient.

    - Validates the doctor exists.
    - Enforces the 25-patient-per-slot cap (MAX_PATIENTS_PER_SLOT).
    - Auto-generates a sequential token number for the (doctor, date, slot).
    - Auto-generates the next sequential Appointment ID (APT00001, ...).
    - Computes estimated wait time = (token_number - 1) * 5 minutes.
    """
    doctor = db.query(Doctor).filter(Doctor.doctor_id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

    # Count existing (non-cancelled) bookings for this doctor/date/slot
    existing_count = (
        db.query(func.count(Appointment.appointment_id))
        .filter(
            Appointment.doctor_id == payload.doctor_id,
            Appointment.appointment_date == payload.appointment_date,
            Appointment.time_slot == payload.time_slot,
            Appointment.status != AppointmentStatusEnum.Cancelled,
        )
        .scalar()
    )

    if existing_count >= MAX_PATIENTS_PER_SLOT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This slot is fully booked ({MAX_PATIENTS_PER_SLOT}/{MAX_PATIENTS_PER_SLOT}). "
                   f"Please choose a different time slot.",
        )

    token_number = existing_count + 1
    estimated_wait = (token_number - 1) * WAIT_MINUTES_PER_TOKEN

    # Generate next Appointment ID: APT00001, APT00002, ...
    last_appt = (
        db.query(Appointment)
        .filter(Appointment.appointment_id.like("APT%"))
        .order_by(Appointment.appointment_id.desc())
        .first()
    )
    if last_appt:
        last_number = int(last_appt.appointment_id.replace("APT", ""))
    else:
        last_number = 0
    new_appointment_id = f"APT{last_number + 1:05d}"

    appointment = Appointment(
        appointment_id=new_appointment_id,
        patient_id=current_patient.patient_id,
        doctor_id=doctor.doctor_id,
        branch_id=doctor.branch_id,
        department=doctor.department,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        token_number=token_number,
        status=AppointmentStatusEnum.Confirmed,
        estimated_wait_minutes=estimated_wait,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


# =========================================================
# MY APPOINTMENTS (PATIENT)
# =========================================================
@router.get("/me", response_model=List[AppointmentOut])
def get_my_appointments(
    status_filter: Optional[AppointmentStatusEnum] = None,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """List all appointments for the currently logged-in patient."""
    query = db.query(Appointment).filter(Appointment.patient_id == current_patient.patient_id)

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return appointments


# =========================================================
# LIST APPOINTMENTS (ADMIN, RBAC-SCOPED)
# =========================================================
@router.get("/", response_model=List[AppointmentOut])
def list_appointments(
    city: Optional[str] = None,
    branch_id: Optional[int] = None,
    department: Optional[str] = None,
    status_filter: Optional[AppointmentStatusEnum] = None,
    skip: int = 0,
    limit: int = 100,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    List appointments for admin dashboards.

    RBAC scoping:
        - SUPER_ADMIN / STATE_ADMIN: full access, optional filters.
        - CITY_ADMIN: restricted to their own city's branch only.
    """
    from models import Branch  # local import to avoid circulars at module load

    query = db.query(Appointment)

    if current_admin.role == AdminRoleEnum.CITY_ADMIN:
        if city:
            ensure_city_scope(current_admin, city)
        query = query.filter(Appointment.branch_id == current_admin.branch_id)
    else:
        if branch_id:
            query = query.filter(Appointment.branch_id == branch_id)
        elif city:
            query = query.join(Branch, Appointment.branch_id == Branch.branch_id).filter(Branch.city == city)

    if department:
        query = query.filter(Appointment.department == department)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(min(limit, 500)).all()
    return appointments


# =========================================================
# GET APPOINTMENT BY ID
# =========================================================
@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: str,
    current_user: Union[Patient, Admin] = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Fetch a single appointment by ID. Patients may only view their own
    appointments (admin access to arbitrary appointments can be added
    via a separate admin-scoped route as needed).
    """
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.patient_id != current_user.patient_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own appointments.")

    return appointment
