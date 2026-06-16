-- SmartHealthcare Appointment Booking System
-- MySQL 8.0+ compatible schema
USE smarthealthcare;
CREATE DATABASE IF NOT EXISTS smarthealthcare
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smarthealthcare;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS kpi_super_admin, kpi_state_admin, kpi_city_admin,
  doctor_workload, branch_utilization, readmission_stats, bed_occupancy,
  ai_chat_history, notifications, hospital_events, medical_history,
  appointments, doctor_availability, admins, doctors, patients, branches;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------
CREATE TABLE branches (
  branch_id    VARCHAR(10) PRIMARY KEY,
  branch_name  VARCHAR(100) NOT NULL,
  city         VARCHAR(60)  NOT NULL,
  state        VARCHAR(60)  NOT NULL,
  address      VARCHAR(255),
  locality     VARCHAR(100),
  pincode      VARCHAR(10),
  phone        VARCHAR(40),
  email        VARCHAR(120),
  total_beds   INT,
  opened_on    DATE
) ENGINE=InnoDB;

CREATE TABLE patients (
  patient_id     VARCHAR(12) PRIMARY KEY,
  first_name     VARCHAR(60),
  last_name      VARCHAR(60),
  gender         ENUM('Male','Female','Other'),
  dob            DATE,
  blood_group    VARCHAR(4),
  phone          VARCHAR(40),
  email          VARCHAR(120),
  address        VARCHAR(255),
  locality       VARCHAR(100),
  city           VARCHAR(60),
  state          VARCHAR(60),
  pincode        VARCHAR(10),
  registered_on  DATE,
  home_branch_id VARCHAR(10),
  FOREIGN KEY (home_branch_id) REFERENCES branches(branch_id)
) ENGINE=InnoDB;

CREATE TABLE doctors (
  doctor_id      VARCHAR(10) PRIMARY KEY,
  first_name     VARCHAR(60),
  last_name      VARCHAR(60),
  gender         ENUM('Male','Female','Other'),
  department     VARCHAR(60),
  qualification  VARCHAR(60),
  experience_yrs INT,
  phone          VARCHAR(40),
  email          VARCHAR(120),
  branch_id      VARCHAR(10),
  consult_fee    INT,
  rating         DECIMAL(3,2),
  active         TINYINT(1),
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
) ENGINE=InnoDB;

CREATE TABLE doctor_availability (
  availability_id VARCHAR(12) PRIMARY KEY,
  doctor_id       VARCHAR(10) NOT NULL,
  available_date  DATE NOT NULL,
  slot_start      TIME,
  slot_end        TIME,
  slots_count     INT,
  max_per_slot    INT,
  total_capacity  INT,
  UNIQUE KEY uq_doc_date (doctor_id, available_date),
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
) ENGINE=InnoDB;

CREATE TABLE admins (
  admin_id   VARCHAR(10) PRIMARY KEY,
  name       VARCHAR(120),
  email      VARCHAR(120),
  phone      VARCHAR(40),
  role       ENUM('SuperAdmin','StateAdmin','CityAdmin') NOT NULL,
  scope      VARCHAR(60),
  branch_id  VARCHAR(10) NULL,
  city       VARCHAR(60) NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
) ENGINE=InnoDB;

CREATE TABLE appointments (
  appointment_id   VARCHAR(12) PRIMARY KEY,
  patient_id       VARCHAR(12) NOT NULL,
  doctor_id        VARCHAR(10) NOT NULL,
  branch_id        VARCHAR(10) NOT NULL,
  department       VARCHAR(60),
  appointment_date DATE NOT NULL,
  slot_time        VARCHAR(5) NOT NULL,
  status           ENUM('Scheduled','Completed','Cancelled','No-Show'),
  consult_fee      INT,
  payment_mode     ENUM('Cash','Card','UPI','Insurance'),
  booked_on        DATE,
  INDEX idx_appt_slot (doctor_id, appointment_date, slot_time),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id),
  FOREIGN KEY (branch_id)  REFERENCES branches(branch_id)
) ENGINE=InnoDB;

CREATE TABLE medical_history (
  history_id     VARCHAR(12) PRIMARY KEY,
  patient_id     VARCHAR(12) NOT NULL,
  doctor_id      VARCHAR(10) NOT NULL,
  appointment_id VARCHAR(12),
  visit_date     DATE,
  diagnosis      VARCHAR(120),
  prescription   TEXT,
  notes          TEXT,
  follow_up_date DATE,
  readmitted     TINYINT(1),
  FOREIGN KEY (patient_id)     REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id)      REFERENCES doctors(doctor_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
) ENGINE=InnoDB;

CREATE TABLE hospital_events (
  event_id       VARCHAR(12) PRIMARY KEY,
  branch_id      VARCHAR(10) NOT NULL,
  appointment_id VARCHAR(12),
  patient_id     VARCHAR(12),
  doctor_id      VARCHAR(10),
  event_type     VARCHAR(40),
  event_date     DATE,
  duration_min   INT,
  cost           INT,
  remarks        VARCHAR(255),
  FOREIGN KEY (branch_id)      REFERENCES branches(branch_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
  FOREIGN KEY (patient_id)     REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id)      REFERENCES doctors(doctor_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  notification_id VARCHAR(12) PRIMARY KEY,
  patient_id      VARCHAR(12),
  channel         ENUM('SMS','Email','Push','WhatsApp'),
  type            VARCHAR(40),
  message         TEXT,
  sent_at         DATETIME,
  status          ENUM('Delivered','Failed','Pending'),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
) ENGINE=InnoDB;

CREATE TABLE ai_chat_history (
  chat_id      VARCHAR(12) PRIMARY KEY,
  patient_id   VARCHAR(12),
  intent       VARCHAR(40),
  user_message TEXT,
  bot_response TEXT,
  started_at   DATETIME,
  satisfaction TINYINT,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
) ENGINE=InnoDB;

-- Analytics tables -----------------------------------------------------
CREATE TABLE bed_occupancy (
  branch_id     VARCHAR(10) PRIMARY KEY,
  branch_name   VARCHAR(100),
  total_beds    INT,
  avg_occupied  DECIMAL(6,1),
  occupancy_pct DECIMAL(6,2)
) ENGINE=InnoDB;

CREATE TABLE readmission_stats (
  branch_id       VARCHAR(10) PRIMARY KEY,
  total_visits    INT,
  readmissions    INT,
  readmission_pct DECIMAL(6,2)
) ENGINE=InnoDB;

CREATE TABLE branch_utilization (
  branch_id        VARCHAR(10) PRIMARY KEY,
  appointments     INT,
  doctors          INT,
  capacity         BIGINT,
  utilization_pct  DECIMAL(6,2)
) ENGINE=InnoDB;

CREATE TABLE doctor_workload (
  doctor_id       VARCHAR(10) PRIMARY KEY,
  department      VARCHAR(60),
  branch_id       VARCHAR(10),
  first_name      VARCHAR(60),
  last_name       VARCHAR(60),
  appointments    INT,
  workload_score  DECIMAL(6,2)
) ENGINE=InnoDB;

-- KPI tables -----------------------------------------------------------
CREATE TABLE kpi_city_admin (
  scope              VARCHAR(20),
  city               VARCHAR(60),
  branch_id          VARCHAR(10) PRIMARY KEY,
  total_patients     INT,
  total_doctors      INT,
  total_appointments INT,
  revenue            BIGINT,
  occupancy_pct      DECIMAL(6,2),
  utilization_pct    DECIMAL(6,2)
) ENGINE=InnoDB;

CREATE TABLE kpi_state_admin (
  scope                VARCHAR(20),
  state                VARCHAR(60) PRIMARY KEY,
  total_branches       INT,
  total_patients       INT,
  total_doctors        INT,
  total_appointments   INT,
  total_events         INT,
  revenue              BIGINT,
  avg_occupancy_pct    DECIMAL(6,2),
  avg_utilization_pct  DECIMAL(6,2)
) ENGINE=InnoDB;

CREATE TABLE kpi_super_admin (
  scope              VARCHAR(20) PRIMARY KEY,
  total_states       INT,
  total_branches     INT,
  total_patients     INT,
  total_doctors      INT,
  total_appointments INT,
  total_revenue      BIGINT,
  completed_pct      DECIMAL(6,2),
  cancellation_pct   DECIMAL(6,2),
  no_show_pct        DECIMAL(6,2)
) ENGINE=InnoDB;
SHOW GLOBAL VARIABLES LIKE 'local_infile';
SET GLOBAL local_infile = 1;
USE smarthealthcare;

SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM doctors;
SELECT COUNT(*) FROM appointments;
SELECT COUNT(*) FROM admins;
SELECT COUNT(*) FROM branches;
SELECT * FROM patients LIMIT 5;
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM doctors;
SELECT COUNT(*) FROM appointments;