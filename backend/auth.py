from typing import Optional, Union

from sqlalchemy.orm import Session

from models import Patient, Admin
from security import create_access_token


def clean_value(value) -> str:
    return str(value or "").strip().upper().replace("\r", "").replace("\n", "")


def authenticate_patient(
    db: Session,
    patient_id: str,
    password: str
) -> Optional[Patient]:

    patient_id_clean = clean_value(patient_id)
    password_clean = clean_value(password)

    patients = db.query(Patient).all()

    for patient in patients:
        db_patient_id = clean_value(patient.patient_id)

        if db_patient_id == patient_id_clean:
            if password_clean == db_patient_id:
                return patient

    return None


def authenticate_admin(
    db: Session,
    username: str,
    password: str
) -> Optional[Admin]:

    username_clean = clean_value(username)
    password_clean = clean_value(password)

    admins = db.query(Admin).all()

    for admin in admins:
        db_admin_id = clean_value(admin.admin_id)

        if db_admin_id == username_clean:
            if password_clean == db_admin_id:
                return admin

    return None


def normalize_admin_role(role: str) -> str:
    role_map = {
        "SuperAdmin": "SUPER_ADMIN",
        "StateAdmin": "STATE_ADMIN",
        "CityAdmin": "CITY_ADMIN",
    }
    return role_map.get(str(role or "").strip(), role)


def build_patient_token(patient: Patient) -> str:
    claims = {
        "sub": clean_value(patient.patient_id),
        "role": "PATIENT",
        "city": str(patient.city or "").strip(),
        "branch_id": str(patient.home_branch_id or "").strip() or None,
    }

    return create_access_token(claims)


def build_admin_token(admin: Admin) -> str:
    claims = {
        "sub": clean_value(admin.admin_id),
        "role": normalize_admin_role(admin.role),
        "city": str(admin.city or "").strip() or None,
        "branch_id": str(admin.branch_id or "").strip() or None,
    }

    return create_access_token(claims)


def get_user_by_token_claims(
    db: Session,
    sub: str,
    role: str
) -> Optional[Union[Patient, Admin]]:

    sub_clean = clean_value(sub)

    if role == "PATIENT":
        patients = db.query(Patient).all()

        for patient in patients:
            if clean_value(patient.patient_id) == sub_clean:
                return patient

        return None

    admins = db.query(Admin).all()

    for admin in admins:
        if clean_value(admin.admin_id) == sub_clean:
            return admin

    return None