from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_admin
from models import Admin, Patient, Doctor, Appointment, Branch


router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


def get_admin_role(admin: Admin) -> str:
    role = getattr(admin, "_token_role", None) or admin.role or ""

    role_map = {
        "SuperAdmin": "SUPER_ADMIN",
        "StateAdmin": "STATE_ADMIN",
        "CityAdmin": "CITY_ADMIN",
        "SUPER_ADMIN": "SUPER_ADMIN",
        "STATE_ADMIN": "STATE_ADMIN",
        "CITY_ADMIN": "CITY_ADMIN",
    }

    return role_map.get(role, role)


def is_super_admin(admin: Admin) -> bool:
    return get_admin_role(admin) == "SUPER_ADMIN"


def get_scope_branch_id(admin: Admin) -> Optional[str]:
    if is_super_admin(admin):
        return None

    return admin.branch_id


def get_scope_city(admin: Admin) -> Optional[str]:
    if is_super_admin(admin):
        return None

    return admin.city


def scoped_patients_query(db: Session, admin: Admin):
    query = db.query(Patient)

    branch_id = get_scope_branch_id(admin)
    city = get_scope_city(admin)

    if branch_id:
        query = query.filter(Patient.home_branch_id == branch_id)
    elif city:
        query = query.filter(Patient.city == city)

    return query


def scoped_doctors_query(db: Session, admin: Admin):
    query = db.query(Doctor)

    branch_id = get_scope_branch_id(admin)

    if branch_id:
        query = query.filter(Doctor.branch_id == branch_id)

    return query


def scoped_appointments_query(db: Session, admin: Admin):
    query = db.query(Appointment)

    branch_id = get_scope_branch_id(admin)

    if branch_id:
        query = query.filter(Appointment.branch_id == branch_id)

    return query


def scoped_branches_query(db: Session, admin: Admin):
    query = db.query(Branch)

    branch_id = get_scope_branch_id(admin)
    city = get_scope_city(admin)

    if branch_id:
        query = query.filter(Branch.branch_id == branch_id)
    elif city:
        query = query.filter(Branch.city == city)

    return query


def full_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    name = f"{first_name or ''} {last_name or ''}".strip()
    return name if name else "-"


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    today = date.today()

    patients_query = scoped_patients_query(db, current_admin)
    doctors_query = scoped_doctors_query(db, current_admin)
    appointments_query = scoped_appointments_query(db, current_admin)

    total_patients = patients_query.count()
    total_doctors = doctors_query.count()
    active_doctors = doctors_query.filter(Doctor.active == 1).count()
    inactive_doctors = total_doctors - active_doctors

    total_appointments = appointments_query.count()
    today_appointments = appointments_query.filter(
        Appointment.appointment_date == today
    ).count()

    scheduled_appointments = appointments_query.filter(
        Appointment.status == "Scheduled"
    ).count()

    completed_appointments = appointments_query.filter(
        Appointment.status == "Completed"
    ).count()

    cancelled_appointments = appointments_query.filter(
        Appointment.status == "Cancelled"
    ).count()

    revenue_result = appointments_query.with_entities(
        func.coalesce(func.sum(Appointment.consult_fee), 0)
    ).scalar()

    return {
        "role": get_admin_role(current_admin),
        "city": current_admin.city,
        "branch_id": current_admin.branch_id,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "active_doctors": active_doctors,
        "inactive_doctors": inactive_doctors,
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "scheduled_appointments": scheduled_appointments,
        "completed_appointments": completed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "total_revenue": int(revenue_result or 0),
    }


@router.get("/recent-appointments")
def recent_appointments(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    query = (
        scoped_appointments_query(db, current_admin)
        .outerjoin(Patient, Appointment.patient_id == Patient.patient_id)
        .outerjoin(Doctor, Appointment.doctor_id == Doctor.doctor_id)
        .with_entities(
            Appointment.appointment_id,
            Appointment.patient_id,
            Patient.first_name.label("patient_first_name"),
            Patient.last_name.label("patient_last_name"),
            Appointment.doctor_id,
            Doctor.first_name.label("doctor_first_name"),
            Doctor.last_name.label("doctor_last_name"),
            Doctor.gender.label("doctor_gender"),
            Doctor.rating.label("doctor_rating"),
            Doctor.active.label("doctor_active"),
            Doctor.experience_yrs.label("doctor_experience_yrs"),
            Appointment.branch_id,
            Appointment.department,
            Appointment.appointment_date,
            Appointment.slot_time,
            Appointment.token_number,
            Appointment.estimated_wait_minutes,
            Appointment.status,
            Appointment.consult_fee,
        )
        .order_by(
            desc(Appointment.appointment_date),
            desc(Appointment.slot_time),
            desc(Appointment.appointment_id),
        )
        .limit(limit)
        .all()
    )

    result = []

    for row in query:
        result.append(
            {
                "appointment_id": row.appointment_id,
                "patient_id": row.patient_id,
                "patient_name": full_name(row.patient_first_name, row.patient_last_name),
                "doctor_id": row.doctor_id,
                "doctor_name": f"Dr. {full_name(row.doctor_first_name, row.doctor_last_name)}",
                "doctor_gender": row.doctor_gender,
                "doctor_rating": float(row.doctor_rating) if row.doctor_rating is not None else None,
                "doctor_active": bool(row.doctor_active),
                "doctor_experience_yrs": row.doctor_experience_yrs,
                "branch_id": row.branch_id,
                "department": row.department,
                "appointment_date": row.appointment_date,
                "slot_time": row.slot_time,
                "token_number": row.token_number,
                "estimated_wait_minutes": row.estimated_wait_minutes,
                "status": row.status,
                "consult_fee": row.consult_fee,
            }
        )

    return result


@router.get("/appointments-by-department")
def appointments_by_department(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    query = scoped_appointments_query(db, current_admin)

    rows = (
        query.with_entities(
            Appointment.department,
            func.count(Appointment.appointment_id).label("appointment_count"),
        )
        .group_by(Appointment.department)
        .order_by(desc("appointment_count"))
        .all()
    )

    return [
        {
            "department": row.department or "Unknown",
            "appointment_count": row.appointment_count,
        }
        for row in rows
    ]


@router.get("/appointments-by-status")
def appointments_by_status(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    query = scoped_appointments_query(db, current_admin)

    rows = (
        query.with_entities(
            Appointment.status,
            func.count(Appointment.appointment_id).label("appointment_count"),
        )
        .group_by(Appointment.status)
        .order_by(desc("appointment_count"))
        .all()
    )

    return [
        {
            "status": row.status or "Unknown",
            "appointment_count": row.appointment_count,
        }
        for row in rows
    ]


@router.get("/doctor-workload")
def doctor_workload(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    doctor_query = scoped_doctors_query(db, current_admin)

    doctors = doctor_query.all()
    result = []

    for doctor in doctors:
        appointment_count_query = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.doctor_id
        )

        branch_id = get_scope_branch_id(current_admin)
        if branch_id:
            appointment_count_query = appointment_count_query.filter(
                Appointment.branch_id == branch_id
            )

        appointment_count = appointment_count_query.count()

        result.append(
            {
                "doctor_id": doctor.doctor_id,
                "doctor_name": f"Dr. {full_name(doctor.first_name, doctor.last_name)}",
                "gender": doctor.gender,
                "department": doctor.department,
                "experience_yrs": doctor.experience_yrs,
                "rating": float(doctor.rating) if doctor.rating is not None else None,
                "active": bool(doctor.active),
                "branch_id": doctor.branch_id,
                "appointment_count": appointment_count,
            }
        )

    result.sort(key=lambda item: item["appointment_count"], reverse=True)
    return result


@router.get("/branch-summary")
def branch_summary(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    branches = scoped_branches_query(db, current_admin).all()

    result = []

    for branch in branches:
        patient_count = db.query(Patient).filter(
            Patient.home_branch_id == branch.branch_id
        ).count()

        doctor_count = db.query(Doctor).filter(
            Doctor.branch_id == branch.branch_id
        ).count()

        appointment_count = db.query(Appointment).filter(
            Appointment.branch_id == branch.branch_id
        ).count()

        today_appointment_count = db.query(Appointment).filter(
            Appointment.branch_id == branch.branch_id,
            Appointment.appointment_date == date.today(),
        ).count()

        result.append(
            {
                "branch_id": branch.branch_id,
                "branch_name": branch.branch_name,
                "city": branch.city,
                "state": branch.state,
                "total_beds": branch.total_beds,
                "patient_count": patient_count,
                "doctor_count": doctor_count,
                "appointment_count": appointment_count,
                "today_appointment_count": today_appointment_count,
            }
        )

    return result