"""
security.py
============
Password hashing (bcrypt) and JWT token creation / verification utilities.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import jwt, JWTError
from passlib.context import CryptContext

load_dotenv()

# =========================================================
# CONFIG
# =========================================================
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-to-a-random-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =========================================================
# PASSWORD HASHING
# =========================================================
def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# =========================================================
# JWT TOKEN CREATION / VALIDATION
# =========================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.

    `data` should contain at least:
        - sub: patient_id or admin username
        - role: PATIENT | CITY_ADMIN | STATE_ADMIN | SUPER_ADMIN
    Optional extra claims (state, city, branch_id) can be embedded for
    RBAC scoping without extra DB lookups on every request.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Raises jose.JWTError if the token is invalid, expired, or
    has an invalid signature. Callers should catch this and
    translate it into an HTTP 401.
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
