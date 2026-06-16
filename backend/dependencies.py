"""
dependencies.py
================
FastAPI dependencies for:
    - Extracting & validating the JWT bearer token
    - Resolving the current authenticated user (Patient or Admin)
    - Role-Based Access Control (RBAC) guards for protected routes
"""
from typing import Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Admin, AdminRoleEnum
from security import decode_access_token
from auth import get_user_by_token_claims
# Token URL is informational (used for OpenAPI docs / Swagger "Authorize" button).
# Actual login happens via /auth/login/patient or /auth/login/admin.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/patient")


# =========================================================
# CURRENT USER
# =========================================================
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Union[Patient, Admin]:
    """
    Decode the JWT bearer token and return the corresponding
    Patient or Admin ORM object. Raises 401 if the token is
    invalid/expired or the user no longer exists.
    """
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

    # Stash role on the object for downstream dependencies/handlers
    # (Patient/Admin models don't have a unified `role` attribute).
    setattr(user, "_token_role", role)
    setattr(user, "_token_claims", payload)
    return user


def get_current_patient(
    current_user: Union[Patient, Admin] = Depends(get_current_user),
) -> Patient:
    """Require the current user to be an authenticated PATIENT."""
    if not isinstance(current_user, Patient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to patients.",
        )
    return current_user


def get_current_admin(
    current_user: Union[Patient, Admin] = Depends(get_current_user),
) -> Admin:
    """Require the current user to be an authenticated admin (any tier)."""
    if not isinstance(current_user, Admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to admin accounts.",
        )
    return current_user


# =========================================================
# ROLE-BASED ACCESS CONTROL (RBAC)
# =========================================================
class RoleChecker:
    """
    Dependency factory that restricts access to a specific set of roles.

    Usage:
        @router.get("/reports", dependencies=[Depends(RoleChecker(["STATE_ADMIN", "SUPER_ADMIN"]))])
    """

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


# Convenience pre-built role checkers
require_patient = RoleChecker(["PATIENT"])
require_city_admin = RoleChecker(["CITY_ADMIN"])
require_state_admin = RoleChecker(["STATE_ADMIN"])
require_super_admin = RoleChecker(["SUPER_ADMIN"])
require_any_admin = RoleChecker([
    "CITY_ADMIN",
    "STATE_ADMIN",
    "SUPER_ADMIN",
])

require_state_or_super_admin = RoleChecker([
    "STATE_ADMIN",
    "SUPER_ADMIN",
])

# =========================================================
# CITY-SCOPED ACCESS HELPER
# =========================================================
def ensure_city_scope(current_admin: Admin, target_city: str) -> None:
    """
    Enforce that a CITY_ADMIN can only access data for their own city.
    STATE_ADMIN and SUPER_ADMIN bypass this check (no restriction).

    Raises 403 if a CITY_ADMIN attempts to access another city's data.
    """
    if current_admin.role == "CityAdmin":
        if current_admin.city != target_city:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"City Admins can only access data for their own city ({current_admin.city}).",
            )
