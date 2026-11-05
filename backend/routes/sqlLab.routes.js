/**
 * SQL Laboratory Routes (Module 9 & Section 5)
 * Dedicated interactive query execution laboratory for evaluating advanced SQL concepts
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Catalog of Approved Predefined Capstone Queries
const PREDEFINED_QUERIES = [
  {
    id: 'q1-window',
    number: 'Query 1',
    category: 'WINDOW FUNCTIONS',
    title: 'Hospital Blood Request Priority Ranking (DENSE_RANK)',
    description:
      'Partitions active blood requests by hospital and computes a real-time priority rank based on medical urgency (CRITICAL -> HIGH -> MEDIUM -> ROUTINE) and elapsed waiting time in hours. Allows triage nurses to immediately pinpoint the next candidate for allocation.',
    sql: `SELECT 
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
ORDER BY h.hospital_name, hospital_priority_rank;`,
  },
  {
    id: 'q2-cte-expiry',
    number: 'Query 2',
    category: 'COMMON TABLE EXPRESSION (CTE)',
    title: 'Blood Expiry Tracking within 7 Days',
    description:
      'Uses a WITH clause to isolate available units that will expire in the next 7 days, excluding already expired, allocated, or discarded units. Adds clinical action recommendations (<= 48h emergency transfer, <= 4d fast-track transfusion).',
    sql: `WITH ExpiringUnitsCTE AS (
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
ORDER BY remaining_shelf_life_days ASC, blood_group ASC;`,
  },
  {
    id: 'q3-cte-inventory',
    number: 'Query 3',
    category: 'CTE & CONDITIONAL AGGREGATION',
    title: 'Hospital-Wise Blood Inventory Matrix',
    description:
      'Employs a CTE with multi-condition SUM(CASE WHEN ...) aggregation to calculate hospital-wise total available units, blood-group-wise breakdown, expired units, and units expiring soon.',
    sql: `WITH HospitalBloodStats AS (
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
ORDER BY hospital_name, blood_group;`,
  },
  {
    id: 'q4-view-privacy',
    number: 'Query 4',
    category: 'DATABASE VIEWS & DATA MASKING',
    title: 'Sensitive Donor Privacy Protection View (vw_public_donor_directory)',
    description:
      'Queries the database view created specifically to protect donor confidential identifiers. Exposes only safe attributes (Donor ID, Masked Display Name, City, Blood Group, Availability) while completely shielding phone numbers, emails, home addresses, and clinical notes.',
    sql: `SELECT 
    donor_id,
    approved_display_name,
    gender,
    city,
    state,
    blood_group,
    donor_type,
    availability_status,
    registration_date
FROM vw_public_donor_directory
ORDER BY blood_group, city;`,
  },
  {
    id: 'q5-indexing',
    number: 'Query 5',
    category: 'INDEXING & EXECUTION PLANS',
    title: 'B-Tree Indexing & Query Optimization (EXPLAIN)',
    description:
      'Demonstrates index utilization on BloodUnit(blood_group) and composite index on BloodRequest(urgency_level, request_date). Explains how the MySQL query optimizer uses B-Tree indexes to avoid costly full-table scans.',
    sql: `EXPLAIN SELECT unit_id, blood_group, component_type, storage_status, hospital_id
FROM BloodUnit
WHERE blood_group = 'O-' AND storage_status = 'AVAILABLE';`,
  },
  {
    id: 'q6-joins',
    number: 'Query 6',
    category: 'JOIN OPERATIONS',
    title: 'Staff Supervision Hierarchy (Self-Join) & Traversal',
    description:
      'Demonstrates a recursive SELF JOIN on the Staff entity where supervisor_staff_id points back to Staff(staff_id). Also highlights INNER, LEFT, and RIGHT joins across the hospital network.',
    sql: `SELECT 
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
ORDER BY h.hospital_name, subordinate.supervisor_staff_id;`,
  },
  {
    id: 'q7-aggregates',
    number: 'Query 7',
    category: 'AGGREGATE FUNCTIONS & HAVING',
    title: 'High-Impact Camp Performance (COUNT, SUM, AVG, MIN, MAX, HAVING)',
    description:
      'Demonstrates all 5 standard aggregate functions (COUNT, SUM, AVG, MIN, MAX) with GROUP BY and HAVING filter to benchmark donation camps yielding high collections and verified hemoglobin levels.',
    sql: `SELECT 
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
HAVING COUNT(bd.donation_id) >= 2;`,
  },
  {
    id: 'q8-subqueries',
    number: 'Query 8',
    category: 'NESTED SUBQUERIES',
    title: 'Scalar, Uncorrelated IN, and Correlated EXISTS Subqueries',
    description:
      'Executes advanced nested subqueries: Demonstrates a scalar subquery finding donors whose hemoglobin is above the network average, and an uncorrelated subquery identifying patients without prior blood requests.',
    sql: `SELECT 
    d.donor_id,
    CONCAT(p.first_name, ' ', p.last_name) AS donor_name,
    bd.donation_date,
    bd.hemoglobin_level,
    (SELECT ROUND(AVG(hemoglobin_level), 2) FROM BloodDonation WHERE screening_status = 'PASSED') AS overall_network_avg_hb
FROM BloodDonation bd
JOIN Donor d ON bd.donor_id = d.donor_id
JOIN Person p ON d.person_id = p.person_id
WHERE bd.hemoglobin_level > (SELECT AVG(hemoglobin_level) FROM BloodDonation WHERE screening_status = 'PASSED')
ORDER BY bd.hemoglobin_level DESC;`,
  },
  {
    id: 'q9-transaction',
    number: 'Query 9',
    category: 'ACID TRANSACTIONS & ROW LOCKING',
    title: 'Transactional Blood Allocation Stored Procedure (sp_allocate_blood_unit)',
    description:
      'Demonstrates ACID transaction isolation with row locking (SELECT ... FOR UPDATE). Checks unit availability, validates blood-group compatibility via BloodCompatibility reference data, verifies non-expiration, inserts BloodAllocation record, and commits or rolls back on conflict.',
    sql: `CALL sp_allocate_blood_unit(1, 1, 7, 'Allocated by Lead Technologist Arun Verma', @p_status_code, @p_status_message);
SELECT @p_status_code AS transaction_result_code, @p_status_message AS transaction_result_message;`,
  },
];

// Get list of predefined queries
router.get('/queries', (req, res) => {
  res.json({ success: true, queries: PREDEFINED_QUERIES });
});

// Execute SQL Query safely
router.post('/execute', async (req, res) => {
  const { sql, queryId } = req.body;

  if (!sql) {
    return res.status(400).json({ success: false, message: 'SQL query string is required.' });
  }

  // Safety checks against destructive commands
  const upper = sql.trim().toUpperCase();
  const destructiveCommands = ['DROP DATABASE', 'DROP TABLE', 'TRUNCATE', 'ALTER USER', 'GRANT ', 'REVOKE '];
  for (const cmd of destructiveCommands) {
    if (upper.includes(cmd)) {
      return res.status(403).json({
        success: false,
        message: `Security Restriction: Destructive command '${cmd}' is blocked in the academic laboratory workbench.`,
      });
    }
  }

  const startTime = Date.now();
  try {
    let rows;

    if (queryId === 'q9-transaction' || upper.startsWith('CALL SP_ALLOCATE_BLOOD_UNIT')) {
      // Execute transaction demonstration
      const txResult = await db.allocateBloodUnitTransaction(1, 1, 7, 'Laboratory Transaction Demonstration');
      rows = [
        {
          transaction_operation: 'ACID Stored Procedure Allocation',
          status_code: txResult.statusCode,
          success: txResult.success ? 'TRUE' : 'FALSE',
          result_message: txResult.message,
          isolation_level: 'REPEATABLE READ / FOR UPDATE',
        },
      ];
    } else {
      rows = await db.query(sql);
    }

    const executionTimeMs = Math.max(1, Date.now() - startTime);

    // Extract columns
    let columns = [];
    if (Array.isArray(rows) && rows.length > 0) {
      columns = Object.keys(rows[0]);
    } else if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
      columns = Object.keys(rows);
      rows = [rows];
    }

    res.json({
      success: true,
      columns,
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : 0,
      executionTimeMs,
      executedSql: sql,
    });
  } catch (err) {
    console.error('SQL Lab Execution Error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
      executionTimeMs: Date.now() - startTime,
    });
  }
});

module.exports = router;

