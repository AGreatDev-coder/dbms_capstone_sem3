-- LIFE-LINK demo importer for 400 synthetic patients
-- Run AFTER database/schema.sql and database/seed_data.sql.
-- Update the CSV path for your machine. Enable LOCAL INFILE in your MySQL client.
USE lifelink_db;

DROP TEMPORARY TABLE IF EXISTS tmp_lifelink_patients;
CREATE TEMPORARY TABLE tmp_lifelink_patients (
  person_id INT, patient_id INT, first_name VARCHAR(100), last_name VARCHAR(100),
  date_of_birth DATE, gender VARCHAR(10), phone VARCHAR(20), email VARCHAR(100),
  address VARCHAR(255), city VARCHAR(100), state VARCHAR(100), pincode VARCHAR(10),
  blood_group VARCHAR(3), emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20), hospital_id INT, ward_id INT,
  attending_doctor_id INT NULL, admission_date DATE, discharge_date DATE NULL,
  medical_status VARCHAR(20), medical_notes TEXT
);

-- Replace the path below with an absolute path, e.g. C:/Users/YourName/Downloads/lifelink_400_synthetic_patients.csv
LOAD DATA LOCAL INFILE 'C:/PATH/TO/lifelink_400_synthetic_patients.csv'
INTO TABLE tmp_lifelink_patients
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(person_id, patient_id, first_name, last_name, date_of_birth, gender, phone, email,
 address, city, state, pincode, blood_group, emergency_contact_name,
 emergency_contact_phone, hospital_id, ward_id, @doctor, admission_date,
 @discharge, medical_status, medical_notes)
SET attending_doctor_id = NULLIF(@doctor, ''),
    discharge_date = NULLIF(@discharge, '');

-- Insert in parent-to-child order. Explicit ID ranges avoid collision with current seed IDs.
INSERT INTO Person
(person_id, first_name, last_name, date_of_birth, gender, phone, email, address,
 city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
SELECT person_id, first_name, last_name, date_of_birth, gender, phone, email, address,
 city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone
FROM tmp_lifelink_patients;

INSERT INTO Patient
(patient_id, person_id, hospital_id, ward_id, attending_doctor_id, admission_date,
 discharge_date, medical_status, medical_notes)
SELECT patient_id, person_id, hospital_id, ward_id, attending_doctor_id, admission_date,
 discharge_date, medical_status, medical_notes
FROM tmp_lifelink_patients;

SELECT COUNT(*) AS imported_patients FROM Patient WHERE patient_id BETWEEN 20001 AND 20400;
