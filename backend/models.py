import enum

from sqlalchemy import Column, String, Integer, Date, Enum, ForeignKey, DECIMAL, Boolean
from sqlalchemy.orm import relationship

from database import Base


class GenderEnum(str, enum.Enum):
    Male = "Male"
    Female = "Female"
    Other = "Other"


class AppointmentStatusEnum(str, enum.Enum):
    Scheduled = "Scheduled"
    Completed = "Completed"
    Cancelled = "Cancelled"
    NoShow = "No-Show"


class AdminRoleEnum(str, enum.Enum):
    SuperAdmin = "SuperAdmin"
    StateAdmin = "StateAdmin"
    CityAdmin = "CityAdmin"


class Branch(Base):
    __tablename__ = "branches"

    branch_id = Column(String(10), primary_key=True)
    branch_name = Column(String(100), nullable=False)
    city = Column(String(60), nullable=False)
    state = Column(String(60), nullable=False)
    address = Column(String(255))
    locality = Column(String(100))
    pincode = Column(String(10))
    phone = Column(String(40))
    email = Column(String(120))
    total_beds = Column(Integer)
    opened_on = Column(Date)

    patients = relationship("Patient", back_populates="branch")
    doctors = relationship("Doctor", back_populates="branch")
    appointments = relationship("Appointment", back_populates="branch")
    admins = relationship("Admin", back_populates="branch")


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(String(12), primary_key=True)
    first_name = Column(String(60))
    last_name = Column(String(60))
    gender = Column(Enum(GenderEnum))
    dob = Column(Date)
    blood_group = Column(String(4))
    phone = Column(String(40))
    email = Column(String(120))
    address = Column(String(255))
    locality = Column(String(100))
    city = Column(String(60))
    state = Column(String(60))
    pincode = Column(String(10))
    registered_on = Column(Date)
    home_branch_id = Column(String(10), ForeignKey("branches.branch_id"))

    branch = relationship("Branch", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(String(10), primary_key=True)
    first_name = Column(String(60))
    last_name = Column(String(60))
    gender = Column(Enum(GenderEnum))
    department = Column(String(60))
    qualification = Column(String(60))
    experience_yrs = Column(Integer)
    phone = Column(String(40))
    email = Column(String(120))
    branch_id = Column(String(10), ForeignKey("branches.branch_id"))
    consult_fee = Column(Integer)
    rating = Column(DECIMAL(3, 2))
    active = Column(Boolean)

    branch = relationship("Branch", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(String(12), primary_key=True)
    patient_id = Column(String(12), ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(String(10), ForeignKey("doctors.doctor_id"), nullable=False)
    branch_id = Column(String(10), ForeignKey("branches.branch_id"), nullable=False)
    department = Column(String(60))
    appointment_date = Column(Date, nullable=False)
    slot_time = Column(String(5), nullable=False)
    token_number = Column(Integer)
    estimated_wait_minutes = Column(Integer)
    status = Column(String(20))
    consult_fee = Column(Integer)
    payment_mode = Column(String(20))
    booked_on = Column(Date)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    branch = relationship("Branch", back_populates="appointments")
    @property
    def doctor_name(self):
        if self.doctor:
            return f"Dr. {self.doctor.first_name or ''} {self.doctor.last_name or ''}".strip()
        return None

    @property
    def doctor_gender(self):
        return self.doctor.gender if self.doctor else None

    @property
    def doctor_qualification(self):
        return self.doctor.qualification if self.doctor else None

    @property
    def doctor_experience_yrs(self):
        return self.doctor.experience_yrs if self.doctor else None

    @property
    def doctor_rating(self):
        if self.doctor and self.doctor.rating is not None:
            return float(self.doctor.rating)
        return None

    @property
    def doctor_active(self):
        return self.doctor.active if self.doctor else None


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(String(10), primary_key=True)
    name = Column(String(120))
    email = Column(String(120))
    phone = Column(String(40))
    role = Column(Enum("SuperAdmin", "StateAdmin", "CityAdmin"), nullable=False)
    scope = Column(String(60))
    branch_id = Column(String(10), ForeignKey("branches.branch_id"))
    city = Column(String(60))

    branch = relationship("Branch", back_populates="admins")