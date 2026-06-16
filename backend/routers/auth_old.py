from typing import Optional, Union

from sqlalchemy.orm import Session

from models import Patient, Admin, AdminRoleEnum
from security import verify_password, create_access_token


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

    if not verify_password(password, patient.password_hash):
        return None

    return patient


def authenticate_admin(
    db: Session,
    username: str,
    password: str
) -> Optional[Admin]:

    admin = (
        db.query(Admin)
        .filter(Admin.username == username)
        .first()
    )

    if not admin:
        return None

    if not verify_password(password, admin.password_hash):
        return None

    return admin


def build_patient_token(patient: Patient) -> str:

    claims = {
        "sub": patient.patient_id,
        "role": "PATIENT",
        "city": patient.city,
        "branch_id": patient.branch_id,
    }

    return create_access_token(claims)


def build_admin_token(admin: Admin) -> str:

    claims = {
        "sub": admin.username,
        "role": admin.role.value,
        "state": admin.state,
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

    if role in (
        AdminRoleEnum.SUPER_ADMIN.value,
        AdminRoleEnum.STATE_ADMIN.value,
        AdminRoleEnum.CITY_ADMIN.value,
    ):
        return (
            db.query(Admin)
            .filter(Admin.username == sub)
            .first()
        )

    return None