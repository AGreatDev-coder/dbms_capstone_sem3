-- ============================================================================
-- LIFE-LINK: Blood Bank and Organ Donor Network Management System
-- DBMS Capstone Project - MySQL 8.0 DDL Schema Definition
-- Database Name: lifelink_db
-- ============================================================================

DROP DATABASE IF EXISTS lifelink_db;
CREATE DATABASE lifelink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lifelink_db;

-- ----------------------------------------------------------------------------
-- 1. REFERENCE DATA: Blood Compatibility Matrix
-- Standard Red Blood Cell (RBC) compatibility reference
-- ----------------------------------------------------------------------------
CREATE TABLE BloodCompatibility (
    compatibility_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    recipient_blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    is_compatible BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(100) NULL,
    CONSTRAINT uq_compatibility UNIQUE (donor_blood_group, recipient_blood_group)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. HOSPITAL MANAGEMENT ENTITIES
-- ----------------------------------------------------------------------------
CREATE TABLE Hospital (
    hospital_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100) NOT NULL UNIQUE,
    emergency_helpline VARCHAR(20) NOT NULL,
    established_year INT NOT NULL CHECK (established_year >= 1800 AND established_year <= 2100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Ward (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    ward_type ENUM('ICU', 'EMERGENCY', 'SURGICAL', 'GENERAL_MALE', 'GENERAL_FEMALE', 'PEDIATRIC', 'TRANSPLANT_CARE') NOT NULL,
    floor_number INT NOT NULL,
    total_beds INT NOT NULL CHECK (total_beds > 0),
    occupied_beds INT NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0 AND occupied_beds <= total_beds),
    CONSTRAINT fk_ward_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE CASCADE,
    CONSTRAINT uq_hospital_ward UNIQUE (hospital_id, ward_name)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. PERSON SPECIALIZATION HIERARCHY
-- Supertype: Person
-- Specialization Technique: Overlapping Specialization via subtype extension tables
-- Justification: A single person can logically be a Donor, a Patient, and/or Staff.
-- Using subtype tables with a 1:1 foreign key to Person prevents duplicate personal
-- identity records while maintaining strict relational integrity.
-- ----------------------------------------------------------------------------
CREATE TABLE Person (
    person_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    emergency_contact_name VARCHAR(100) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Subtype 1: Staff
CREATE TABLE Staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    ward_id INT NULL,
    supervisor_staff_id INT NULL,
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    system_role ENUM('ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'INVENTORY_COORDINATOR') NOT NULL,
    hire_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_staff_person FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT,
    CONSTRAINT fk_staff_ward FOREIGN KEY (ward_id) REFERENCES Ward(ward_id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_supervisor FOREIGN KEY (supervisor_staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Subtype 2: Patient
CREATE TABLE Patient (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    ward_id INT NULL,
    attending_doctor_id INT NULL,
    admission_date DATE NOT NULL,
    discharge_date DATE NULL,
    medical_status ENUM('CRITICAL', 'STABLE', 'RECOVERING', 'DISCHARGED') NOT NULL DEFAULT 'STABLE',
    medical_notes TEXT NULL,
    CONSTRAINT fk_patient_person FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT,
    CONSTRAINT fk_patient_ward FOREIGN KEY (ward_id) REFERENCES Ward(ward_id) ON DELETE SET NULL,
    CONSTRAINT fk_patient_doctor FOREIGN KEY (attending_doctor_id) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_discharge_date CHECK (discharge_date IS NULL OR discharge_date >= admission_date)
) ENGINE=InnoDB;

-- Subtype 3: Donor
CREATE TABLE Donor (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL UNIQUE,
    donor_type ENUM('BLOOD', 'ORGAN', 'BOTH') NOT NULL DEFAULT 'BLOOD',
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    registration_date DATE NOT NULL,
    availability_status ENUM('AVAILABLE', 'DEFERRED', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    last_donation_date DATE NULL,
    deferral_reason VARCHAR(255) NULL,
    medical_history_notes TEXT NULL,
    CONSTRAINT fk_donor_person FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. DONATION CAMP & AGGREGATION
-- DonationCamp represents an organizational aggregation node linking donors,
-- camp participation, hospital organizers, and resulting donations.
-- ----------------------------------------------------------------------------
CREATE TABLE DonationCamp (
    camp_id INT AUTO_INCREMENT PRIMARY KEY,
    camp_name VARCHAR(150) NOT NULL,
    organizer VARCHAR(150) NOT NULL,
    hospital_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    camp_status ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    contact_phone VARCHAR(20) NOT NULL,
    CONSTRAINT fk_camp_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT,
    CONSTRAINT chk_camp_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB;

-- Junction Table: CampDonorRegistration
CREATE TABLE CampDonorRegistration (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    camp_id INT NOT NULL,
    donor_id INT NOT NULL,
    registration_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    units_donated INT NOT NULL DEFAULT 0 CHECK (units_donated >= 0),
    CONSTRAINT fk_reg_camp FOREIGN KEY (camp_id) REFERENCES DonationCamp(camp_id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_donor FOREIGN KEY (donor_id) REFERENCES Donor(donor_id) ON DELETE CASCADE,
    CONSTRAINT uq_camp_donor UNIQUE (camp_id, donor_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. BLOOD BANK MANAGEMENT ENTITIES
-- ----------------------------------------------------------------------------
CREATE TABLE BloodDonation (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    donation_camp_id INT NULL,
    hospital_id INT NOT NULL,
    recorded_by_staff_id INT NULL,
    donation_date DATE NOT NULL,
    quantity_ml INT NOT NULL CHECK (quantity_ml >= 300 AND quantity_ml <= 550),
    hemoglobin_level DECIMAL(4,1) NOT NULL CHECK (hemoglobin_level >= 10.0),
    screening_status ENUM('PASSED', 'FAILED', 'PENDING') NOT NULL DEFAULT 'PENDING',
    adverse_reactions VARCHAR(255) NULL,
    remarks VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donation_donor FOREIGN KEY (donor_id) REFERENCES Donor(donor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_donation_camp FOREIGN KEY (donation_camp_id) REFERENCES DonationCamp(camp_id) ON DELETE SET NULL,
    CONSTRAINT fk_donation_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT,
    CONSTRAINT fk_donation_staff FOREIGN KEY (recorded_by_staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE BloodUnit (
    unit_id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    donor_id INT NOT NULL,
    hospital_id INT NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component_type ENUM('WHOLE_BLOOD', 'RBC', 'PLATELETS', 'PLASMA', 'CRYO') NOT NULL DEFAULT 'WHOLE_BLOOD',
    donation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    storage_status ENUM('AVAILABLE', 'RESERVED', 'ALLOCATED', 'EXPIRED', 'DISCARDED') NOT NULL DEFAULT 'AVAILABLE',
    storage_location VARCHAR(100) NOT NULL DEFAULT 'Cold Storage Section A1',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_unit_donation FOREIGN KEY (donation_id) REFERENCES BloodDonation(donation_id) ON DELETE CASCADE,
    CONSTRAINT fk_unit_donor FOREIGN KEY (donor_id) REFERENCES Donor(donor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_unit_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT,
    CONSTRAINT chk_unit_expiry CHECK (expiry_date >= donation_date)
) ENGINE=InnoDB;

CREATE TABLE BloodRequest (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    hospital_id INT NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component_type ENUM('WHOLE_BLOOD', 'RBC', 'PLATELETS', 'PLASMA', 'CRYO') NOT NULL DEFAULT 'WHOLE_BLOOD',
    units_required INT NOT NULL CHECK (units_required > 0),
    urgency_level ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE') NOT NULL DEFAULT 'MEDIUM',
    request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    required_by_date DATETIME NOT NULL,
    request_status ENUM('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    clinical_indication VARCHAR(255) NULL,
    CONSTRAINT fk_req_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_req_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT,
    CONSTRAINT chk_req_dates CHECK (required_by_date >= request_date)
) ENGINE=InnoDB;

-- Junction Table: BloodAllocation (Implements M:N relationship between BloodRequest and BloodUnit)
-- A BloodUnit can only be allocated once (enforced by UNIQUE on unit_id)
CREATE TABLE BloodAllocation (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    unit_id INT NOT NULL UNIQUE,
    allocated_by_staff_id INT NOT NULL,
    allocated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    allocation_status ENUM('ALLOCATED', 'TRANSFUSED', 'RETURNED', 'DISCARDED') NOT NULL DEFAULT 'ALLOCATED',
    notes VARCHAR(255) NULL,
    CONSTRAINT fk_alloc_request FOREIGN KEY (request_id) REFERENCES BloodRequest(request_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_unit FOREIGN KEY (unit_id) REFERENCES BloodUnit(unit_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_staff FOREIGN KEY (allocated_by_staff_id) REFERENCES Staff(staff_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. ORGAN DONATION NETWORK ENTITIES
-- ----------------------------------------------------------------------------
CREATE TABLE OrganDonation (
    organ_donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    organ_type ENUM('KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS', 'CORNEA') NOT NULL,
    donation_status ENUM('REGISTERED', 'PLEDGED', 'MATCH_PENDING', 'ALLOCATED', 'COMPLETED', 'WITHDRAWN') NOT NULL DEFAULT 'PLEDGED',
    registration_date DATE NOT NULL,
    hla_type VARCHAR(50) NULL,
    medical_clearance BOOLEAN NOT NULL DEFAULT FALSE,
    clinical_notes TEXT NULL,
    CONSTRAINT fk_organ_donor FOREIGN KEY (donor_id) REFERENCES Donor(donor_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE OrganRequest (
    organ_request_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    hospital_id INT NOT NULL,
    organ_type ENUM('KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS', 'CORNEA') NOT NULL,
    recipient_blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    urgency_level ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE') NOT NULL DEFAULT 'HIGH',
    request_date DATE NOT NULL,
    request_status ENUM('WAITING', 'MATCH_PROPOSED', 'VERIFIED', 'TRANSPLANTED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    hla_type VARCHAR(50) NULL,
    medical_urgency_score INT NOT NULL DEFAULT 50 CHECK (medical_urgency_score >= 1 AND medical_urgency_score <= 100),
    CONSTRAINT fk_organ_req_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_organ_req_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE OrganMatch (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    organ_donation_id INT NOT NULL,
    organ_request_id INT NOT NULL,
    match_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    compatibility_status ENUM('POTENTIAL_MATCH', 'HIGH_COMPATIBILITY', 'LOW_COMPATIBILITY', 'INCOMPATIBLE') NOT NULL DEFAULT 'POTENTIAL_MATCH',
    verification_status ENUM('PENDING_VERIFICATION', 'VERIFIED_BY_COMMITTEE', 'REJECTED', 'TRANSPLANT_SCHEDULED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    match_score DECIMAL(5,2) NOT NULL DEFAULT 75.00 CHECK (match_score >= 0.00 AND match_score <= 100.00),
    medical_notes TEXT NULL,
    verified_by_staff_id INT NULL,
    verification_date DATETIME NULL,
    CONSTRAINT fk_match_donation FOREIGN KEY (organ_donation_id) REFERENCES OrganDonation(organ_donation_id) ON DELETE RESTRICT,
    CONSTRAINT fk_match_request FOREIGN KEY (organ_request_id) REFERENCES OrganRequest(organ_request_id) ON DELETE RESTRICT,
    CONSTRAINT fk_match_staff FOREIGN KEY (verified_by_staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT uq_donation_request_match UNIQUE (organ_donation_id, organ_request_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. APPLICATION USERS & RBAC AUTHENTICATION
-- Roles: ADMIN, STAFF, DONOR, PATIENT
-- ----------------------------------------------------------------------------
CREATE TABLE AppUser (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF', 'DONOR', 'PATIENT') NOT NULL DEFAULT 'PATIENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_person FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. INDEXING ARCHITECTURE
-- Indexes optimized for high-performance retrieval and search operations
-- ----------------------------------------------------------------------------

-- Mandatory Index 1: blood_group on BloodUnit
CREATE INDEX idx_blood_unit_blood_group ON BloodUnit(blood_group);

-- Mandatory Index 2: composite index on urgency_level and request_date on BloodRequest
CREATE INDEX idx_blood_request_urgency_date ON BloodRequest(urgency_level, request_date);

-- Supporting Indexes for Query Optimization
CREATE INDEX idx_blood_unit_status_expiry ON BloodUnit(storage_status, expiry_date);
CREATE INDEX idx_blood_unit_hospital ON BloodUnit(hospital_id);
CREATE INDEX idx_blood_request_status_hosp ON BloodRequest(request_status, hospital_id);
CREATE INDEX idx_person_blood_group ON Person(blood_group);
CREATE INDEX idx_staff_hospital ON Staff(hospital_id);
CREATE INDEX idx_patient_hospital_ward ON Patient(hospital_id, ward_id);
CREATE INDEX idx_organ_req_type_status ON OrganRequest(organ_type, request_status);

-- ----------------------------------------------------------------------------
-- 9. ADVANCED VIEWS
-- ----------------------------------------------------------------------------

-- Query 4 / Mandatory View: Sensitive Data Protection
-- Exposes ONLY public/safe donor attributes without exposing phone, email, full address, or medical notes
CREATE OR REPLACE VIEW vw_public_donor_directory AS
SELECT 
    d.donor_id,
    CONCAT(LEFT(p.first_name, 1), '. ', p.last_name) AS approved_display_name,
    p.gender,
    p.city,
    p.state,
    d.blood_group,
    d.donor_type,
    d.availability_status,
    d.registration_date
FROM Donor d
JOIN Person p ON d.person_id = p.person_id
WHERE d.availability_status != 'INACTIVE';

-- View: Hospital Blood Inventory Summary (Used for instant reporting)
CREATE OR REPLACE VIEW vw_hospital_inventory_summary AS
SELECT 
    h.hospital_id,
    h.hospital_name,
    h.city,
    bu.blood_group,
    COUNT(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() THEN 1 END) AS available_units,
    COUNT(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) AS expiring_soon_7d,
    COUNT(CASE WHEN bu.storage_status = 'EXPIRED' OR (bu.storage_status = 'AVAILABLE' AND bu.expiry_date < CURDATE()) THEN 1 END) AS expired_units,
    COUNT(CASE WHEN bu.storage_status = 'ALLOCATED' THEN 1 END) AS allocated_units,
    COUNT(*) AS total_units_recorded
FROM Hospital h
LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id
GROUP BY h.hospital_id, h.hospital_name, h.city, bu.blood_group;

-- View: Blood Request Urgency Rankings (Window Function View)
CREATE OR REPLACE VIEW vw_blood_request_priority_ranks AS
SELECT 
    br.request_id,
    br.hospital_id,
    h.hospital_name,
    br.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    br.blood_group,
    br.component_type,
    br.units_required,
    br.urgency_level,
    br.request_date,
    TIMESTAMPDIFF(HOUR, br.request_date, NOW()) AS waiting_time_hours,
    DENSE_RANK() OVER (
        PARTITION BY br.hospital_id
        ORDER BY 
            CASE br.urgency_level 
                WHEN 'CRITICAL' THEN 1 
                WHEN 'HIGH' THEN 2 
                WHEN 'MEDIUM' THEN 3 
                WHEN 'ROUTINE' THEN 4 
                ELSE 5 
            END ASC,
            br.request_date ASC
    ) AS priority_rank
FROM BloodRequest br
JOIN Hospital h ON br.hospital_id = h.hospital_id
JOIN Patient pt ON br.patient_id = pt.patient_id
JOIN Person p ON pt.person_id = p.person_id
WHERE br.request_status IN ('PENDING', 'PARTIALLY_FULFILLED');

-- ----------------------------------------------------------------------------
-- 10. DATABASE TRIGGERS
-- ----------------------------------------------------------------------------

DELIMITER $$

-- Trigger 1: Prevent Allocation of Expired Blood Units
CREATE TRIGGER trg_prevent_expired_allocation
BEFORE INSERT ON BloodAllocation
FOR EACH ROW
BEGIN
    DECLARE v_expiry_date DATE;
    DECLARE v_status VARCHAR(20);

    SELECT expiry_date, storage_status 
    INTO v_expiry_date, v_status
    FROM BloodUnit 
    WHERE unit_id = NEW.unit_id;

    IF v_expiry_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Violation: Cannot allocate an expired blood unit.';
    END IF;

    IF v_status != 'AVAILABLE' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Violation: Blood unit is not available for allocation.';
    END IF;
END$$

-- Trigger 2: Ward Bed Occupancy Increment on Patient Admission
CREATE TRIGGER trg_after_patient_insert_occupancy
AFTER INSERT ON Patient
FOR EACH ROW
BEGIN
    IF NEW.ward_id IS NOT NULL AND NEW.medical_status != 'DISCHARGED' THEN
        UPDATE Ward 
        SET occupied_beds = LEAST(total_beds, occupied_beds + 1)
        WHERE ward_id = NEW.ward_id;
    END IF;
END$$

-- Trigger 3: Ward Bed Occupancy Adjustment on Patient Discharge or Ward Transfer
CREATE TRIGGER trg_after_patient_update_occupancy
AFTER UPDATE ON Patient
FOR EACH ROW
BEGIN
    -- If ward changed
    IF OLD.ward_id IS NOT NULL AND (NEW.ward_id IS NULL OR NEW.ward_id != OLD.ward_id) THEN
        UPDATE Ward 
        SET occupied_beds = GREATEST(0, occupied_beds - 1)
        WHERE ward_id = OLD.ward_id;
    END IF;
    
    IF NEW.ward_id IS NOT NULL AND (OLD.ward_id IS NULL OR NEW.ward_id != OLD.ward_id) AND NEW.medical_status != 'DISCHARGED' THEN
        UPDATE Ward 
        SET occupied_beds = LEAST(total_beds, occupied_beds + 1)
        WHERE ward_id = NEW.ward_id;
    END IF;

    -- If patient was discharged
    IF OLD.medical_status != 'DISCHARGED' AND NEW.medical_status = 'DISCHARGED' AND NEW.ward_id IS NOT NULL THEN
        UPDATE Ward 
        SET occupied_beds = GREATEST(0, occupied_beds - 1)
        WHERE ward_id = NEW.ward_id;
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- 11. STORED PROCEDURES (ACID TRANSACTION DEMONSTRATION)
-- Query 9 / Advanced Requirement: Transactional Blood Allocation
-- Uses Row-Level Locking (SELECT ... FOR UPDATE) and Blood Compatibility Checking
-- ----------------------------------------------------------------------------

CREATE PROCEDURE sp_allocate_blood_unit(
    IN p_request_id INT,
    IN p_unit_id INT,
    IN p_staff_id INT,
    IN p_notes VARCHAR(255),
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_req_blood_group VARCHAR(10);
    DECLARE v_unit_blood_group VARCHAR(10);
    DECLARE v_unit_status VARCHAR(20);
    DECLARE v_unit_expiry DATE;
    DECLARE v_is_compatible INT DEFAULT 0;
    DECLARE v_req_status VARCHAR(20);
    DECLARE v_units_required INT;
    DECLARE v_already_allocated INT;

    -- Default exit handler for SQLEXCEPTION: rollback and set error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_status_message = 'Database Error: Transaction rolled back due to SQL exception.';
    END;

    -- Start ACID Transaction
    START TRANSACTION;

    -- 1. Check Request validity and acquire row lock
    SELECT blood_group, request_status, units_required
    INTO v_req_blood_group, v_req_status, v_units_required
    FROM BloodRequest
    WHERE request_id = p_request_id
    FOR UPDATE;

    IF v_req_blood_group IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_message = 'Request not found.';
        LEAVE proc_label;
    END IF;

    IF v_req_status = 'FULFILLED' OR v_req_status = 'CANCELLED' THEN
        ROLLBACK;
        SET p_status_code = 400;
        SET p_status_message = 'Cannot allocate: Blood request is already fulfilled or cancelled.';
        LEAVE proc_label;
    END IF;

    -- 2. Check Blood Unit availability and acquire row lock
    SELECT blood_group, storage_status, expiry_date
    INTO v_unit_blood_group, v_unit_status, v_unit_expiry
    FROM BloodUnit
    WHERE unit_id = p_unit_id
    FOR UPDATE;

    IF v_unit_blood_group IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_status_message = 'Blood unit not found.';
        LEAVE proc_label;
    END IF;

    IF v_unit_status != 'AVAILABLE' THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_status_message = CONCAT('Blood unit is not available (Current status: ', v_unit_status, ').');
        LEAVE proc_label;
    END IF;

    IF v_unit_expiry < CURDATE() THEN
        -- Mark as expired in inventory and rollback allocation
        UPDATE BloodUnit SET storage_status = 'EXPIRED' WHERE unit_id = p_unit_id;
        COMMIT;
        SET p_status_code = 410;
        SET p_status_message = 'Blood unit has expired. Allocation aborted and unit marked as EXPIRED.';
        LEAVE proc_label;
    END IF;

    -- 3. Validate Compatibility using BloodCompatibility Matrix
    SELECT COUNT(*)
    INTO v_is_compatible
    FROM BloodCompatibility
    WHERE donor_blood_group = v_unit_blood_group
      AND recipient_blood_group = v_req_blood_group
      AND is_compatible = TRUE;

    IF v_is_compatible = 0 THEN
        ROLLBACK;
        SET p_status_code = 422;
        SET p_status_message = CONCAT('Incompatible Blood Groups: Donor (', v_unit_blood_group, ') cannot donate to Recipient (', v_req_blood_group, ').');
        LEAVE proc_label;
    END IF;

    -- 4. Create Allocation Record
    INSERT INTO BloodAllocation (request_id, unit_id, allocated_by_staff_id, allocated_date, allocation_status, notes)
    VALUES (p_request_id, p_unit_id, p_staff_id, NOW(), 'ALLOCATED', p_notes);

    -- 5. Update Blood Unit Status
    UPDATE BloodUnit
    SET storage_status = 'ALLOCATED'
    WHERE unit_id = p_unit_id;

    -- 6. Check total allocated units for this request
    SELECT COUNT(*)
    INTO v_already_allocated
    FROM BloodAllocation
    WHERE request_id = p_request_id AND allocation_status = 'ALLOCATED';

    -- 7. Update Request Status
    IF v_already_allocated >= v_units_required THEN
        UPDATE BloodRequest
        SET request_status = 'FULFILLED'
        WHERE request_id = p_request_id;
    ELSE
        UPDATE BloodRequest
        SET request_status = 'PARTIALLY_FULFILLED'
        WHERE request_id = p_request_id;
    END IF;

    -- Commit Transaction
    COMMIT;
    SET p_status_code = 200;
    SET p_status_message = CONCAT('Blood unit ', p_unit_id, ' successfully allocated to request ', p_request_id, '.');
END$$

DELIMITER ;

