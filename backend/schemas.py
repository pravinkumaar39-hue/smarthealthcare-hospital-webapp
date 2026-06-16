from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr


class PatientLoginRequest(BaseModel):
    patient_id: str
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class OTPLoginRequest(BaseModel):
    phone: str
    otp: str


class OTPRegisterRequest(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    phone: str
    otp: str
    gender: Optional[str] = None
    dob: Optional[date] = None
    blood_group: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    city: str
    state: str = "Tamil Nadu"
    pincode: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: Optional[str] = None
    must_change_password: bool = False


class PatientRegisterRequest(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    city: str
    state: str = "Tamil Nadu"
    pincode: Optional[str] = None


class PatientOut(BaseModel):
    patient_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    home_branch_id: Optional[str] = None

    class Config:
        from_attributes = True


class CurrentUserOut(BaseModel):
    user_id: str
    role: str
    name: Optional[str] = None
    city: Optional[str] = None
    branch_id: Optional[str] = None
    must_change_password: bool = False


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class DoctorOut(BaseModel):
    doctor_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    experience_yrs: Optional[int] = None
    branch_id: Optional[str] = None
    consult_fee: Optional[int] = None
    rating: Optional[float] = None

    class Config:
        from_attributes = True


class AppointmentCreateRequest(BaseModel):
    patient_id: Optional[str] = None
    doctor_id: str
    branch_id: str
    department: str
    appointment_date: date
    slot_time: str
    payment_mode: Optional[str] = "Cash"


class AppointmentOut(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    branch_id: str
    department: Optional[str] = None
    appointment_date: date
    slot_time: str
    token_number: Optional[int] = None
    estimated_wait_minutes: Optional[int] = None
    status: Optional[str] = None
    consult_fee: Optional[int] = None
    payment_mode: Optional[str] = None
    booked_on: Optional[date] = None

    class Config:
        from_attributes = True
    class Config:
        from_attributes = True