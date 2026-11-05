# LIFE-LINK Database Architecture & Schema Documentation

## Academic Capstone Project: Blood Bank & Organ Donor Network Management System
**Database Name:** `lifelink_db`  
**Engine:** MySQL 8.0 (InnoDB)  
**Character Set & Collation:** `utf8mb4` / `utf8mb4_unicode_ci`  

---

## 1. Architectural Overview & Conceptual Design

The **LIFE-LINK** system is designed to provide a high-integrity, centralized relational platform for medical blood inventory logistics and organ donor network candidate matching. Unlike trivial flat-file or unnormalized data stores, LIFE-LINK leverages rigorous relational theory:
- **Third Normal Form (3NF) / BCNF compliance** across all functional dependencies.
- **Explicit Supertype/Subtype Relational Specialization** for persons and roles.
- **UML/EER Aggregation Modeling** for organized donation camps and donor participation.
- **Many-to-Many Decomposition** with strong junction entities maintaining state and audit trails.
- **ACID Transaction Management** with row-level locks (`SELECT ... FOR UPDATE`) preventing double-allocation race conditions.

---

## 2. Person Specialization Architecture

### Supertype: `Person`
Contains intrinsic human demographic attributes common to all human participants in the hospital network:
- `person_id` (PK, INT AUTO_INCREMENT)
- `first_name`, `last_name` (VARCHAR(100), NOT NULL)
- `date_of_birth` (DATE, NOT NULL)
- `gender` (ENUM('MALE', 'FEMALE', 'OTHER'), NOT NULL)
- `phone` (VARCHAR(20), NOT NULL, UNIQUE)
- `email` (VARCHAR(100), NOT NULL, UNIQUE)
- `address`, `city`, `state`, `pincode` (NOT NULL)
- `blood_group` (ENUM, NOT NULL)
- `emergency_contact_name`, `emergency_contact_phone` (VARCHAR, NULL)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Subtypes: `Donor`, `Patient`, `Staff`
- **Design Decision: Overlapping Specialization with Shared Primary Key References**
- **Justification:** In healthcare networks, a staff member (e.g., Doctor Vikram) can also be an active voluntary blood donor (`Donor`), or an admitted inpatient (`Patient`). If disjoint specialization had been enforced, separate records would be required, introducing identity duplication, conflicting contact information, and demographic anomalies.
- **Implementation Strategy:**
  - `Donor`, `Patient`, and `Staff` each maintain a primary key (`donor_id`, `patient_id`, `staff_id`) while having `person_id` configured as a **`FOREIGN KEY REFERENCES Person(person_id)` with a `UNIQUE` constraint**.
  - This 1:0..1 mapping per subtype allows a single person to exist in zero, one, or multiple roles without duplicating demographic data.

---

## 3. Hospital & Ward Infrastructure

### Entity: `Hospital`
Represents participating medical centers, university teaching hospitals, and regional trauma facilities.
- `hospital_id` (PK)
- `hospital_name`, `license_number` (UNIQUE)
- `address`, `city`, `state`, `pincode`
- `contact_phone`, `contact_email` (UNIQUE), `emergency_helpline`
- `established_year` (CHECK 1800 <= established_year <= 2100)

### Entity: `Ward`
Represents inpatient hospital wards and specialized critical care wings.
- `ward_id` (PK)
- `hospital_id` (FK -> Hospital, ON DELETE CASCADE)
- `ward_name` (VARCHAR, UNIQUE per hospital)
- `ward_type` (ENUM: ICU, EMERGENCY, SURGICAL, GENERAL_MALE, GENERAL_FEMALE, PEDIATRIC, TRANSPLANT_CARE)
- `floor_number` (INT)
- `total_beds` (INT, CHECK > 0)
- `occupied_beds` (INT, CHECK >= 0 AND occupied_beds <= total_beds)

### Recursive Relationship: `Staff` Hierarchy
- `supervisor_staff_id` (FK -> Staff(staff_id), ON DELETE SET NULL)
- Allows recursive organizational querying (Self-Join) to map executive leadership to attending physicians, senior nurses, and technicians.

---

## 4. Donation Camp Aggregation Modeling

### The Aggregation Concept
In Enhanced Entity-Relationship (EER) modeling, **Aggregation** abstracts a relationship between multiple entities into a higher-level composite object that can itself participate in relationships with other entities.

In LIFE-LINK:
1. `DonationCamp` (organized by a `Hospital` at a specific location and timeframe) is combined with donor registrations (`CampDonorRegistration`).
2. Together, the camp event and registered donors form a **Donation Drive Aggregation Object**.
3. This aggregated drive object directly generates collection activities (`BloodDonation` where `donation_camp_id` is set), yielding batch blood units that flow into the hospital bank.

### Entity: `DonationCamp`
- `camp_id` (PK)
- `camp_name`, `organizer`
- `hospital_id` (FK -> Hospital)
- `location`, `city`
- `start_date`, `end_date` (CHECK end_date >= start_date)
- `capacity` (CHECK capacity > 0)
- `camp_status` (ENUM: SCHEDULED, ACTIVE, COMPLETED, CANCELLED)

### Junction Entity: `CampDonorRegistration`
- `registration_id` (PK)
- `camp_id` (FK -> DonationCamp)
- `donor_id` (FK -> Donor)
- `registration_time` (DATETIME)
- `attended` (BOOLEAN)
- `units_donated` (INT, DEFAULT 0)
- `UNIQUE KEY (camp_id, donor_id)`

---

## 5. Blood Bank Logistics & Allocation M:N Junction

```
[Donor] --(1:N)--> [BloodDonation] --(1:N)--> [BloodUnit]
                                                  |
                                             (0..1:1)
                                                  v
[Patient] --(1:N)--> [BloodRequest] --(1:N)--> [BloodAllocation]
```

### Entity: `BloodDonation`
Records clinical collection of blood, pre-screening hemoglobin, and screening safety flags.
- `quantity_ml` (CHECK 300 <= quantity_ml <= 550)
- `hemoglobin_level` (CHECK >= 10.0)
- `screening_status` (ENUM: PASSED, FAILED, PENDING)

### Entity: `BloodUnit`
Physical blood unit bag stored in temperature-controlled vaults.
- `blood_group` (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `component_type` (WHOLE_BLOOD, RBC, PLATELETS, PLASMA, CRYO)
- `donation_date`, `expiry_date` (CHECK expiry_date >= donation_date)
- `storage_status` (AVAILABLE, RESERVED, ALLOCATED, EXPIRED, DISCARDED)
- `storage_location` (VARCHAR)
- `hospital_id` (FK -> Hospital)

### Entity: `BloodRequest`
Clinical blood orders issued by attending doctors for admitted patients.
- `units_required` (INT, CHECK > 0)
- `urgency_level` (CRITICAL, HIGH, MEDIUM, ROUTINE)
- `request_date`, `required_by_date` (CHECK required_by_date >= request_date)
- `request_status` (PENDING, PARTIALLY_FULFILLED, FULFILLED, CANCELLED)

### Junction Entity: `BloodAllocation`
Resolves the **Many-to-Many** relationship between `BloodRequest` and `BloodUnit`.
- A request can require 2 or more units (1:N from BloodRequest to BloodAllocation).
- Each `BloodUnit` can be allocated to at most **one** request at any given time. This is strictly enforced via a **`UNIQUE KEY (unit_id)`** constraint.
- `allocated_by_staff_id` (FK -> Staff) guarantees medical accountability and traceability.

---

## 6. Organ Donation & Matching Network

> **Important Clinical Disclaimer:**  
> LIFE-LINK organ matching algorithms are purely illustrative demonstration tools for academic DBMS evaluation. The database strictly enforces `verification_status = 'PENDING_VERIFICATION'` upon candidate generation, prohibiting automatic medical allocation without authorized medical board review.

### Entity: `OrganDonation`
- `donor_id` (FK -> Donor)
- `organ_type` (KIDNEY, LIVER, HEART, LUNG, PANCREAS, CORNEA)
- `donation_status` (REGISTERED, PLEDGED, MATCH_PENDING, ALLOCATED, COMPLETED, WITHDRAWN)
- `hla_type` (Human Leukocyte Antigen loci markers)
- `medical_clearance` (BOOLEAN)

### Entity: `OrganRequest`
- `patient_id` (FK -> Patient)
- `hospital_id` (FK -> Hospital)
- `organ_type`, `recipient_blood_group`
- `urgency_level`, `medical_urgency_score` (CHECK 1 <= score <= 100)
- `request_status` (WAITING, MATCH_PROPOSED, VERIFIED, TRANSPLANTED, CANCELLED)

### Entity: `OrganMatch`
- `match_id` (PK)
- `organ_donation_id` (FK -> OrganDonation)
- `organ_request_id` (FK -> OrganRequest)
- `compatibility_status` (POTENTIAL_MATCH, HIGH_COMPATIBILITY, LOW_COMPATIBILITY, INCOMPATIBLE)
- `verification_status` (PENDING_VERIFICATION, VERIFIED_BY_COMMITTEE, REJECTED, TRANSPLANT_SCHEDULED)
- `match_score` (DECIMAL(5,2), 0.00 to 100.00)
- `verified_by_staff_id` (FK -> Staff, NULL until approved)
- `UNIQUE KEY (organ_donation_id, organ_request_id)`

---

## 7. Advanced SQL Implementation Summary

| ID | Technique | Target Problem | Key Syntax / Features |
|---|---|---|---|
| **Query 1** | Window Function | Hospital blood request urgency prioritization | `DENSE_RANK() OVER (PARTITION BY hospital_id ORDER BY urgency, waiting_time)` |
| **Query 2** | Common Table Expression (CTE) | Blood unit shelf life and expiry tracking (< 7 days) | `WITH ExpiringUnitsCTE AS (...) SELECT ... WHERE expiry_date <= NOW() + 7 DAYS` |
| **Query 3** | CTE & Conditional Aggregation | Hospital-level blood inventory breakdown | `WITH HospitalBloodStats AS (...) SELECT SUM(CASE WHEN ...)` |
| **Query 4** | View & Data Masking | Sensitive donor privacy protection | `CREATE VIEW vw_public_donor_directory AS SELECT donor_id, CONCAT(LEFT(first_name, 1), '. ', last_name)...` |
| **Query 5** | Indexing & Query Plans | Optimization of high-frequency blood search | `INDEX idx_blood_unit_blood_group`, `EXPLAIN SELECT ...` |
| **Query 6** | Joins (Inner, Left, Right, Self) | Relational traversals and staff supervision | `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `Staff s1 LEFT JOIN Staff s2` |
| **Query 7** | Aggregations & Filtering | Camp performance benchmarking | `COUNT()`, `SUM()`, `AVG()`, `GROUP BY`, `HAVING COUNT() >= 2` |
| **Query 8** | Subqueries (Scalar, IN, Correlated) | Data integrity and exception detection | Scalar avg hb subquery, `NOT IN (SELECT patient_id FROM BloodRequest)`, `EXISTS` |
| **Query 9** | ACID Transaction & Stored Proc | Race-free blood allocation with verification | `START TRANSACTION`, `SELECT ... FOR UPDATE`, compatibility verification, `COMMIT`/`ROLLBACK` |

---

## 8. Role-Based Access Control (RBAC) Mapping

| Entity / Action | Admin | Hospital Staff | Donor | Patient |
|---|:---:|:---:|:---:|:---:|
| System Configuration & Hospitals | Full (CRUD) | Read Only | None | None |
| Ward Management & Occupancy | Full (CRUD) | Update Beds | None | None |
| Full Person Demographics | Full (CRUD) | Medical View | Own Profile Only | Own Profile Only |
| Public Donor Directory | Full | Full | Read (Masked) | Read (Masked) |
| Blood Unit Allocation | Full | Authorized Only | None | None |
| Organ Match Verification | Full | Board Authorized | None | None |
| Blood Request Submission | Full | Authorized Staff | None | Submit Own |
| Donation Camp Registration | Full | Manage | Register Self | None |

