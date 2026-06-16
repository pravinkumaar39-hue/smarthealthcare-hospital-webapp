"""
routers/doctors.py
===================
Doctor directory API:
    - GET /doctors/                -> List doctors (filterable by city, department, branch)
    - GET /doctors/{doctor_id}     -> Get a single doctor's details
"""
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Doctor, Branch, Patient, Admin
from schemas import DoctorOut
from dependencies import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctors"])


# =========================================================
# LIST DOCTORS
# =========================================================
@router.get("/", response_model=List[DoctorOut])
def list_doctors(
    city: Optional[str] = None,
    department: Optional[str] = None,
    branch_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Union[Patient, Admin] = Depends(get_current_user),
):
    """
    List doctors, optionally filtered by city, department, or branch_id.
    Accessible to any authenticated user (patient or admin) — used by
    the appointment booking flow (Select Department -> Select Doctor).
    """
    query = db.query(Doctor)

    if branch_id:
        query = query.filter(Doctor.branch_id == branch_id)
    elif city:
        query = query.join(Branch, Doctor.branch_id == Branch.branch_id).filter(Branch.city == city)

    if department:
        query = query.filter(Doctor.department == department)

    doctors = query.offset(skip).limit(min(limit, 300)).all()
    return doctors


# =========================================================
# GET DOCTOR BY ID
# =========================================================
@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: Union[Patient, Admin] = Depends(get_current_user),
):
    """Fetch a single doctor's details by Doctor ID."""
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")
    return doctor
