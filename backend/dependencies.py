"""
dependencies.py
================
FastAPI dependencies for:
    - Extracting & validating the JWT bearer token
    - Resolving the current authenticated user: Patient or Admin
    - Role-Based Access Control guards
"""

from typing import Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Admin
from security import decode_access_token
from auth import get_user_by_token_claims


# Swagger Authorize button will use this endpoint.
# It accepts username/password form-data and returns a JWT token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/swagger-login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Union[Patient, Admin]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        sub: str = payload.get("sub")
        role: str = payload.get("role")

        if sub is None or role is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = get_user_by_token_claims(db, sub=sub, role=role)

    if user is None:
        raise credentials_exception

    setattr(user, "_token_role", role)
    setattr(user, "_token_claims", payload)

    return user


def get_current_patient(
    current_user: Union[Patient, Admin] = Depends(get_current_user),
) -> Patient:
    if not isinstance(current_user, Patient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to patients.",
        )

    return current_user


def get_current_admin(
    current_user: Union[Patient, Admin] = Depends(get_current_user),
) -> Admin:
    if not isinstance(current_user, Admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to admin accounts.",
        )

    return current_user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user: Union[Patient, Admin] = Depends(get_current_user),
    ) -> Union[Patient, Admin]:
        role = getattr(current_user, "_token_role", None)

        if role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(self.allowed_roles)}",
            )

        return current_user


require_patient = RoleChecker(["PATIENT"])
require_city_admin = RoleChecker(["CITY_ADMIN"])
require_state_admin = RoleChecker(["STATE_ADMIN"])
require_super_admin = RoleChecker(["SUPER_ADMIN"])

require_any_admin = RoleChecker([
    "CITY_ADMIN",
    "STATE_ADMIN",
    "SUPER_ADMIN",
])

require_city_or_super_admin = RoleChecker([
    "CITY_ADMIN",
    "SUPER_ADMIN",
])

require_state_or_super_admin = RoleChecker([
    "STATE_ADMIN",
    "SUPER_ADMIN",
])


def ensure_city_scope(current_admin: Admin, target_city: str) -> None:
    """
    CITY_ADMIN can only access their own city.
    SUPER_ADMIN can access all cities.
    """

    role = getattr(current_admin, "_token_role", None)

    if role == "CITY_ADMIN":
        if current_admin.city != target_city:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"City Admins can only access data for their own city ({current_admin.city}).",
            )