-- ============================================================================
-- LIFE-LINK: Blood Bank and Organ Donor Network Management System
-- DBMS Capstone Project: Section 5 - Mandatory Advanced SQL Queries
-- ============================================================================

USE lifelink_db;

-- ============================================================================
-- QUERY 1: WINDOW FUNCTION – URGENCY & WAITING TIME RANKING
-- ============================================================================
-- Purpose:
-- Uses DENSE_RANK() to compute hospital-specific priority queues for pending blood
-- requests. It weights medical urgency as the primary partition ordering and
-- waiting time (request_date ASC) as the secondary tie-breaker.
--
-- Display Attributes:
-- - Request ID
-- - Hospital
-- - Patient Name
-- - Blood Group
-- - Urgency Level
-- - Waiting Time (Hours)
-- - Priority Rank within Hospital
-- ============================================================================

SELECT 
    br.request_id,
    h.hospital_name,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    br.blood_group,
    br.component_type,
    br.units_required,
    br.urgency_level,
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
    ) AS hospital_priority_rank
FROM BloodRequest br
JOIN Hospital h ON br.hospital_id = h.hospital_id
JOIN Patient pt ON br.patient_id = pt.patient_id
JOIN Person p ON pt.person_id = p.person_id
WHERE br.request_status IN ('PENDING', 'PARTIALLY_FULFILLED')
ORDER BY h.hospital_name, hospital_priority_rank;


-- ============================================================================
-- QUERY 2: CTE (COMMON TABLE EXPRESSION) – BLOOD EXPIRY TRACKING
-- ============================================================================
-- Purpose:
-- Uses a WITH clause to identify viable blood units expiring within the next
-- 7 days. This allows blood bank managers to initiate rapid transfusions or
-- inter-hospital transfers before wastage occurs.
--
-- Exclusions:
-- - Excludes already expired units (expiry_date < CURDATE())
-- - Excludes allocated, reserved, or discarded units
-- ============================================================================

WITH ExpiringUnitsCTE AS (
    SELECT 
        bu.unit_id,
        h.hospital_name,
        bu.blood_group,
        bu.component_type,
        bu.donation_date,
        bu.expiry_date,
        DATEDIFF(bu.expiry_date, CURDATE()) AS remaining_shelf_life_days,
        bu.storage_location
    FROM BloodUnit bu
    JOIN Hospital h ON bu.hospital_id = h.hospital_id
    WHERE bu.storage_status = 'AVAILABLE'
      AND bu.expiry_date >= CURDATE()
      AND bu.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
)
SELECT 
    unit_id,
    hospital_name,
    blood_group,
    component_type,
    donation_date,
    expiry_date,
    remaining_shelf_life_days,
    storage_location,
    CASE 
        WHEN remaining_shelf_life_days <= 2 THEN 'CRITICAL ALERT: EXPIRES IN <= 48 HOURS'
        WHEN remaining_shelf_life_days <= 4 THEN 'URGENT ATTENTION: EXPIRES IN <= 4 DAYS'
        ELSE 'MONITOR: EXPIRES WITHIN 7 DAYS'
    END AS action_recommendation
FROM ExpiringUnitsCTE
ORDER BY remaining_shelf_life_days ASC, blood_group ASC;


-- ============================================================================
-- QUERY 3: CTE – HOSPITAL-WISE BLOOD INVENTORY SUMMARY
-- ============================================================================
-- Purpose:
-- Employs CTEs to calculate hospital-wise and blood-group-wise aggregation:
-- - Total available units
-- - Blood-group-wise breakdown
-- - Expired units
-- - Units expiring soon (within 7 days)
-- ============================================================================

WITH HospitalBloodStats AS (
    SELECT 
        h.hospital_id,
        h.hospital_name,
        h.city,
        bu.blood_group,
        SUM(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() THEN 1 ELSE 0 END) AS available_units,
        SUM(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_soon_7d,
        SUM(CASE WHEN bu.storage_status = 'EXPIRED' OR (bu.storage_status = 'AVAILABLE' AND bu.expiry_date < CURDATE()) THEN 1 ELSE 0 END) AS expired_units,
        SUM(CASE WHEN bu.storage_status = 'ALLOCATED' THEN 1 ELSE 0 END) AS allocated_units,
        COUNT(bu.unit_id) AS total_units_cataloged
    FROM Hospital h
    LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id
    GROUP BY h.hospital_id, h.hospital_name, h.city, bu.blood_group
)
SELECT 
    hospital_name,
    city,
    IFNULL(blood_group, 'N/A') AS blood_group,
    available_units,
    expiring_soon_7d,
    expired_units,
    allocated_units,
    total_units_cataloged
FROM HospitalBloodStats
ORDER BY hospital_name, blood_group;


-- ============================================================================
-- QUERY 4: SENSITIVE DATA PROTECTION (VIEW & ACCESS CONTROL)
-- ============================================================================
-- Purpose:
-- Masks sensitive personal information (phone, email, full address, medical history)
-- and exposes only safe, aggregated attributes for public verification.
-- ============================================================================

-- View Definition (already created in schema, presented here for standalone query execution)
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

-- Querying the Public Safe View
SELECT * FROM vw_public_donor_directory
ORDER BY blood_group, city;


-- ============================================================================
-- QUERY 5: INDEXING & EXPLAIN EXECUTION PLAN DEMONSTRATION
-- ============================================================================
-- Purpose:
-- Demonstrates query optimization using single-column and composite indexes.
-- Index 1: BloodUnit(blood_group)
-- Index 2: BloodRequest(urgency_level, request_date)
-- ============================================================================

-- Query 5A: Searching Blood Units by Blood Group using Index
EXPLAIN SELECT unit_id, blood_group, component_type, storage_status, hospital_id
FROM BloodUnit
WHERE blood_group = 'O-' AND storage_status = 'AVAILABLE';

-- Query 5B: Filtering Pending Blood Requests by Urgency and Date Range using Composite Index
EXPLAIN SELECT request_id, hospital_id, patient_id, blood_group, urgency_level, request_date
FROM BloodRequest
WHERE urgency_level = 'CRITICAL' AND request_date >= DATE_SUB(NOW(), INTERVAL 48 HOUR);


-- ============================================================================
-- QUERY 6: ADVANCED JOIN OPERATIONS (INNER, LEFT, RIGHT, SELF JOIN)
-- ============================================================================

-- 6A: INNER JOIN – Active Blood Allocations with Donor, Patient, and Staff Details
SELECT 
    ba.allocation_id,
    ba.allocated_date,
    CONCAT(patient_person.first_name, ' ', patient_person.last_name) AS recipient_patient,
    br.blood_group AS requested_blood_group,
    bu.unit_id AS allocated_unit_id,
    bu.blood_group AS unit_blood_group,
    CONCAT(donor_person.first_name, ' ', donor_person.last_name) AS blood_donor,
    CONCAT(staff_person.first_name, ' ', staff_person.last_name) AS authorizing_staff
FROM BloodAllocation ba
INNER JOIN BloodRequest br ON ba.request_id = br.request_id
INNER JOIN Patient pt ON br.patient_id = pt.patient_id
INNER JOIN Person patient_person ON pt.person_id = patient_person.person_id
INNER JOIN BloodUnit bu ON ba.unit_id = bu.unit_id
INNER JOIN Donor d ON bu.donor_id = d.donor_id
INNER JOIN Person donor_person ON d.person_id = donor_person.person_id
INNER JOIN Staff s ON ba.allocated_by_staff_id = s.staff_id
INNER JOIN Person staff_person ON s.person_id = staff_person.person_id;

-- 6B: LEFT JOIN – Hospitals and all organized Camps (including hospitals with zero camps)
SELECT 
    h.hospital_name,
    h.city,
    c.camp_id,
    c.camp_name,
    c.camp_status,
    c.capacity
FROM Hospital h
LEFT JOIN DonationCamp c ON h.hospital_id = c.hospital_id
ORDER BY h.hospital_name;

-- 6C: RIGHT JOIN – All Donation Camps and Participating Donors (including camps with zero registered donors)
SELECT 
    dc.camp_name,
    dc.city,
    dc.start_date,
    cdr.registration_id,
    d.donor_id,
    p.first_name AS donor_first_name,
    cdr.attended,
    cdr.units_donated
FROM CampDonorRegistration cdr
INNER JOIN Donor d ON cdr.donor_id = d.donor_id
INNER JOIN Person p ON d.person_id = p.person_id
RIGHT JOIN DonationCamp dc ON cdr.camp_id = dc.camp_id
ORDER BY dc.camp_name;

-- 6D: SELF JOIN – Staff Supervision Hierarchy (Employee -> Supervisor)
SELECT 
    subordinate.staff_id AS employee_staff_id,
    CONCAT(sub_p.first_name, ' ', sub_p.last_name) AS employee_name,
    subordinate.job_title AS employee_title,
    subordinate.department AS department,
    h.hospital_name,
    IFNULL(CONCAT(sup_p.first_name, ' ', sup_p.last_name), 'Top Hospital Executive / Self-Directed') AS supervisor_name,
    IFNULL(supervisor.job_title, 'N/A') AS supervisor_title
FROM Staff subordinate
INNER JOIN Person sub_p ON subordinate.person_id = sub_p.person_id
INNER JOIN Hospital h ON subordinate.hospital_id = h.hospital_id
LEFT JOIN Staff supervisor ON subordinate.supervisor_staff_id = supervisor.staff_id
LEFT JOIN Person sup_p ON supervisor.person_id = sup_p.person_id
ORDER BY h.hospital_name, subordinate.supervisor_staff_id;


-- ============================================================================
-- QUERY 7: AGGREGATE FUNCTIONS WITH GROUP BY AND HAVING
-- ============================================================================
-- Purpose:
-- Computes camp-wise performance statistics and filters for high-impact
-- donation camps where average hemoglobin is above 13.5 and total blood
-- units donated exceeds 1 unit.
-- ============================================================================

SELECT 
    dc.camp_id,
    dc.camp_name,
    h.hospital_name,
    COUNT(bd.donation_id) AS total_donations_collected,
    SUM(bd.quantity_ml) AS total_blood_collected_ml,
    ROUND(AVG(bd.hemoglobin_level), 2) AS average_donor_hemoglobin,
    MIN(bd.quantity_ml) AS min_donation_ml,
    MAX(bd.quantity_ml) AS max_donation_ml
FROM DonationCamp dc
JOIN Hospital h ON dc.hospital_id = h.hospital_id
JOIN BloodDonation bd ON dc.camp_id = bd.donation_camp_id
WHERE bd.screening_status = 'PASSED'
GROUP BY dc.camp_id, dc.camp_name, h.hospital_name
HAVING COUNT(bd.donation_id) >= 2;


-- ============================================================================
-- QUERY 8: ADVANCED SUBQUERIES (SCALAR, UNCORRELATED IN, AND CORRELATED)
-- ============================================================================

-- 8A: Scalar Subquery – Donors with Hemoglobin higher than the overall network average
SELECT 
    d.donor_id,
    CONCAT(p.first_name, ' ', p.last_name) AS donor_name,
    bd.donation_date,
    bd.hemoglobin_level,
    (SELECT ROUND(AVG(hemoglobin_level), 2) FROM BloodDonation WHERE screening_status = 'PASSED') AS overall_network_avg_hb
FROM BloodDonation bd
JOIN Donor d ON bd.donor_id = d.donor_id
JOIN Person p ON d.person_id = p.person_id
WHERE bd.hemoglobin_level > (SELECT AVG(hemoglobin_level) FROM BloodDonation WHERE screening_status = 'PASSED')
ORDER BY bd.hemoglobin_level DESC;

-- 8B: Uncorrelated Subquery with IN – Patients who have never made a blood request
SELECT 
    pt.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    h.hospital_name,
    pt.medical_status,
    pt.admission_date
FROM Patient pt
JOIN Person p ON pt.person_id = p.person_id
JOIN Hospital h ON pt.hospital_id = h.hospital_id
WHERE pt.patient_id NOT IN (
    SELECT DISTINCT patient_id 
    FROM BloodRequest 
    WHERE patient_id IS NOT NULL
);

-- 8C: Correlated Subquery with EXISTS – Hospitals that currently have at least one critical blood request
SELECT 
    h.hospital_id,
    h.hospital_name,
    h.city,
    h.emergency_helpline
FROM Hospital h
WHERE EXISTS (
    SELECT 1 
    FROM BloodRequest br 
    WHERE br.hospital_id = h.hospital_id 
      AND br.urgency_level = 'CRITICAL'
      AND br.request_status = 'PENDING'
);


-- ============================================================================
-- QUERY 9: TRANSACTIONAL BLOOD ALLOCATION WITH ROW LOCKING
-- ============================================================================
-- Purpose:
-- Tests the ACID transactional stored procedure created in schema.sql.
-- Demonstrates row locking (SELECT ... FOR UPDATE), compatibility validation,
-- expiry verification, and status updates with COMMIT / ROLLBACK semantics.
-- ============================================================================

SET @p_status_code = 0;
SET @p_status_message = '';

-- Test Execution: Allocate Blood Unit 1 (O- RBC) to Request 1 (O+ Critical patient at AIIMS)
-- Compatible because O- is universal donor to O+
CALL sp_allocate_blood_unit(1, 1, 7, 'Allocated by Lead Technologist Arun Verma', @p_status_code, @p_status_message);

-- Inspect Procedure Result
SELECT @p_status_code AS transaction_result_code, @p_status_message AS transaction_result_message;

