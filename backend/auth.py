from typing import Optional, Union

from sqlalchemy.orm import Session

from models import Patient, Admin
from security import create_access_token


def authenticate_patient(
    db: Session,
    patient_id: str,
    password: str
) -> Optional[Patient]:

    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if not patient:
        return None

    if password != patient.patient_id:
        return None

    return patient


def authenticate_admin(
    db: Session,
    username: str,
    password: str
) -> Optional[Admin]:

    admin = (
        db.query(Admin)
        .filter(Admin.admin_id == username)
        .first()
    )

    if not admin:
        return None

    if password != admin.admin_id:
        return None

    return admin


def normalize_admin_role(role: str) -> str:
    role_map = {
        "SuperAdmin": "SUPER_ADMIN",
        "StateAdmin": "STATE_ADMIN",
        "CityAdmin": "CITY_ADMIN",
    }
    return role_map.get(role, role)


def build_patient_token(patient: Patient) -> str:
    claims = {
        "sub": patient.patient_id,
        "role": "PATIENT",
        "city": patient.city,
        "branch_id": patient.home_branch_id,
    }

    return create_access_token(claims)


def build_admin_token(admin: Admin) -> str:
    claims = {
        "sub": admin.admin_id,
        "role": normalize_admin_role(admin.role),
        "city": admin.city,
        "branch_id": admin.branch_id,
    }

    return create_access_token(claims)


def get_user_by_token_claims(
    db: Session,
    sub: str,
    role: str
) -> Optional[Union[Patient, Admin]]:

    if role == "PATIENT":
        return (
            db.query(Patient)
            .filter(Patient.patient_id == sub)
            .first()
        )

    return (
        db.query(Admin)
        .filter(Admin.admin_id == sub)
        .first()
    )