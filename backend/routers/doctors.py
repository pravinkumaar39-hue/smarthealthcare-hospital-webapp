"""
routers/doctors.py
===================
Doctor directory API:
    - GET /doctors/                -> List doctors
    - GET /doctors/departments     -> List available departments
    - GET /doctors/{doctor_id}     -> Get single doctor details
"""
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Doctor, Branch, Patient, Admin
from schemas import DoctorOut
from dependencies import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctors"])


def get_user_role(current_user: Union[Patient, Admin]) -> str:
    return getattr(current_user, "_token_role", "")


@router.get("/", response_model=List[DoctorOut])
def list_doctors(
    city: Optional[str] = None,
    department: Optional[str] = None,
    branch_id: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Union[Patient, Admin] = Depends(get_current_user),
):
    query = db.query(Doctor)

    role = get_user_role(current_user)

    if active_only:
        query = query.filter(Doctor.active == True)

    if branch_id:
        query = query.filter(Doctor.branch_id == branch_id)

    elif city:
        query = (
            query.join(Branch, Doctor.branch_id == Branch.branch_id)
            .filter(Branch.city == city)
        )

    else:
        if isinstance(current_user, Patient) and current_user.home_branch_id:
            query = query.filter(Doctor.branch_id == current_user.home_branch_id)

        elif isinstance(current_user, Admin) and role == "CITY_ADMIN" and current_user.branch_id:
            query = query.filter(Doctor.branch_id == current_user.branch_id)

    if department:
        query = query.filter(Doctor.department == department)

    doctors = (
        query
        .order_by(Doctor.department, Doctor.first_name, Doctor.last_name)
        .offset(skip)
        .limit(min(limit, 300))
        .all()
    )

    return doctors


@router.get("/departments")
def list_departments(
    city: Optional[str] = None,
    branch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Union[Patient, Admin] = Depends(get_current_user),
):
    query = db.query(Doctor.department).filter(Doctor.department.isnot(None))

    role = get_user_role(current_user)

    if branch_id:
        query = query.filter(Doctor.branch_id == branch_id)

    elif city:
        query = (
            query.join(Branch, Doctor.branch_id == Branch.branch_id)
            .filter(Branch.city == city)
        )

    else:
        if isinstance(current_user, Patient) and current_user.home_branch_id:
            query = query.filter(Doctor.branch_id == current_user.home_branch_id)

        elif isinstance(current_user, Admin) and role == "CITY_ADMIN" and current_user.branch_id:
            query = query.filter(Doctor.branch_id == current_user.branch_id)

    rows = query.distinct().order_by(Doctor.department).all()

    return {
        "departments": [row[0] for row in rows if row[0]]
    }


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: Union[Patient, Admin] = Depends(get_current_user),
):
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    role = get_user_role(current_user)

    if isinstance(current_user, Patient):
        if current_user.home_branch_id and doctor.branch_id != current_user.home_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view doctors from your assigned branch.",
            )

    if isinstance(current_user, Admin) and role == "CITY_ADMIN":
        if current_user.branch_id and doctor.branch_id != current_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="City admin can only view doctors from their own branch.",
            )

    return doctor