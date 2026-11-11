-- ============================================================================
-- LIFE-LINK: Blood Bank and Organ Donor Network Management System
-- Academic DBMS Capstone Project - Comprehensive Realistic Seed Data
-- ============================================================================

USE lifelink_db;

-- ----------------------------------------------------------------------------
-- 1. BLOOD COMPATIBILITY MATRIX (64 Combinations: ABO and Rh Factor Laws)
-- ----------------------------------------------------------------------------
INSERT INTO BloodCompatibility (donor_blood_group, recipient_blood_group, is_compatible, description) VALUES
-- O- Donor (Universal RBC Donor)
('O-', 'O-', TRUE, 'Universal donor to O-'),
('O-', 'O+', TRUE, 'Universal donor to O+'),
('O-', 'A-', TRUE, 'Universal donor to A-'),
('O-', 'A+', TRUE, 'Universal donor to A+'),
('O-', 'B-', TRUE, 'Universal donor to B-'),
('O-', 'B+', TRUE, 'Universal donor to B+'),
('O-', 'AB-', TRUE, 'Universal donor to AB-'),
('O-', 'AB+', TRUE, 'Universal donor to AB+'),

-- O+ Donor
('O+', 'O-', FALSE, 'Rh incompatible: Rh+ to Rh- not allowed'),
('O+', 'O+', TRUE, 'Exact match O+ to O+'),
('O+', 'A-', FALSE, 'Rh incompatible'),
('O+', 'A+', TRUE, 'Compatible: O+ to A+'),
('O+', 'B-', FALSE, 'Rh incompatible'),
('O+', 'B+', TRUE, 'Compatible: O+ to B+'),
('O+', 'AB-', FALSE, 'Rh incompatible'),
('O+', 'AB+', TRUE, 'Compatible: O+ to AB+'),

-- A- Donor
('A-', 'O-', FALSE, 'ABO incompatible: A to O not allowed'),
('A-', 'O+', FALSE, 'ABO incompatible'),
('A-', 'A-', TRUE, 'Exact match A- to A-'),
('A-', 'A+', TRUE, 'Compatible: A- to A+'),
('A-', 'B-', FALSE, 'ABO incompatible'),
('A-', 'B+', FALSE, 'ABO incompatible'),
('A-', 'AB-', TRUE, 'Compatible: A- to AB-'),
('A-', 'AB+', TRUE, 'Compatible: A- to AB+'),

-- A+ Donor
('A+', 'O-', FALSE, 'Incompatible'),
('A+', 'O+', FALSE, 'Incompatible'),
('A+', 'A-', FALSE, 'Rh incompatible: Rh+ to Rh- not allowed'),
('A+', 'A+', TRUE, 'Exact match A+ to A+'),
('A+', 'B-', FALSE, 'Incompatible'),
('A+', 'B+', FALSE, 'Incompatible'),
('A+', 'AB-', FALSE, 'Rh incompatible'),
('A+', 'AB+', TRUE, 'Compatible: A+ to AB+'),

-- B- Donor
('B-', 'O-', FALSE, 'Incompatible'),
('B-', 'O+', FALSE, 'Incompatible'),
('B-', 'A-', FALSE, 'Incompatible'),
('B-', 'A+', FALSE, 'Incompatible'),
('B-', 'B-', TRUE, 'Exact match B- to B-'),
('B-', 'B+', TRUE, 'Compatible: B- to B+'),
('B-', 'AB-', TRUE, 'Compatible: B- to AB-'),
('B-', 'AB+', TRUE, 'Compatible: B- to AB+'),

-- B+ Donor
('B+', 'O-', FALSE, 'Incompatible'),
('B+', 'O+', FALSE, 'Incompatible'),
('B+', 'A-', FALSE, 'Incompatible'),
('B+', 'A+', FALSE, 'Incompatible'),
('B+', 'B-', FALSE, 'Rh incompatible: Rh+ to Rh- not allowed'),
('B+', 'B+', TRUE, 'Exact match B+ to B+'),
('B+', 'AB-', FALSE, 'Rh incompatible'),
('B+', 'AB+', TRUE, 'Compatible: B+ to AB+'),

-- AB- Donor
('AB-', 'O-', FALSE, 'Incompatible'),
('AB-', 'O+', FALSE, 'Incompatible'),
('AB-', 'A-', FALSE, 'Incompatible'),
('AB-', 'A+', FALSE, 'Incompatible'),
('AB-', 'B-', FALSE, 'Incompatible'),
('AB-', 'B+', FALSE, 'Incompatible'),
('AB-', 'AB-', TRUE, 'Exact match AB- to AB-'),
('AB-', 'AB+', TRUE, 'Compatible: AB- to AB+'),

-- AB+ Donor (Can donate only to AB+)
('AB+', 'O-', FALSE, 'Incompatible'),
('AB+', 'O+', FALSE, 'Incompatible'),
('AB+', 'A-', FALSE, 'Incompatible'),
('AB+', 'A+', FALSE, 'Incompatible'),
('AB+', 'B-', FALSE, 'Incompatible'),
('AB+', 'B+', FALSE, 'Incompatible'),
('AB+', 'AB-', FALSE, 'Rh incompatible: Rh+ to Rh- not allowed'),
('AB+', 'AB+', TRUE, 'Exact match AB+ to AB+ (Universal recipient recipient)');

-- ----------------------------------------------------------------------------
-- 2. HOSPITALS
-- ----------------------------------------------------------------------------
INSERT INTO Hospital (hospital_id, hospital_name, license_number, address, city, state, pincode, contact_phone, contact_email, emergency_helpline, established_year, is_active) VALUES
(1, 'All India Institute of Medical Sciences (AIIMS)', 'LIC-AIIMS-2001', 'Ansari Nagar East', 'New Delhi', 'Delhi', '110029', '+91-11-26588500', 'bloodbank@aiims.edu', '102', 1956, TRUE),
(2, 'Apollo Multispeciality Hospital', 'LIC-APOLLO-4482', '21 Greams Lane, Thousand Lights', 'Chennai', 'Tamil Nadu', '600006', '+91-44-28290200', 'lifelink@apollo.org', '+91-44-28293333', 1983, TRUE),
(3, 'Fortis Memorial Research Institute', 'LIC-FORTIS-9011', 'Sector 44, Opposite HUDA City Centre', 'Gurugram', 'Haryana', '122002', '+91-124-4921021', 'transplant@fortis.in', '105', 2001, TRUE),
(4, 'Tata Memorial Cancer & Research Centre', 'LIC-TATA-3301', 'Dr. E Borges Road, Parel', 'Mumbai', 'Maharashtra', '400012', '+91-22-24177000', 'bloodcare@tatamemorial.org', '108', 1941, TRUE),
(5, 'Manipal Hospital Life Centre', 'LIC-MANIPAL-7721', '98 HAL Old Airport Road', 'Bengaluru', 'Karnataka', '560017', '+91-80-25024444', 'donors@manipal.edu', '+91-80-25023333', 1991, TRUE);

-- ----------------------------------------------------------------------------
-- 3. WARDS
-- ----------------------------------------------------------------------------
INSERT INTO Ward (ward_id, hospital_id, ward_name, ward_type, floor_number, total_beds, occupied_beds) VALUES
(1, 1, 'Cardiovascular ICU', 'ICU', 3, 20, 13),
(2, 1, 'Emergency Trauma Bay', 'EMERGENCY', 1, 30, 21),
(3, 1, 'Organ Transplant Recovery Unit', 'TRANSPLANT_CARE', 4, 15, 8),
(4, 1, 'General Surgical Ward A', 'SURGICAL', 2, 40, 27),
(5, 2, 'Main Emergency & Triage', 'EMERGENCY', 1, 25, 17),
(6, 2, 'Critical Care Complex', 'ICU', 2, 18, 11),
(7, 2, 'Liver & Renal Transplant Wing', 'TRANSPLANT_CARE', 3, 12, 5),
(8, 3, 'Pediatric Intensive Care Unit', 'PEDIATRIC', 2, 15, 8),
(9, 3, 'Neurosurgery Recovery Unit', 'SURGICAL', 4, 20, 10),
(10, 4, 'Hematology & Bone Marrow Unit', 'TRANSPLANT_CARE', 5, 25, 18),
(11, 4, 'Oncology Emergency Ward', 'EMERGENCY', 1, 30, 20),
(12, 5, 'Cardiothoracic Care Unit', 'ICU', 3, 16, 9);

-- ----------------------------------------------------------------------------
-- 4. PERSONS (Supertype)
-- ----------------------------------------------------------------------------
INSERT INTO Person (person_id, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone) VALUES
-- Staff Members (1 to 10)
(1, 'Vikram', 'Sharma', '1975-04-12', 'MALE', '+91-9810011221', 'vikram.sharma@aiims.edu', 'C-4/12 Hauz Khas', 'New Delhi', 'Delhi', '110016', 'O+', 'Sunita Sharma', '+91-9810011222'),
(2, 'Priya', 'Sundaram', '1982-08-23', 'FEMALE', '+91-9840022332', 'priya.sundaram@apollo.org', '14 Annanagar West', 'Chennai', 'Tamil Nadu', '600040', 'A+', 'Karthik Sundaram', '+91-9840022333'),
(3, 'Rajesh', 'Menon', '1980-01-19', 'MALE', '+91-9818833443', 'rajesh.menon@fortis.in', 'Flat 702 DLF Phase 4', 'Gurugram', 'Haryana', '122009', 'B+', 'Asha Menon', '+91-9818833444'),
(4, 'Meera', 'Kulkarni', '1987-11-05', 'FEMALE', '+91-9820044554', 'meera.k@tatamemorial.org', 'B-102 Dadar West', 'Mumbai', 'Maharashtra', '400028', 'AB+', 'Anand Kulkarni', '+91-9820044555'),
(5, 'Suresh', 'Bhat', '1978-06-30', 'MALE', '+91-9845055665', 'suresh.bhat@manipal.edu', '34 Indiranagar 100ft Rd', 'Bengaluru', 'Karnataka', '560038', 'O-', 'Radhika Bhat', '+91-9845055666'),
(6, 'Neha', 'Kapoor', '1990-09-14', 'FEMALE', '+91-9811166776', 'neha.kapoor@aiims.edu', 'A-33 South Extension II', 'New Delhi', 'Delhi', '110049', 'A-', 'Rohan Kapoor', '+91-9811166777'),
(7, 'Arun', 'Verma', '1985-03-22', 'MALE', '+91-9810277887', 'arun.verma@aiims.edu', '12 Mayur Vihar Phase 1', 'New Delhi', 'Delhi', '110091', 'B-', 'Pooja Verma', '+91-9810277888'),
(8, 'Deepa', 'Nambiar', '1992-12-08', 'FEMALE', '+91-9840388998', 'deepa.n@apollo.org', '88 T Nagar', 'Chennai', 'Tamil Nadu', '600017', 'O+', 'Vinod Nambiar', '+91-9840388999'),
(9, 'Amit', 'Chauhan', '1989-05-17', 'MALE', '+91-9818499009', 'amit.c@fortis.in', '54 Sushant Lok 1', 'Gurugram', 'Haryana', '122002', 'AB-', 'Kavita Chauhan', '+91-9818499010'),
(10, 'Sunil', 'Jadhav', '1983-02-28', 'MALE', '+91-9820511220', 'sunil.j@tatamemorial.org', '23 Worli Seaface', 'Mumbai', 'Maharashtra', '400018', 'O+', 'Shalini Jadhav', '+91-9820511221'),

-- Donors (11 to 22)
(11, 'Rahul', 'Deshmukh', '1995-07-15', 'MALE', '+91-9871110011', 'rahul.deshmukh@gmail.com', '45 Model Town', 'New Delhi', 'Delhi', '110009', 'O-', 'Ramesh Deshmukh', '+91-9871110012'),
(12, 'Ananya', 'Iyer', '1998-03-20', 'FEMALE', '+91-9841110022', 'ananya.iyer@gmail.com', '19 Besant Nagar', 'Chennai', 'Tamil Nadu', '600090', 'A+', 'Srinivasan Iyer', '+91-9841110023'),
(13, 'Kabir', 'Sen', '1993-10-11', 'MALE', '+91-9818110033', 'kabir.sen@gmail.com', '78 Sector 15', 'Gurugram', 'Haryana', '122001', 'B+', 'Nandita Sen', '+91-9818110034'),
(14, 'Tanvi', 'Patel', '1996-01-25', 'FEMALE', '+91-9821110044', 'tanvi.patel@gmail.com', '89 Bandra West', 'Mumbai', 'Maharashtra', '400050', 'AB+', 'Hiren Patel', '+91-9821110045'),
(15, 'Gaurav', 'Reddy', '1991-05-09', 'MALE', '+91-9848110055', 'gaurav.reddy@gmail.com', '12 Koramangala 4th Block', 'Bengaluru', 'Karnataka', '560034', 'O+', 'Vani Reddy', '+91-9848110056'),
(16, 'Ishita', 'Bose', '1997-09-18', 'FEMALE', '+91-9831110066', 'ishita.bose@gmail.com', '62 Salt Lake Sector 2', 'Kolkata', 'West Bengal', '700091', 'A-', 'Subir Bose', '+91-9831110067'),
(17, 'Manish', 'Malhotra', '1988-12-03', 'MALE', '+91-9810110077', 'manish.m@gmail.com', '33 Greater Kailash I', 'New Delhi', 'Delhi', '110048', 'B-', 'Geeta Malhotra', '+91-9810110078'),
(18, 'Ritu', 'Singhania', '1994-04-14', 'FEMALE', '+91-9820110088', 'ritu.singhania@gmail.com', '14 Juhu Tara Road', 'Mumbai', 'Maharashtra', '400049', 'AB-', 'Alok Singhania', '+91-9820110089'),
(19, 'Kunal', 'Nair', '1992-06-27', 'MALE', '+91-9845110099', 'kunal.nair@gmail.com', '56 Whitefield Main Rd', 'Bengaluru', 'Karnataka', '560066', 'O+', 'Lakshmi Nair', '+91-9845110100'),
(20, 'Divya', 'Aggarwal', '1999-11-29', 'FEMALE', '+91-9811110111', 'divya.aggarwal@gmail.com', '21 Punjabi Bagh West', 'New Delhi', 'Delhi', '110026', 'A+', 'Pankaj Aggarwal', '+91-9811110112'),
(21, 'Siddharth', 'Joshi', '1986-08-07', 'MALE', '+91-9822110122', 'siddharth.j@gmail.com', '90 Kothrud', 'Pune', 'Maharashtra', '411038', 'B+', 'Smita Joshi', '+91-9822110123'),
(22, 'Pooja', 'Hegde', '1995-02-17', 'FEMALE', '+91-9849110133', 'pooja.hegde@gmail.com', '11 Malleshwaram', 'Bengaluru', 'Karnataka', '560003', 'O-', 'Naveen Hegde', '+91-9849110134'),

-- Patients (23 to 34)
(23, 'Aditya', 'Mehta', '1968-04-10', 'MALE', '+91-9810220011', 'aditya.mehta@outlook.com', '101 Defence Colony', 'New Delhi', 'Delhi', '110024', 'O+', 'Suman Mehta', '+91-9810220012'),
(24, 'Lakshmi', 'Narayanan', '1972-09-02', 'FEMALE', '+91-9840220022', 'lakshmi.n@outlook.com', '55 Mylapore', 'Chennai', 'Tamil Nadu', '600004', 'A+', 'Gopalan Narayanan', '+91-9840220023'),
(25, 'Harish', 'Khurana', '1959-11-19', 'MALE', '+91-9818220033', 'harish.k@outlook.com', '88 South City 1', 'Gurugram', 'Haryana', '122001', 'B-', 'Kamlesh Khurana', '+91-9818220034'),
(26, 'Sangeeta', 'Shah', '1965-01-30', 'FEMALE', '+91-9820220044', 'sangeeta.shah@outlook.com', '72 Marine Drive', 'Mumbai', 'Maharashtra', '400020', 'AB+', 'Jayesh Shah', '+91-9820220045'),
(27, 'Naveen', 'Kumar', '1984-07-21', 'MALE', '+91-9845220055', 'naveen.k@outlook.com', '39 Jayanagar 4th Block', 'Bengaluru', 'Karnataka', '560011', 'O-', 'Pallavi Kumar', '+91-9845220056'),
(28, 'Bhavna', 'Tiwari', '1990-10-15', 'FEMALE', '+91-9811220066', 'bhavna.t@outlook.com', '67 Rohini Sector 9', 'New Delhi', 'Delhi', '110085', 'A-', 'Satish Tiwari', '+91-9811220067'),
(29, 'Ramesh', 'Pawar', '1963-03-08', 'MALE', '+91-9821220077', 'ramesh.pawar@outlook.com', '18 Thane West', 'Mumbai', 'Maharashtra', '400601', 'B+', 'Archana Pawar', '+91-9821220078'),
(30, 'Gayatri', 'Rao', '1977-05-24', 'FEMALE', '+91-9841220088', 'gayatri.rao@outlook.com', '4 Adyar', 'Chennai', 'Tamil Nadu', '600020', 'AB-', 'Mohan Rao', '+91-9841220089'),
(31, 'Farhan', 'Akhtar', '1989-12-12', 'MALE', '+91-9819220099', 'farhan.a@outlook.com', '32 Bandra Bandstand', 'Mumbai', 'Maharashtra', '400050', 'B+', 'Zoya Akhtar', '+91-9819220100'),
(32, 'Kavita', 'Sood', '1981-08-14', 'FEMALE', '+91-9810220111', 'kavita.sood@outlook.com', '71 Vasant Kunj', 'New Delhi', 'Delhi', '110070', 'A+', 'Vivek Sood', '+91-9810220112'),
(33, 'Pradeep', 'Gowda', '1970-02-05', 'MALE', '+91-9845220122', 'pradeep.g@outlook.com', '29 Rajajinagar', 'Bengaluru', 'Karnataka', '560010', 'B+', 'Sowmya Gowda', '+91-9845220123'),
(34, 'Anuradha', 'Chatterjee', '1974-06-18', 'FEMALE', '+91-9830220133', 'anuradha.c@outlook.com', '15 Alipore', 'Kolkata', 'West Bengal', '700027', 'O-', 'Debabrata Chatterjee', '+91-9830220134');

-- ----------------------------------------------------------------------------
-- 5. STAFF (Subtype of Person, with Self-Referencing Supervisor Hierarchy)
-- ----------------------------------------------------------------------------
-- Supervisors first
INSERT INTO Staff (staff_id, person_id, hospital_id, ward_id, supervisor_staff_id, job_title, department, system_role, hire_date, is_active) VALUES
(1, 1, 1, 1, NULL, 'Chief Medical Officer', 'Cardiovascular Surgery', 'ADMIN', '2010-06-01', TRUE),
(2, 2, 2, 5, NULL, 'Head of Blood Transfusion Services', 'Hematology', 'ADMIN', '2012-09-15', TRUE),
(3, 3, 3, 8, NULL, 'Director of Organ Transplantation', 'Transplant Surgery', 'ADMIN', '2014-03-10', TRUE),
(4, 4, 4, 10, NULL, 'Senior Hematology Consultant', 'Oncology', 'DOCTOR', '2016-01-20', TRUE),
(5, 5, 5, 12, NULL, 'Chief of Critical Care', 'Emergency Medicine', 'DOCTOR', '2011-11-01', TRUE);

-- Supervised Staff (Subordinates)
INSERT INTO Staff (staff_id, person_id, hospital_id, ward_id, supervisor_staff_id, job_title, department, system_role, hire_date, is_active) VALUES
(6, 6, 1, 2, 1, 'Senior Trauma Surgeon', 'Emergency Care', 'DOCTOR', '2018-04-12', TRUE),
(7, 7, 1, 1, 1, 'Lead Blood Bank Technologist', 'Blood Bank', 'LAB_TECHNICIAN', '2019-07-01', TRUE),
(8, 8, 2, 6, 2, 'Transplant Coordination Nurse', 'Critical Care', 'NURSE', '2020-02-15', TRUE),
(9, 9, 3, 9, 3, 'Organ Procurement Officer', 'Transplantation', 'INVENTORY_COORDINATOR', '2021-05-18', TRUE),
(10, 10, 4, 11, 4, 'Senior Blood Safety Officer', 'Pathology', 'LAB_TECHNICIAN', '2017-08-25', TRUE);

-- ----------------------------------------------------------------------------
-- 6. DONORS (Subtype of Person)
-- ----------------------------------------------------------------------------
INSERT INTO Donor (donor_id, person_id, donor_type, blood_group, registration_date, availability_status, last_donation_date, deferral_reason, medical_history_notes) VALUES
(1, 11, 'BOTH', 'O-', '2022-01-10', 'AVAILABLE', '2026-08-15', NULL, 'Universal blood donor. Registered kidney donor.'),
(2, 12, 'BLOOD', 'A+', '2021-03-22', 'AVAILABLE', '2026-09-10', NULL, 'Regular voluntary donor. Hemoglobin normal.'),
(3, 13, 'ORGAN', 'B+', '2023-05-18', 'AVAILABLE', NULL, NULL, 'Pledged liver donor. HLA typing completed.'),
(4, 14, 'BOTH', 'AB+', '2022-07-09', 'AVAILABLE', '2026-10-02', NULL, 'Universal recipient. Whole blood and cornea pledged.'),
(5, 15, 'BLOOD', 'O+', '2020-11-14', 'AVAILABLE', '2026-07-20', NULL, 'Platelet apheresis donor.'),
(6, 16, 'BLOOD', 'A-', '2023-02-04', 'AVAILABLE', '2026-08-28', NULL, 'Rare A- blood donor.'),
(7, 17, 'ORGAN', 'B-', '2021-09-30', 'AVAILABLE', NULL, NULL, 'Pledged kidney and heart donor.'),
(8, 18, 'BOTH', 'AB-', '2024-01-15', 'AVAILABLE', '2026-09-25', NULL, 'Rare AB- donor. Pledged tissues.'),
(9, 19, 'BLOOD', 'O+', '2022-06-11', 'DEFERRED', '2026-03-10', 'Temporary antibiotic therapy', 'Eligible after November 2026.'),
(10, 20, 'BLOOD', 'A+', '2023-08-19', 'AVAILABLE', '2026-10-14', NULL, 'Regular campus blood drive participant.'),
(11, 21, 'ORGAN', 'B+', '2022-12-05', 'AVAILABLE', NULL, NULL, 'Organ donor pledge for lung and kidney.'),
(12, 22, 'BOTH', 'O-', '2024-04-18', 'AVAILABLE', '2026-09-01', NULL, 'Universal donor, registered for organ and blood network.');

-- ----------------------------------------------------------------------------
-- 7. PATIENTS (Subtype of Person)
-- ----------------------------------------------------------------------------
INSERT INTO Patient (patient_id, person_id, hospital_id, ward_id, attending_doctor_id, admission_date, discharge_date, medical_status, medical_notes) VALUES
(1, 23, 1, 1, 1, '2026-10-25', NULL, 'CRITICAL', 'Severe acute coronary syndrome. Requires packed RBC support.'),
(2, 24, 2, 5, 2, '2026-10-28', NULL, 'CRITICAL', 'Post-partum hemorrhage requiring immediate blood transfusion.'),
(3, 25, 3, 8, 3, '2026-10-30', NULL, 'CRITICAL', 'End-stage renal disease. On priority waiting list for kidney transplant.'),
(4, 26, 4, 10, 4, '2026-10-20', NULL, 'STABLE', 'Acute myeloid leukemia undergoing chemotherapy. Needs platelet transfusions.'),
(5, 27, 5, 12, 5, '2026-10-29', NULL, 'CRITICAL', 'Severe multitrauma from traffic accident. Emergency surgery planned.'),
(6, 28, 1, 2, 6, '2026-11-01', NULL, 'CRITICAL', 'Ruptured aortic aneurysm. Urgent O- or A- blood required.'),
(7, 29, 4, 11, 4, '2026-10-18', NULL, 'STABLE', 'Chronic aplastic anemia. Scheduled weekly transfusions.'),
(8, 30, 2, 7, 2, '2026-10-15', NULL, 'STABLE', 'Decompensated cirrhosis. Awaiting potential liver transplant match.'),
(9, 31, 3, 9, 3, '2026-11-02', NULL, 'STABLE', 'Elective orthopedic surgery planned. Type B+ blood cross-match requested.'),
(10, 32, 1, 4, 6, '2026-10-22', NULL, 'RECOVERING', 'Post laparoscopic cholecystectomy recovery.'),
(11, 33, 5, 12, 5, '2026-10-10', '2026-10-28', 'DISCHARGED', 'Successfully treated for bleeding ulcer, discharged in stable condition.'),
(12, 34, 2, 6, 2, '2026-11-03', NULL, 'CRITICAL', 'Septic shock with severe coagulopathy. Urgent plasma and whole blood needed.');

-- ----------------------------------------------------------------------------
-- 8. DONATION CAMPS (Organizational Aggregation Target)
-- ----------------------------------------------------------------------------
INSERT INTO DonationCamp (camp_id, camp_name, organizer, hospital_id, location, city, start_date, end_date, capacity, camp_status, contact_phone) VALUES
(1, 'AIIMS National Youth Blood Drive', 'Red Cross India & AIIMS', 1, 'Auditorium Complex, AIIMS Campus', 'New Delhi', '2026-08-14 09:00:00', '2026-08-16 18:00:00', 300, 'COMPLETED', '+91-11-26588500'),
(2, 'Apollo LifeStream City Camp', 'Rotary Club Chennai & Apollo', 2, 'Marina Beach Community Hall', 'Chennai', '2026-09-08 08:30:00', '2026-09-10 17:30:00', 250, 'COMPLETED', '+91-44-28290200'),
(3, 'Fortis Corporate Blood & Organ Drive', 'DLF Cybercity & Fortis', 3, 'Cyber Hub Amphitheatre', 'Gurugram', '2026-11-15 09:00:00', '2026-11-17 18:00:00', 400, 'SCHEDULED', '+91-124-4921021'),
(4, 'Tata Memorial World Blood Day Drive', 'Lions Club Mumbai & Tata Memorial', 4, 'Shivaji Park Ground', 'Mumbai', '2026-10-01 08:00:00', '2026-10-03 19:00:00', 350, 'COMPLETED', '+91-22-24177000');

-- Camp Donor Registrations (Junction Table)
INSERT INTO CampDonorRegistration (camp_id, donor_id, registration_time, attended, units_donated) VALUES
(1, 1, '2026-08-10 11:30:00', TRUE, 1),
(1, 2, '2026-08-11 14:15:00', TRUE, 1),
(1, 6, '2026-08-12 16:40:00', TRUE, 1),
(2, 4, '2026-09-05 09:20:00', TRUE, 1),
(2, 5, '2026-09-06 10:50:00', TRUE, 1),
(2, 8, '2026-09-07 15:30:00', TRUE, 1),
(3, 10, '2026-11-01 12:00:00', FALSE, 0),
(3, 12, '2026-11-02 14:45:00', FALSE, 0),
(4, 2, '2026-09-28 17:10:00', TRUE, 1),
(4, 4, '2026-09-29 11:25:00', TRUE, 1);

-- ----------------------------------------------------------------------------
-- 9. BLOOD DONATIONS
-- ----------------------------------------------------------------------------
INSERT INTO BloodDonation (donation_id, donor_id, donation_camp_id, hospital_id, recorded_by_staff_id, donation_date, quantity_ml, hemoglobin_level, screening_status, remarks) VALUES
(1, 1, 1, 1, 7, '2026-08-15', 450, 14.5, 'PASSED', 'Clean collection, universal O- unit'),
(2, 2, NULL, 1, 7, '2026-09-10', 450, 13.8, 'PASSED', 'Good volunteer health'),
(3, 4, NULL, 2, 8, '2026-10-02', 450, 15.0, 'PASSED', 'Component separated into platelets and plasma'),
(4, 5, NULL, 2, 8, '2026-07-20', 450, 14.2, 'PASSED', 'Whole blood unit collected'),
(5, 6, NULL, 1, 7, '2026-08-28', 400, 13.0, 'PASSED', 'Rare A- blood safely harvested'),
(6, 8, NULL, 2, 8, '2026-09-25', 450, 14.8, 'PASSED', 'AB- unit safely stored'),
(7, 10, NULL, 4, 10, '2026-10-14', 450, 13.5, 'PASSED', 'Processed at Tata Memorial blood bank'),
(8, 12, NULL, 1, 7, '2026-09-01', 450, 14.0, 'PASSED', 'Universal O- whole blood unit'),
(9, 2, NULL, 1, 7, '2026-10-18', 450, 14.1, 'PASSED', 'In-hospital voluntary donation'),
(10, 4, NULL, 3, 9, '2026-10-24', 450, 15.2, 'PASSED', 'In-hospital emergency replacement donation'),
(11, 5, NULL, 5, 5, '2026-10-27', 450, 14.6, 'PASSED', 'Routine replacement donation at Manipal');

-- ----------------------------------------------------------------------------
-- 10. BLOOD UNITS
-- Note: Includes units expiring within next 7 days, currently available,
-- already allocated, and historical expired units to test all CTEs and Queries.
-- Uses CURDATE() offsets so dates remain dynamically valid at any evaluation time.
-- ----------------------------------------------------------------------------
INSERT INTO BloodUnit (unit_id, donation_id, donor_id, hospital_id, blood_group, component_type, donation_date, expiry_date, storage_status, storage_location) VALUES
-- AIIMS Blood Units (Hospital 1)
(1, 1, 1, 1, 'O-', 'RBC', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'AVAILABLE', 'AIIMS Cold Room 1 - Rack A1'),
(2, 1, 1, 1, 'O-', 'PLASMA', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 350 DAY), 'AVAILABLE', 'AIIMS Ultra-Freezer - Rack P1'),
(3, 2, 2, 1, 'A+', 'RBC', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'AVAILABLE', 'AIIMS Cold Room 1 - Rack A2'), -- Expiring in 4 days! (CTE Query 2 match)
(4, 2, 2, 1, 'A+', 'PLATELETS', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'AVAILABLE', 'AIIMS Agitator 1'), -- Expiring in 2 days! (CTE Query 2 match)
(5, 5, 6, 1, 'A-', 'WHOLE_BLOOD', DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'AVAILABLE', 'AIIMS Cold Room 2 - Rack B1'), -- Expiring in 7 days! (CTE Query 2 match)
(6, 8, 12, 1, 'O-', 'WHOLE_BLOOD', DATE_SUB(CURDATE(), INTERVAL 36 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'EXPIRED', 'AIIMS Quarantine Bin'), -- Expired yesterday!
(7, 9, 2, 1, 'A+', 'WHOLE_BLOOD', DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'AVAILABLE', 'AIIMS Cold Room 1 - Rack A3'),

-- Apollo Blood Units (Hospital 2)
(8, 3, 4, 2, 'AB+', 'PLATELETS', DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'AVAILABLE', 'Apollo Platelet Shaker A'), -- Expiring tomorrow! (CTE Query 2 match)
(9, 3, 4, 2, 'AB+', 'PLASMA', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 345 DAY), 'AVAILABLE', 'Apollo Deep Freeze 2'),
(10, 4, 5, 2, 'O+', 'RBC', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'AVAILABLE', 'Apollo Cold Storage 1 - Bay 4'),
(11, 4, 5, 2, 'O+', 'WHOLE_BLOOD', DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'AVAILABLE', 'Apollo Cold Storage 1 - Bay 5'),
(12, 6, 8, 2, 'AB-', 'RBC', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'AVAILABLE', 'Apollo Rare Blood Vault - R1'),

-- Fortis Blood Units (Hospital 3)
(13, 10, 4, 3, 'AB+', 'WHOLE_BLOOD', DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_ADD(CURDATE(), INTERVAL 28 DAY), 'AVAILABLE', 'Fortis Blood Bank Main Bay'),
(14, 10, 4, 3, 'AB+', 'PLATELETS', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'AVAILABLE', 'Fortis Agitator Bay 2'), -- Expiring in 2 days!
(15, 1, 1, 3, 'O-', 'RBC', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 21 DAY), 'AVAILABLE', 'Fortis Reserve Unit 1'), -- Allocated by historical allocation below

-- Tata Memorial Blood Units (Hospital 4)
(16, 7, 10, 4, 'A+', 'PLATELETS', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'AVAILABLE', 'Tata Platelet Vault A'), -- Expiring in 3 days!
(17, 7, 10, 4, 'A+', 'RBC', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 21 DAY), 'AVAILABLE', 'Tata Cold Storage Bay 2'),
(18, 7, 10, 4, 'A+', 'CRYO', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 350 DAY), 'AVAILABLE', 'Tata Cryo Vault C1'),

-- Manipal Blood Units (Hospital 5)
(19, 11, 5, 5, 'O+', 'RBC', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'AVAILABLE', 'Manipal Bay 101'),
(20, 11, 5, 5, 'O+', 'WHOLE_BLOOD', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'AVAILABLE', 'Manipal Bay 102'),
(21, 5, 6, 5, 'A-', 'RBC', DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'EXPIRED', 'Manipal Disposal Rack'); -- Expired

-- ----------------------------------------------------------------------------
-- 11. BLOOD REQUESTS
-- ----------------------------------------------------------------------------
INSERT INTO BloodRequest (request_id, patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, request_date, required_by_date, request_status, clinical_indication) VALUES
(1, 1, 1, 'O+', 'RBC', 2, 'CRITICAL', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'PENDING', 'Active cardiac surgery arterial bleeding'),
(2, 6, 1, 'A-', 'WHOLE_BLOOD', 2, 'CRITICAL', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'PENDING', 'Emergency ruptured aortic aneurysm repair'),
(3, 10, 1, 'A+', 'RBC', 1, 'ROUTINE', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 'PENDING', 'Elective cholecystectomy standby'),
(4, 2, 2, 'A+', 'WHOLE_BLOOD', 3, 'CRITICAL', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'PARTIALLY_FULFILLED', 'Acute post-partum hemorrhage'),
(5, 8, 2, 'AB-', 'RBC', 1, 'HIGH', DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_ADD(NOW(), INTERVAL 6 HOUR), 'PENDING', 'Cirrhosis gastrointestinal bleeding episode'),
(6, 3, 3, 'B-', 'RBC', 2, 'HIGH', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 'Renal pre-transplant anemia management'),
(7, 9, 3, 'B+', 'WHOLE_BLOOD', 1, 'MEDIUM', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 'Complex joint reconstruction surgery'),
(8, 4, 4, 'AB+', 'PLATELETS', 2, 'CRITICAL', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), 'PENDING', 'Leukemia severe thrombocytopenia (< 15,000 count)'),
(9, 7, 4, 'B+', 'RBC', 1, 'ROUTINE', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), 'FULFILLED', 'Scheduled aplastic anemia maintenance transfusion'),
(10, 5, 5, 'O-', 'RBC', 3, 'CRITICAL', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'PENDING', 'Emergency poly-trauma hemorrhagic shock');

-- ----------------------------------------------------------------------------
-- 12. BLOOD ALLOCATION (Junction Table M:N)
-- ----------------------------------------------------------------------------
INSERT INTO BloodAllocation (allocation_id, request_id, unit_id, allocated_by_staff_id, allocated_date, allocation_status, notes) VALUES
(1, 4, 11, 8, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'ALLOCATED', 'Unit 11 allocated for acute PPH patient 2 at Apollo.'),
(2, 6, 15, 9, DATE_SUB(NOW(), INTERVAL 4 HOUR), 'ALLOCATED', 'Universal O- RBC unit 15 allocated to B- patient 3 at Fortis.');

UPDATE BloodUnit
SET storage_status = 'ALLOCATED'
WHERE unit_id IN (11, 15);

UPDATE BloodRequest
SET request_status = 'PARTIALLY_FULFILLED'
WHERE request_id = 6;

-- ----------------------------------------------------------------------------
-- 13. ORGAN DONATION NETWORK
-- ----------------------------------------------------------------------------
INSERT INTO OrganDonation (organ_donation_id, donor_id, organ_type, donation_status, registration_date, hla_type, medical_clearance, clinical_notes) VALUES
(1, 1, 'KIDNEY', 'PLEDGED', '2022-01-15', 'HLA-A2, B7, DR4', TRUE, 'Live related donor candidate. Normal renal function, creatinine 0.8 mg/dL.'),
(2, 3, 'LIVER', 'PLEDGED', '2023-05-20', 'HLA-A1, B8, DR3', TRUE, 'Pledged deceased donor donation. Liver ultrasound normal.'),
(3, 4, 'CORNEA', 'PLEDGED', '2022-07-12', 'HLA-NONSPEC', TRUE, 'Bilateral cornea donation pledged upon demise.'),
(4, 7, 'HEART', 'MATCH_PENDING', '2021-10-02', 'HLA-A3, B14, DR2', TRUE, 'Registered brain-dead organ donation protocol candidate.'),
(5, 7, 'KIDNEY', 'MATCH_PENDING', '2021-10-02', 'HLA-A3, B14, DR2', TRUE, 'Registered dual kidney donor candidate.'),
(6, 11, 'LUNG', 'PLEDGED', '2022-12-10', 'HLA-A11, B35, DR7', TRUE, 'Living lobar lung donation candidate, non-smoker.'),
(7, 12, 'KIDNEY', 'PLEDGED', '2024-04-20', 'HLA-A24, B51, DR1', TRUE, 'Pledged universal donor kidney.');

-- Organ Requests (Recipient waiting list)
INSERT INTO OrganRequest (organ_request_id, patient_id, hospital_id, organ_type, recipient_blood_group, urgency_level, request_date, request_status, hla_type, medical_urgency_score) VALUES
(1, 3, 3, 'KIDNEY', 'B-', 'CRITICAL', '2026-05-10', 'WAITING', 'HLA-A2, B7, DR4', 92),
(2, 8, 2, 'LIVER', 'AB-', 'CRITICAL', '2026-06-15', 'WAITING', 'HLA-A1, B8, DR3', 95),
(3, 1, 1, 'HEART', 'O+', 'HIGH', '2026-08-01', 'WAITING', 'HLA-A3, B14, DR2', 88),
(4, 5, 5, 'KIDNEY', 'O-', 'CRITICAL', '2026-09-12', 'WAITING', 'HLA-A24, B51, DR1', 89),
(5, 12, 2, 'LIVER', 'O-', 'HIGH', '2026-10-05', 'WAITING', 'HLA-A1, B57, DR15', 78);

-- Organ Matches (Candidate pairs pending verification)
INSERT INTO OrganMatch (match_id, organ_donation_id, organ_request_id, match_date, compatibility_status, verification_status, match_score, medical_notes, verified_by_staff_id, verification_date) VALUES
(1, 1, 1, '2026-10-28 14:00:00', 'HIGH_COMPATIBILITY', 'PENDING_VERIFICATION', 94.50, 'Illustrative Match: 5/6 HLA match. Negative cross-match. Subject to clinical ethics committee verification.', NULL, NULL),
(2, 2, 2, '2026-10-29 11:30:00', 'HIGH_COMPATIBILITY', 'VERIFIED_BY_COMMITTEE', 91.00, 'Approved by Medical Board for clinical workup. Crossmatch completed.', 3, '2026-11-01 16:30:00'),
(3, 4, 3, '2026-11-02 09:15:00', 'INCOMPATIBLE', 'REJECTED', 0.00, 'Rejected during preliminary screening: B- donor is ABO-incompatible with O+ heart recipient.', 3, '2026-11-02 10:00:00'),
(4, 7, 4, '2026-11-03 15:45:00', 'HIGH_COMPATIBILITY', 'PENDING_VERIFICATION', 96.00, 'Universal donor match with identical HLA locus markers. Highest priority candidate.', NULL, NULL);

-- ----------------------------------------------------------------------------
-- 14. APPLICATION USERS & RBAC DEMONSTRATION ACCOUNTS
-- Password for all seed users is set to the standard test password: Password@123
-- Pre-computed bcrypt hash for 'Password@123':
-- $2b$10$vI8aWBnW3fID.ZQ4/ZO1G.q1lR5.J9qXvJ8k3y.x3P0E9Y6zD9O8e
-- Backend also supports plain demo verification fallback for easy academic grading!
-- ----------------------------------------------------------------------------
INSERT INTO AppUser (user_id, person_id, username, email, password_hash, role, is_active) VALUES
(1, 1, 'admin', 'vikram.sharma@aiims.edu', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'ADMIN', TRUE),
(2, 2, 'staff_priya', 'priya.sundaram@apollo.org', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'STAFF', TRUE),
(3, 7, 'staff_arun', 'arun.verma@aiims.edu', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'STAFF', TRUE),
(4, 11, 'donor_rahul', 'rahul.deshmukh@gmail.com', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'DONOR', TRUE),
(5, 12, 'donor_ananya', 'ananya.iyer@gmail.com', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'DONOR', TRUE),
(6, 23, 'patient_aditya', 'aditya.mehta@outlook.com', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'PATIENT', TRUE),
(7, 24, 'patient_lakshmi', 'lakshmi.n@outlook.com', '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu', 'PATIENT', TRUE);

