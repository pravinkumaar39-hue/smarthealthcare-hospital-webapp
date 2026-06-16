"""
models.py
=========
SQLAlchemy ORM models mapped to the EXISTING `smarthealthcare` MySQL
database (created and seeded in Module 1). No schema changes are made
here — these classes simply describe the tables that already exist.
"""
import enum

from sqlalchemy import (
    Column, Integer, String, Date, Time, Boolean, Enum, DECIMAL,
    ForeignKey, TIMESTAMP, JSON, func, UniqueConstraint
)
from sqlalchemy.orm import relationship

from database import Base


# =========================================================
# ENUMS
# =========================================================
class GenderEnum(str, enum.Enum):
    Male = "Male"
    Female = "Female"
    Other = "Other"


class BloodGroupEnum(str, enum.Enum):
    A_pos = "A+"
    A_neg = "A-"
    B_pos = "B+"
    B_neg = "B-"
    AB_pos = "AB+"
    AB_neg = "AB-"
    O_pos = "O+"
    O_neg = "O-"


class AppointmentStatusEnum(str, enum.Enum):
    Confirmed = "Confirmed"
    Completed = "Completed"
    Cancelled = "Cancelled"
    NoShow = "No-Show"


class EventTypeEnum(str, enum.Enum):
    Admission = "Admission"
    Discharge = "Discharge"
    OPD = "OPD"
    Emergency = "Emergency"


class AdminRoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    STATE_ADMIN = "STATE_ADMIN"
    CITY_ADMIN = "CITY_ADMIN"


class AvailabilityStatusEnum(str, enum.Enum):
    Available = "Available"
    OnLeave = "OnLeave"
    Holiday = "Holiday"


# =========================================================
# BRANCH
# =========================================================
class Branch(Base):
    __tablename__ = "branches"

    branch_id = Column(Integer, primary_key=True, autoincrement=True)
    branch_name = Column(String(150), nullable=False)
    city = Column(String(50), nullable=False, index=True)
    state = Column(String(50), nullable=False, default="Tamil Nadu")
    contact_number = Column(String(15), nullable=False)
    address = Column(String(255))
    available_departments = Column(JSON, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    patients = relationship("Patient", back_populates="branch")
    doctors = relationship("Doctor", back_populates="branch")
    appointments = relationship("Appointment", back_populates="branch")
    hospital_events = relationship("HospitalEvent", back_populates="branch")
    admins = relationship("Admin", back_populates="branch")


# =========================================================
# PATIENT
# =========================================================
class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(String(10), primary_key=True)  # PTN0001
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    phone = Column(String(15), nullable=False, unique=True, index=True)
    email = Column(String(120), unique=True)
    address = Column(String(255))
    blood_group = Column(Enum(BloodGroupEnum), nullable=False)
    state = Column(String(50), nullable=False, default="Tamil Nadu")
    city = Column(String(50), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False)
    password_hash = Column(String(255), nullable=False)
    must_change_password = Column(Boolean, default=True)
    created_date = Column(TIMESTAMP, server_default=func.now())

    branch = relationship("Branch", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")
    hospital_events = relationship("HospitalEvent", back_populates="patient")


# =========================================================
# DOCTOR
# =========================================================
class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(String(10), primary_key=True)  # DOC0001
    doctor_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False, index=True)
    specialization = Column(String(100), nullable=False)
    experience_years = Column(Integer, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    consultation_fee = Column(DECIMAL(8, 2), default=500.00)
    created_at = Column(TIMESTAMP, server_default=func.now())

    branch = relationship("Branch", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    availability = relationship("DoctorAvailability", back_populates="doctor")


# =========================================================
# DOCTOR AVAILABILITY
# =========================================================
class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"

    availability_id = Column(Integer, primary_key=True, autoincrement=True)
    doctor_id = Column(String(10), ForeignKey("doctors.doctor_id"), nullable=False, index=True)
    available_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(AvailabilityStatusEnum), nullable=False, default=AvailabilityStatusEnum.Available)
    available_slots = Column(JSON, nullable=False)
    max_patients_per_slot = Column(Integer, default=25)

    doctor = relationship("Doctor", back_populates="availability")

    __table_args__ = (
        UniqueConstraint("doctor_id", "available_date", name="uq_doctor_date"),
    )


# =========================================================
# APPOINTMENT
# =========================================================
class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(String(12), primary_key=True)  # APT00001
    patient_id = Column(String(10), ForeignKey("patients.patient_id"), nullable=False, index=True)
    doctor_id = Column(String(10), ForeignKey("doctors.doctor_id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False)
    department = Column(String(50), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(20), nullable=False)
    token_number = Column(Integer, nullable=False)
    status = Column(Enum(AppointmentStatusEnum), default=AppointmentStatusEnum.Confirmed)
    estimated_wait_minutes = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    branch = relationship("Branch", back_populates="appointments")
    hospital_event = relationship("HospitalEvent", back_populates="appointment", uselist=False)


# =========================================================
# HOSPITAL EVENT
# =========================================================
class HospitalEvent(Base):
    __tablename__ = "hospital_events"

    event_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(10), ForeignKey("patients.patient_id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=False, index=True)
    appointment_id = Column(String(12), ForeignKey("appointments.appointment_id"), nullable=True, index=True)
    event_date = Column(Date, nullable=False, index=True)
    event_time = Column(Time, nullable=False)
    event_type = Column(Enum(EventTypeEnum), nullable=False)
    department = Column(String(50), nullable=False)
    length_of_stay = Column(Integer, default=0)
    readmitted_within_30_days = Column(Boolean, default=False)
    bed_occupied = Column(Boolean, default=False)
    diagnosis = Column(String(255))

    patient = relationship("Patient", back_populates="hospital_events")
    branch = relationship("Branch", back_populates="hospital_events")
    appointment = relationship("Appointment", back_populates="hospital_event")


# =========================================================
# ADMIN
# =========================================================
class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(AdminRoleEnum), nullable=False, index=True)
    state = Column(String(50), nullable=True)
    city = Column(String(50), nullable=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.branch_id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    branch = relationship("Branch", back_populates="admins")
