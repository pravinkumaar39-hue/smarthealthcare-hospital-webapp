"""
SmartHealthcare Appointment Booking System
Enhanced production-quality synthetic data generator.

Outputs MySQL-import-ready CSV files into ./output/.

Run:
    python gen_health.py
"""
from __future__ import annotations

import os
import random
from datetime import date, datetime, time, timedelta
from pathlib import Path

import pandas as pd
from faker import Faker

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SEED = 42
random.seed(SEED)
fake = Faker("en_IN")
Faker.seed(SEED)

OUT_DIR = Path(os.environ.get("OUT_DIR", "output"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 10 Tamil Nadu cities with patient-ID prefixes
CITIES = [
    ("Chennai",     "PTNC"),
    ("Trichy",      "PTNT"),
    ("Madurai",     "PTNM"),
    ("Coimbatore",  "PTNCB"),
    ("Thanjavur",   "PTNTJ"),
    ("Salem",       "PTNS"),
    ("Tirunelveli", "PTNTN"),
    ("Erode",       "PTNE"),
    ("Vellore",     "PTNV"),
    ("Hosur",       "PTNH"),
]
PATIENTS_PER_CITY = 500

DEPARTMENTS = [
    "General Medicine", "Cardiology", "Orthopedics", "Pediatrics",
    "Gynecology", "Dermatology", "Neurology", "ENT",
    "Ophthalmology", "Oncology", "Psychiatry", "Dental",
]
# Department workload weights (controls department-wise appointment distribution)
DEPT_WEIGHTS = [22, 12, 10, 11, 9, 6, 5, 7, 5, 4, 4, 5]

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
GENDERS = ["Male", "Female", "Other"]
APPT_STATUS = ["Scheduled", "Completed", "Cancelled", "No-Show"]
APPT_STATUS_W = [25, 60, 10, 5]

# Realistic Tamil Nadu locality data per city
CITY_LOCALITIES = {
    "Chennai":     (["T. Nagar", "Adyar", "Velachery", "Anna Nagar", "Mylapore", "Tambaram", "Guindy", "Porur"], "600"),
    "Trichy":      (["Srirangam", "Thillai Nagar", "Cantonment", "K. K. Nagar", "Woraiyur", "Thiruverumbur"], "620"),
    "Madurai":     (["Anna Nagar", "K. K. Nagar", "Goripalayam", "Tallakulam", "Bypass Road", "Simmakkal"], "625"),
    "Coimbatore":  (["R. S. Puram", "Peelamedu", "Saibaba Colony", "Gandhipuram", "Singanallur", "Race Course"], "641"),
    "Thanjavur":   (["Medical College Road", "Vallam", "Nanjikottai", "South Main Street", "Karanthai"], "613"),
    "Salem":       (["Fairlands", "Hasthampatti", "Suramangalam", "Shevapet", "Ammapet"], "636"),
    "Tirunelveli": (["Palayamkottai", "Vannarpettai", "Melapalayam", "Tiruvengadam Nagar", "Maharaja Nagar"], "627"),
    "Erode":       (["Periyar Nagar", "R. K. Nagar", "Surampatti", "Brough Road", "Sathy Road"], "638"),
    "Vellore":     (["Sathuvachari", "Katpadi", "Gandhi Nagar", "Bagayam", "Thorapadi"], "632"),
    "Hosur":       (["SIPCOT", "Mathigiri", "Bagalur Road", "Denkanikottai Road", "Shanthi Nagar"], "635"),
}
TN_STREETS = ["Gandhi Road", "Bharathi Street", "Kamarajar Salai", "Anna Salai",
              "Periyar Street", "Nehru Street", "Temple Street", "Cross Street",
              "Bazaar Street", "Big Street"]


def tn_address(city: str) -> tuple[str, str, str]:
    """Return (address_line, locality, pincode) for a Tamil Nadu city."""
    localities, prefix = CITY_LOCALITIES[city]
    locality = random.choice(localities)
    door = random.randint(1, 250)
    street = random.choice(TN_STREETS)
    line = f"{door}, {street}, {locality}"
    pincode = f"{prefix}{random.randint(0, 999):03d}"
    return line, locality, pincode


# ---------------------------------------------------------------------------
# 1. Branches  (one per city, 3 IDs reserved for HQ + flagship hubs)
# ---------------------------------------------------------------------------
def generate_branches() -> pd.DataFrame:
    rows = []
    for i, (city, _) in enumerate(CITIES, start=1):
        line, locality, pin = tn_address(city)
        rows.append({
            "branch_id":    f"BR{i:03d}",
            "branch_name":  f"SmartHealth {city}",
            "city":         city,
            "state":        "Tamil Nadu",
            "address":      line,
            "locality":     locality,
            "pincode":      pin,
            "phone":        fake.phone_number(),
            "email":        f"{city.lower().replace(' ', '')}@smarthealth.in",
            "total_beds":   random.randint(80, 250),
            "opened_on":    fake.date_between(start_date="-15y", end_date="-1y").isoformat(),
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 2. Patients
# ---------------------------------------------------------------------------
def generate_patients(branches: pd.DataFrame) -> pd.DataFrame:
    city_to_branch = dict(zip(branches["city"], branches["branch_id"]))
    rows = []
    for city, prefix in CITIES:
        for n in range(1, PATIENTS_PER_CITY + 1):
            gender = random.choices(GENDERS, weights=[48, 50, 2])[0]
            first = fake.first_name_male() if gender == "Male" else fake.first_name_female()
            last = fake.last_name()
            line, locality, pin = tn_address(city)
            rows.append({
                "patient_id":    f"{prefix}{n:03d}",
                "first_name":    first,
                "last_name":     last,
                "gender":        gender,
                "dob":           fake.date_of_birth(minimum_age=1, maximum_age=92).isoformat(),
                "blood_group":   random.choice(BLOOD_GROUPS),
                "phone":         fake.phone_number(),
                "email":         f"{first.lower()}.{last.lower()}{n}@example.com",
                "address":       line,
                "locality":      locality,
                "city":          city,
                "state":         "Tamil Nadu",
                "pincode":       pin,
                "registered_on": fake.date_between(start_date="-5y", end_date="today").isoformat(),
                "home_branch_id": city_to_branch[city],
            })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 3. Doctors
# ---------------------------------------------------------------------------
def generate_doctors(branches: pd.DataFrame, n: int = 250) -> pd.DataFrame:
    branch_ids = branches["branch_id"].tolist()
    rows = []
    for i in range(1, n + 1):
        gender = random.choice(["Male", "Female"])
        first = fake.first_name_male() if gender == "Male" else fake.first_name_female()
        last = fake.last_name()
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS)[0]
        rows.append({
            "doctor_id":     f"DOC{i:04d}",
            "first_name":    first,
            "last_name":     last,
            "gender":        gender,
            "department":    dept,
            "qualification": random.choice(["MBBS", "MBBS, MD", "MBBS, MS", "MBBS, DM", "MBBS, DNB"]),
            "experience_yrs": random.randint(1, 35),
            "phone":         fake.phone_number(),
            "email":         f"dr.{first.lower()}.{last.lower()}{i}@smarthealth.in",
            "branch_id":     random.choice(branch_ids),
            "consult_fee":   random.choice([300, 400, 500, 600, 750, 1000, 1500]),
            "rating":        round(random.uniform(3.5, 5.0), 2),
            "active":        random.choices([1, 0], weights=[95, 5])[0],
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 4. Doctor availability — 365 days, 30-min slots, capacity = 25
# ---------------------------------------------------------------------------
SLOTS_PER_DAY = [
    time(9, 0), time(9, 30), time(10, 0), time(10, 30), time(11, 0), time(11, 30),
    time(15, 0), time(15, 30), time(16, 0), time(16, 30), time(17, 0), time(17, 30),
]
MAX_PER_SLOT = 25


def generate_doctor_availability(doctors: pd.DataFrame,
                                  start: date,
                                  days: int = 365) -> pd.DataFrame:
    """One row per (doctor, date) summarising slots & total capacity."""
    rows = []
    avail_id = 1
    for doc_id in doctors["doctor_id"]:
        # Each doctor has a weekly off day
        off_day = random.randint(0, 6)
        for d in range(days):
            day = start + timedelta(days=d)
            if day.weekday() == off_day:
                continue
            rows.append({
                "availability_id": f"AV{avail_id:07d}",
                "doctor_id":       doc_id,
                "available_date":  day.isoformat(),
                "slot_start":      "09:00",
                "slot_end":        "18:00",
                "slots_count":     len(SLOTS_PER_DAY),
                "max_per_slot":    MAX_PER_SLOT,
                "total_capacity":  len(SLOTS_PER_DAY) * MAX_PER_SLOT,
            })
            avail_id += 1
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 5. Appointments — capacity-bounded per slot, department-weighted
# ---------------------------------------------------------------------------
def generate_appointments(patients: pd.DataFrame,
                           doctors: pd.DataFrame,
                           n: int = 15000) -> pd.DataFrame:
    patient_ids = patients["patient_id"].tolist()
    doctors_by_dept = {d: doctors[doctors["department"] == d]["doctor_id"].tolist()
                       for d in DEPARTMENTS}
    doc_to_branch = dict(zip(doctors["doctor_id"], doctors["branch_id"]))
    doc_to_fee   = dict(zip(doctors["doctor_id"], doctors["consult_fee"]))

    # slot counter enforces 25-patient cap
    slot_counts: dict[tuple, int] = {}
    rows = []
    appt_no = 1
    start_window = date.today() - timedelta(days=180)

    attempts = 0
    while len(rows) < n and attempts < n * 8:
        attempts += 1
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS)[0]
        doc_pool = doctors_by_dept[dept]
        if not doc_pool:
            continue
        doc_id = random.choice(doc_pool)
        day = start_window + timedelta(days=random.randint(0, 364))
        slot = random.choice(SLOTS_PER_DAY)
        key = (doc_id, day.isoformat(), slot.strftime("%H:%M"))
        if slot_counts.get(key, 0) >= MAX_PER_SLOT:
            continue
        slot_counts[key] = slot_counts.get(key, 0) + 1

        status = random.choices(APPT_STATUS, weights=APPT_STATUS_W)[0]
        rows.append({
            "appointment_id":   f"APT{appt_no:06d}",
            "patient_id":       random.choice(patient_ids),
            "doctor_id":        doc_id,
            "branch_id":        doc_to_branch[doc_id],
            "department":       dept,
            "appointment_date": day.isoformat(),
            "slot_time":        slot.strftime("%H:%M"),
            "status":           status,
            "consult_fee":      doc_to_fee[doc_id],
            "payment_mode":     random.choice(["Cash", "Card", "UPI", "Insurance"]),
            "booked_on":        (day - timedelta(days=random.randint(0, 30))).isoformat(),
        })
        appt_no += 1
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 6. Medical history
# ---------------------------------------------------------------------------
DIAGNOSES = ["Hypertension", "Type 2 Diabetes", "Asthma", "Migraine",
             "Anemia", "Bronchitis", "Arthritis", "Dengue", "Typhoid",
             "Viral Fever", "Gastritis", "UTI", "Skin Allergy"]


def generate_medical_history(patients: pd.DataFrame,
                              doctors: pd.DataFrame,
                              appointments: pd.DataFrame,
                              n: int = 8000) -> pd.DataFrame:
    completed = appointments[appointments["status"] == "Completed"]
    if len(completed) < n:
        n = len(completed)
    sample = completed.sample(n=n, random_state=SEED).reset_index(drop=True)
    rows = []
    for i, row in sample.iterrows():
        rows.append({
            "history_id":      f"MH{i+1:06d}",
            "patient_id":      row["patient_id"],
            "doctor_id":       row["doctor_id"],
            "appointment_id":  row["appointment_id"],
            "visit_date":      row["appointment_date"],
            "diagnosis":       random.choice(DIAGNOSES),
            "prescription":    fake.sentence(nb_words=8),
            "notes":           fake.sentence(nb_words=12),
            "follow_up_date":  (datetime.fromisoformat(row["appointment_date"]) +
                                timedelta(days=random.randint(7, 60))).date().isoformat(),
            "readmitted":      random.choices([0, 1], weights=[88, 12])[0],
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 7. Hospital events — linked to real appointments where applicable
# ---------------------------------------------------------------------------
EVENT_TYPES = ["Admission", "Discharge", "Surgery", "Emergency",
               "Lab Test", "X-Ray", "MRI", "Vaccination"]


def generate_hospital_events(appointments: pd.DataFrame,
                              branches: pd.DataFrame,
                              n: int = 10000) -> pd.DataFrame:
    appt_sample = appointments.sample(n=n, replace=True, random_state=SEED).reset_index(drop=True)
    rows = []
    for i, a in appt_sample.iterrows():
        ev = random.choice(EVENT_TYPES)
        rows.append({
            "event_id":        f"EVT{i+1:06d}",
            "branch_id":       a["branch_id"],
            "appointment_id":  a["appointment_id"],
            "patient_id":      a["patient_id"],
            "doctor_id":       a["doctor_id"],
            "event_type":      ev,
            "event_date":      a["appointment_date"],
            "duration_min":    random.choice([15, 30, 45, 60, 90, 120]),
            "cost":            random.choice([200, 500, 1500, 3000, 7500, 15000, 45000]),
            "remarks":         fake.sentence(nb_words=6),
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 8. Notifications
# ---------------------------------------------------------------------------
def generate_notifications(patients: pd.DataFrame, n: int = 20000) -> pd.DataFrame:
    pids = patients["patient_id"].tolist()
    channels = ["SMS", "Email", "Push", "WhatsApp"]
    types = ["AppointmentReminder", "ReportReady", "Promotion",
             "PaymentDue", "FollowUp", "VaccinationDue"]
    rows = []
    for i in range(1, n + 1):
        rows.append({
            "notification_id": f"NTF{i:07d}",
            "patient_id":      random.choice(pids),
            "channel":         random.choice(channels),
            "type":            random.choice(types),
            "message":         fake.sentence(nb_words=10),
            "sent_at":         fake.date_time_between(start_date="-1y", end_date="now").isoformat(sep=" "),
            "status":          random.choices(["Delivered", "Failed", "Pending"], weights=[90, 5, 5])[0],
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 9. AI chat history
# ---------------------------------------------------------------------------
def generate_ai_chat_history(patients: pd.DataFrame, n: int = 5000) -> pd.DataFrame:
    pids = patients["patient_id"].tolist()
    intents = ["SymptomCheck", "BookAppointment", "Prescription",
               "DoctorInfo", "BillEnquiry", "Reschedule", "GeneralFAQ"]
    rows = []
    for i in range(1, n + 1):
        rows.append({
            "chat_id":       f"CHT{i:06d}",
            "patient_id":    random.choice(pids),
            "intent":        random.choice(intents),
            "user_message":  fake.sentence(nb_words=12),
            "bot_response":  fake.sentence(nb_words=14),
            "started_at":    fake.date_time_between(start_date="-6M", end_date="now").isoformat(sep=" "),
            "satisfaction":  random.choices([1, 2, 3, 4, 5], weights=[3, 5, 12, 40, 40])[0],
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 10. Admins
# ---------------------------------------------------------------------------
def generate_admins(branches: pd.DataFrame) -> pd.DataFrame:
    rows = [{
        "admin_id":  "ADM0001",
        "name":      "Super Admin",
        "email":     "superadmin@smarthealth.in",
        "phone":     fake.phone_number(),
        "role":      "SuperAdmin",
        "scope":     "ALL",
        "branch_id": None,
        "city":      None,
    }]
    next_id = 2
    for s in range(3):
        rows.append({
            "admin_id":  f"ADM{next_id:04d}",
            "name":      fake.name(),
            "email":     f"state.admin{s+1}@smarthealth.in",
            "phone":     fake.phone_number(),
            "role":      "StateAdmin",
            "scope":     "Tamil Nadu",
            "branch_id": None,
            "city":      None,
        })
        next_id += 1
    city_cycle = [c for c, _ in CITIES] * 2  # 20 city admins across 10 cities
    for k in range(20):
        city = city_cycle[k]
        branch_id = branches[branches["city"] == city]["branch_id"].iloc[0]
        rows.append({
            "admin_id":  f"ADM{next_id:04d}",
            "name":      fake.name(),
            "email":     f"city.admin{k+1}@smarthealth.in",
            "phone":     fake.phone_number(),
            "role":      "CityAdmin",
            "scope":     city,
            "branch_id": branch_id,
            "city":      city,
        })
        next_id += 1
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 11. Analytics-ready aggregates
# ---------------------------------------------------------------------------
def generate_analytics(branches: pd.DataFrame,
                        doctors: pd.DataFrame,
                        appointments: pd.DataFrame,
                        events: pd.DataFrame,
                        history: pd.DataFrame) -> dict[str, pd.DataFrame]:
    # ---- Bed occupancy per branch (synthetic daily mean) ----
    admissions = events[events["event_type"] == "Admission"].groupby("branch_id").size()
    bed_rows = []
    for _, b in branches.iterrows():
        adm = int(admissions.get(b["branch_id"], 0))
        # assume avg stay 4 days over 365 days
        occupied = min(b["total_beds"], (adm * 4) / 365)
        bed_rows.append({
            "branch_id":      b["branch_id"],
            "branch_name":    b["branch_name"],
            "total_beds":     b["total_beds"],
            "avg_occupied":   round(occupied, 1),
            "occupancy_pct":  round(occupied / b["total_beds"] * 100, 2),
        })
    bed_df = pd.DataFrame(bed_rows)

    # ---- Readmission % per branch ----
    appt_branch = appointments[["appointment_id", "branch_id"]]
    hist_join = history.merge(appt_branch, on="appointment_id", how="left")
    readm = (hist_join.groupby("branch_id")["readmitted"]
             .agg(["count", "sum"]).reset_index()
             .rename(columns={"count": "total_visits", "sum": "readmissions"}))
    readm["readmission_pct"] = (readm["readmissions"] / readm["total_visits"] * 100).round(2)

    # ---- Branch utilization (appts / capacity proxy) ----
    appts_per_branch = appointments.groupby("branch_id").size().rename("appointments")
    docs_per_branch = doctors.groupby("branch_id").size().rename("doctors")
    util = pd.concat([appts_per_branch, docs_per_branch], axis=1).fillna(0).reset_index()
    # capacity = doctors * slots(12) * 25 * 180 days window
    util["capacity"] = util["doctors"] * len(SLOTS_PER_DAY) * MAX_PER_SLOT * 180
    util["utilization_pct"] = (util["appointments"] / util["capacity"] * 100).round(2)

    # ---- Doctor workload ----
    workload = (appointments.groupby(["doctor_id", "department", "branch_id"])
                .size().reset_index(name="appointments"))
    workload = workload.merge(
        doctors[["doctor_id", "first_name", "last_name"]], on="doctor_id", how="left")
    workload["workload_score"] = (workload["appointments"] /
                                  workload["appointments"].max() * 100).round(2)

    return {
        "bed_occupancy":      bed_df,
        "readmission_stats":  readm,
        "branch_utilization": util,
        "doctor_workload":    workload,
    }


# ---------------------------------------------------------------------------
# 12. Dashboard KPI samples (City / State / Super admin)
# ---------------------------------------------------------------------------
def generate_dashboard_kpis(branches: pd.DataFrame,
                              patients: pd.DataFrame,
                              doctors: pd.DataFrame,
                              appointments: pd.DataFrame,
                              events: pd.DataFrame,
                              analytics: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    revenue = appointments.assign(rev=appointments["consult_fee"]) \
                          .groupby("branch_id")["rev"].sum().rename("revenue")
    by_branch = appointments.groupby("branch_id").size().rename("appointments")
    patients_by_city = patients.groupby("city").size().rename("patients")

    # City admin KPIs (one row per branch/city)
    city_rows = []
    for _, b in branches.iterrows():
        bid = b["branch_id"]
        city_rows.append({
            "scope":            "City",
            "city":             b["city"],
            "branch_id":        bid,
            "total_patients":   int(patients_by_city.get(b["city"], 0)),
            "total_doctors":    int((doctors["branch_id"] == bid).sum()),
            "total_appointments": int(by_branch.get(bid, 0)),
            "revenue":          int(revenue.get(bid, 0)),
            "occupancy_pct":    float(analytics["bed_occupancy"]
                                     .set_index("branch_id").loc[bid, "occupancy_pct"]),
            "utilization_pct":  float(analytics["branch_utilization"]
                                     .set_index("branch_id").loc[bid, "utilization_pct"]),
        })
    city_kpi = pd.DataFrame(city_rows)

    # State admin KPI (Tamil Nadu rollup)
    state_kpi = pd.DataFrame([{
        "scope":              "State",
        "state":              "Tamil Nadu",
        "total_branches":     len(branches),
        "total_patients":     len(patients),
        "total_doctors":      len(doctors),
        "total_appointments": len(appointments),
        "total_events":       len(events),
        "revenue":            int(appointments["consult_fee"].sum()),
        "avg_occupancy_pct":  round(analytics["bed_occupancy"]["occupancy_pct"].mean(), 2),
        "avg_utilization_pct": round(analytics["branch_utilization"]["utilization_pct"].mean(), 2),
    }])

    # Super admin KPI (global - here same as state since one state, but extensible)
    super_kpi = pd.DataFrame([{
        "scope":              "Super",
        "total_states":       1,
        "total_branches":     len(branches),
        "total_patients":     len(patients),
        "total_doctors":      len(doctors),
        "total_appointments": len(appointments),
        "total_revenue":      int(appointments["consult_fee"].sum()),
        "completed_pct":      round(
            (appointments["status"] == "Completed").mean() * 100, 2),
        "cancellation_pct":   round(
            (appointments["status"] == "Cancelled").mean() * 100, 2),
        "no_show_pct":        round(
            (appointments["status"] == "No-Show").mean() * 100, 2),
    }])

    return {
        "kpi_city_admin":  city_kpi,
        "kpi_state_admin": state_kpi,
        "kpi_super_admin": super_kpi,
    }


# ---------------------------------------------------------------------------
# Save helpers
# ---------------------------------------------------------------------------
def save(df: pd.DataFrame, name: str) -> None:
    path = OUT_DIR / f"{name}.csv"
    df.to_csv(path, index=False, encoding="utf-8")
    print(f"  wrote {path}  ({len(df):,} rows)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    print("SmartHealthcare data generation starting...")
    branches = generate_branches();                   save(branches, "branches")
    patients = generate_patients(branches);           save(patients, "patients")
    doctors  = generate_doctors(branches);            save(doctors,  "doctors")
    avail    = generate_doctor_availability(doctors,
                start=date.today() - timedelta(days=30), days=365)
    save(avail, "doctor_availability")
    appts    = generate_appointments(patients, doctors); save(appts, "appointments")
    history  = generate_medical_history(patients, doctors, appts); save(history, "medical_history")
    events   = generate_hospital_events(appts, branches); save(events, "hospital_events")
    notifs   = generate_notifications(patients);       save(notifs,  "notifications")
    chats    = generate_ai_chat_history(patients);     save(chats,   "ai_chat_history")
    admins   = generate_admins(branches);              save(admins,  "admins")

    analytics = generate_analytics(branches, doctors, appts, events, history)
    for name, df in analytics.items():
        save(df, name)

    kpis = generate_dashboard_kpis(branches, patients, doctors, appts, events, analytics)
    for name, df in kpis.items():
        save(df, name)

    print("All datasets generated under:", OUT_DIR.resolve())


if __name__ == "__main__":
    main()