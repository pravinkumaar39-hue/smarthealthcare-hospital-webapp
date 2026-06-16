-- Run after schema.sql.
-- Loads all CSVs from ./output into the smarthealthcare database.
--
-- Usage:
--   mysql --local-infile=1 -u root -p smarthealthcare < mysql_import.sql
-- The CSV path is relative to the MySQL server's working directory; adjust
-- the LOAD DATA paths if running remotely.

USE smarthealthcare;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;

LOAD DATA LOCAL INFILE 'output/branches.csv' INTO TABLE branches
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/patients.csv' INTO TABLE patients
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/doctors.csv' INTO TABLE doctors
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/doctor_availability.csv' INTO TABLE doctor_availability
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/admins.csv' INTO TABLE admins
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES
  (admin_id, name, email, phone, role, scope, @branch_id, @city)
  SET branch_id = NULLIF(@branch_id,''), city = NULLIF(@city,'');

LOAD DATA LOCAL INFILE 'output/appointments.csv' INTO TABLE appointments
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/medical_history.csv' INTO TABLE medical_history
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/hospital_events.csv' INTO TABLE hospital_events
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/notifications.csv' INTO TABLE notifications
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/ai_chat_history.csv' INTO TABLE ai_chat_history
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/bed_occupancy.csv' INTO TABLE bed_occupancy
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/readmission_stats.csv' INTO TABLE readmission_stats
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/branch_utilization.csv' INTO TABLE branch_utilization
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/doctor_workload.csv' INTO TABLE doctor_workload
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES
  (doctor_id, department, branch_id, appointments, first_name, last_name, workload_score);

LOAD DATA LOCAL INFILE 'output/kpi_city_admin.csv' INTO TABLE kpi_city_admin
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/kpi_state_admin.csv' INTO TABLE kpi_state_admin
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

LOAD DATA LOCAL INFILE 'output/kpi_super_admin.csv' INTO TABLE kpi_super_admin
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n'
  IGNORE 1 LINES;

SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;