/**
 * DBMS Learning Lab Routes (Phase 3 through Phase 10)
 * Educational and interactive laboratory covering all core relational database concepts
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ============================================================================
// 1. SQL OPERATIONS (PHASE 4)
// ============================================================================

// Fetch College Record Management Schema state
router.get('/operations/college-data', async (req, res) => {
  try {
    const students = await db.query('SELECT * FROM demo_college_student ORDER BY student_id ASC');
    const courses = await db.query('SELECT * FROM demo_college_course ORDER BY course_id ASC');
    const exams = await db.query(`
      SELECT 
        e.exam_id,
        e.student_id,
        s.name AS student_name,
        e.course_id,
        c.course_name,
        e.marks,
        e.exam_date
      FROM demo_college_exam e
      JOIN demo_college_student s ON e.student_id = s.student_id
      JOIN demo_college_course c ON e.course_id = c.course_id
      ORDER BY e.exam_id ASC
    `);
    const faculty = await db.query('SELECT * FROM demo_college_faculty ORDER BY faculty_id ASC');

    res.json({
      success: true,
      students,
      courses,
      exams,
      faculty,
    });
  } catch (err) {
    console.error('College data error:', err);
    res.status(500).json({ success: false, message: 'Failed to load college demo data.' });
  }
});

// Execute predefined or custom SQL Operation
router.post('/operations/execute', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { operationType } = req.body;
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    let executedSql = '';
    let resultMessage = '';
    let affectedRows = 0;

    switch (operationType) {
      case 'insert-rohan':
        executedSql = `INSERT INTO demo_college_exam (exam_id, student_id, course_id, marks, exam_date) VALUES (312, 108, 204, 72, CURDATE());`;
        const [r1] = await conn.query(
          'INSERT INTO demo_college_exam (exam_id, student_id, course_id, marks, exam_date) VALUES (312, 108, 204, 72, CURDATE()) ON DUPLICATE KEY UPDATE marks = 72'
        );
        affectedRows = r1.affectedRows;
        resultMessage = 'INSERT successful: Rohan Mehta (Student #108) inserted for DBMS (Course #204) with marks = 72.';
        break;

      case 'insert-aman':
        executedSql = `INSERT INTO demo_college_exam (exam_id, student_id, course_id, marks, exam_date) VALUES (313, 106, 204, 68, CURDATE());`;
        const [r2] = await conn.query(
          'INSERT INTO demo_college_exam (exam_id, student_id, course_id, marks, exam_date) VALUES (313, 106, 204, 68, CURDATE()) ON DUPLICATE KEY UPDATE marks = 68'
        );
        affectedRows = r2.affectedRows;
        resultMessage = 'INSERT successful: Aman Gupta (Student #106) inserted for DBMS (Course #204) with marks = 68.';
        break;

      case 'update-kabir':
        executedSql = `UPDATE demo_college_exam SET marks = 75 WHERE student_id = 103 AND course_id = 203;`;
        const [r3] = await conn.query(
          'UPDATE demo_college_exam SET marks = 75 WHERE student_id = 103 AND course_id = 203'
        );
        affectedRows = r3.affectedRows;
        resultMessage = "UPDATE successful: Kabir Verma's (Student #103) Computer Networks marks updated to 75.";
        break;

      case 'delete-meera':
        executedSql = `DELETE FROM demo_college_exam WHERE exam_id = 307;`;
        const [r4] = await conn.query('DELETE FROM demo_college_exam WHERE exam_id = 307');
        affectedRows = r4.affectedRows;
        resultMessage = "DELETE successful: Meera Sen's incorrect exam entry (#307) deleted from database.";
        break;

      case 'reset-college':
        executedSql = `-- Resetting College demo records to initial assignment state`;
        await conn.query('DELETE FROM demo_college_exam WHERE exam_id IN (312, 313)');
        await conn.query('UPDATE demo_college_exam SET marks = 62 WHERE student_id = 103 AND course_id = 203');
        await conn.query(
          'INSERT IGNORE INTO demo_college_exam (exam_id, student_id, course_id, marks, exam_date) VALUES (307, 101, 202, 45, "2026-05-12")'
        );
        resultMessage = 'College demo schema reset to initial state successfully.';
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid operation type.' });
    }

    // Fetch updated exams
    const [updatedExams] = await conn.query(`
      SELECT 
        e.exam_id,
        e.student_id,
        s.name AS student_name,
        e.course_id,
        c.course_name,
        e.marks,
        e.exam_date
      FROM demo_college_exam e
      JOIN demo_college_student s ON e.student_id = s.student_id
      JOIN demo_college_course c ON e.course_id = c.course_id
      ORDER BY e.exam_id ASC
    `);

    res.json({
      success: true,
      operationType,
      executedSql,
      resultMessage,
      affectedRows,
      updatedExams,
    });
  } catch (err) {
    console.error('SQL Operation error:', err);
    res.status(500).json({ success: false, message: `Operation failed: ${err.message}` });
  } finally {
    conn.release();
  }
});

// ============================================================================
// 2. JOIN VISUALIZER (PHASE 5)
// ============================================================================

router.get('/joins/execute', async (req, res) => {
  try {
    const { joinType = 'inner' } = req.query;

    let query = '';
    let explanation = '';
    let tablesInvolved = [];
    let rows = [];
    let matchedCount = 0;
    let unmatchedCount = 0;

    switch (joinType) {
      case 'inner':
        tablesInvolved = ['Patient', 'Person', 'Hospital'];
        query = `SELECT 
    pt.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.blood_group,
    p.gender,
    pt.medical_status,
    h.hospital_id,
    h.hospital_name,
    h.city AS hospital_city
FROM Patient pt
INNER JOIN Person p ON pt.person_id = p.person_id
INNER JOIN Hospital h ON pt.hospital_id = h.hospital_id
ORDER BY pt.patient_id ASC
LIMIT 15;`;
        rows = await db.query(query);
        matchedCount = rows.length;
        unmatchedCount = 0;
        explanation =
          'INNER JOIN returns only rows with matching foreign keys in BOTH tables. Every admitted patient must belong to an existing registered hospital.';
        break;

      case 'left':
        tablesInvolved = ['Hospital', 'Patient'];
        query = `SELECT 
    h.hospital_id,
    h.hospital_name,
    h.city,
    COUNT(pt.patient_id) AS total_patients,
    SUM(CASE WHEN pt.medical_status = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_patients,
    CASE 
        WHEN COUNT(pt.patient_id) = 0 THEN 'NO PATIENTS (UNMATCHED LEFT ROW)'
        ELSE 'ACTIVE CENTER'
    END AS center_status
FROM Hospital h
LEFT JOIN Patient pt ON h.hospital_id = pt.hospital_id
GROUP BY h.hospital_id, h.hospital_name, h.city
ORDER BY total_patients DESC;`;
        rows = await db.query(query);
        matchedCount = rows.filter((r) => r.total_patients > 0).length;
        unmatchedCount = rows.filter((r) => r.total_patients === 0).length;
        explanation =
          'LEFT OUTER JOIN preserves all rows from Hospital (the left table), even if a hospital has zero admitted patients (patient count returns 0, NULL preserved).';
        break;

      case 'right':
        tablesInvolved = ['BloodAllocation', 'BloodUnit'];
        query = `SELECT 
    bu.unit_id,
    bu.blood_group,
    bu.component_type,
    bu.storage_status,
    bu.expiry_date,
    ba.allocation_id,
    ba.request_id,
    ba.allocated_date,
    CASE 
        WHEN ba.allocation_id IS NULL THEN 'UNALLOCATED (PRESERVED RIGHT ROW)'
        ELSE 'ALLOCATED'
    END AS allocation_status_label
FROM BloodAllocation ba
RIGHT JOIN BloodUnit bu ON ba.unit_id = bu.unit_id
ORDER BY (ba.allocation_id IS NOT NULL) DESC, bu.unit_id ASC
LIMIT 20;`;
        rows = await db.query(query);
        matchedCount = rows.filter((r) => r.allocation_id !== null).length;
        unmatchedCount = rows.filter((r) => r.allocation_id === null).length;
        explanation =
          'RIGHT OUTER JOIN preserves every BloodUnit (the right table), regardless of whether it has been allocated to a request in BloodAllocation.';
        break;

      case 'self-staff':
        tablesInvolved = ['Staff (Subordinate)', 'Staff (Supervisor)'];
        query = `SELECT 
    s.staff_id,
    CONCAT(p.first_name, ' ', p.last_name) AS staff_name,
    s.job_title,
    s.department,
    s.supervisor_staff_id,
    COALESCE(CONCAT(sp.first_name, ' ', sp.last_name), 'ROOT (No Supervisor)') AS supervisor_name,
    COALESCE(sup.job_title, 'Chief Medical Officer / Top Leadership') AS supervisor_title,
    h.hospital_name
FROM Staff s
JOIN Person p ON s.person_id = p.person_id
JOIN Hospital h ON s.hospital_id = h.hospital_id
LEFT JOIN Staff sup ON s.supervisor_staff_id = sup.staff_id
LEFT JOIN Person sp ON sup.person_id = sp.person_id
ORDER BY s.hospital_id ASC, (s.supervisor_staff_id IS NULL) DESC, s.staff_id ASC;`;
        rows = await db.query(query);
        matchedCount = rows.filter((r) => r.supervisor_staff_id !== null).length;
        unmatchedCount = rows.filter((r) => r.supervisor_staff_id === null).length;
        explanation =
          'SELF JOIN joins the Staff table to itself via supervisor_staff_id -> staff_id, displaying administrative reporting hierarchy.';
        break;

      case 'self-faculty':
        tablesInvolved = ['Faculty (Subordinate)', 'Faculty (HOD/Dean)'];
        query = `SELECT 
    f.faculty_id,
    f.name AS faculty_name,
    f.designation,
    f.department,
    f.supervisor_id,
    COALESCE(sup.name, 'TOP LEVEL (Dean)') AS supervisor_name,
    COALESCE(sup.designation, 'Dean of Engineering') AS supervisor_designation
FROM demo_college_faculty f
LEFT JOIN demo_college_faculty sup ON f.supervisor_id = sup.faculty_id
ORDER BY (f.supervisor_id IS NULL) DESC, f.faculty_id ASC;`;
        rows = await db.query(query);
        matchedCount = rows.filter((r) => r.supervisor_id !== null).length;
        unmatchedCount = rows.filter((r) => r.supervisor_id === null).length;
        explanation =
          'Educational Faculty SELF JOIN: Joins demo_college_faculty to itself, resolving HODs and Professors under Dean Dr. Rajesh Khanna.';
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid join type.' });
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    res.json({
      success: true,
      joinType,
      query,
      explanation,
      tablesInvolved,
      columns,
      rows,
      rowCount: rows.length,
      matchedCount,
      unmatchedCount,
    });
  } catch (err) {
    console.error('Join visualizer error:', err);
    res.status(500).json({ success: false, message: 'Failed to execute join query.' });
  }
});

// ============================================================================
// 3. DATABASE MODELS EXPLORER (PHASE 6)
// ============================================================================

router.get('/models/data', async (req, res) => {
  try {
    // Hierarchical Healthcare: Hospital -> Ward -> Patient -> Blood Request
    const hierSql = `
      SELECT 
        h.hospital_id,
        h.hospital_name,
        w.ward_id,
        w.ward_name,
        pt.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        br.request_id,
        br.blood_group,
        br.urgency_level
      FROM Hospital h
      JOIN Ward w ON h.hospital_id = w.hospital_id
      LEFT JOIN Patient pt ON w.ward_id = pt.ward_id
      LEFT JOIN Person p ON pt.person_id = p.person_id
      LEFT JOIN BloodRequest br ON pt.patient_id = br.patient_id
      WHERE h.hospital_id IN (1, 2)
      ORDER BY h.hospital_id, w.ward_id, pt.patient_id
      LIMIT 20;
    `;
    const hierarchicalHealthcare = await db.query(hierSql);

    // Network Model: Donor -> BloodDonation -> BloodUnit -> BloodAllocation -> BloodRequest
    const netSql = `
      SELECT 
        d.donor_id,
        CONCAT(dp.first_name, ' ', dp.last_name) AS donor_name,
        bd.donation_id,
        bd.donation_date,
        bu.unit_id,
        bu.component_type,
        ba.allocation_id,
        br.request_id,
        CONCAT(rp.first_name, ' ', rp.last_name) AS recipient_name
      FROM Donor d
      JOIN Person dp ON d.person_id = dp.person_id
      JOIN BloodDonation bd ON d.donor_id = bd.donor_id
      JOIN BloodUnit bu ON bd.donation_id = bu.donation_id
      LEFT JOIN BloodAllocation ba ON bu.unit_id = ba.unit_id
      LEFT JOIN BloodRequest br ON ba.request_id = br.request_id
      LEFT JOIN Patient pt ON br.patient_id = pt.patient_id
      LEFT JOIN Person rp ON pt.person_id = rp.person_id
      LIMIT 15;
    `;
    const networkHealthcare = await db.query(netSql);

    res.json({
      success: true,
      hierarchicalHealthcare,
      networkHealthcare,
      libraryExamples: {
        hierarchical: {
          root: 'Library Central',
          departments: ['Circulation Desk', 'Reference Archive'],
          members: ['Member 101 (John)', 'Member 102 (Alice)'],
          limitation:
            'A book reserved by multiple members cannot exist under multiple parent nodes without duplicating book records or creating complex pointer chains.',
        },
        network: {
          sets: [
            { owner: 'Book "Database Systems"', member: 'Reservation #501 (User Alice)' },
            { owner: 'Book "Database Systems"', member: 'Reservation #502 (User Bob)' },
            { owner: 'Member Bob', member: 'Reservation #502' },
          ],
          explanation:
            'Network model allows multiple owner record types (CODASYL sets) representing many-to-many relationships directly.',
        },
      },
    });
  } catch (err) {
    console.error('Models data error:', err);
    res.status(500).json({ success: false, message: 'Failed to load model data.' });
  }
});

// ============================================================================
// 4. RELATIONAL SCHEMA EXPLORER (PHASE 6C)
// ============================================================================

router.get('/schema-explorer', async (req, res) => {
  try {
    const tableSql = `
      SELECT 
        TABLE_NAME, 
        TABLE_TYPE, 
        TABLE_ROWS
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'lifelink_db' 
      ORDER BY TABLE_NAME ASC;
    `;
    const tables = await db.query(tableSql);

    const columnsSql = `
      SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        DATA_TYPE, 
        COLUMN_TYPE, 
        IS_NULLABLE, 
        COLUMN_KEY, 
        EXTRA, 
        COLUMN_COMMENT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'lifelink_db'
      ORDER BY TABLE_NAME, ORDINAL_POSITION ASC;
    `;
    const columns = await db.query(columnsSql);

    const constraintsSql = `
      SELECT 
        TABLE_NAME, 
        CONSTRAINT_NAME, 
        CONSTRAINT_TYPE
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'lifelink_db'
      ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
    `;
    const constraints = await db.query(constraintsSql);

    res.json({
      success: true,
      tables,
      columns,
      constraints,
    });
  } catch (err) {
    console.error('Schema explorer error:', err);
    res.status(500).json({ success: false, message: 'Failed to inspect database schema metadata.' });
  }
});

// ============================================================================
// 5. INDEXING AND QUERY OPTIMIZATION (PHASE 10)
// ============================================================================

router.post('/indexing/explain', async (req, res) => {
  try {
    const { targetQuery = 'city-search', action = 'explain' } = req.body;

    let testSql = "SELECT pt.patient_id, p.first_name, p.last_name, p.city, pt.medical_status FROM Patient pt JOIN Person p ON pt.person_id = p.person_id WHERE p.city = 'Jaipur'";
    let indexName = 'idx_person_city_demo';

    if (action === 'create-index') {
      try {
        await db.query(`CREATE INDEX ${indexName} ON Person(city)`);
      } catch (e) {
        // Index might already exist
      }
    } else if (action === 'drop-index') {
      try {
        await db.query(`DROP INDEX ${indexName} ON Person`);
      } catch (e) {
        // Index might not exist
      }
    }

    // Measure actual execution time
    const start = Date.now();
    const rows = await db.query(testSql);
    const executionTimeMs = Date.now() - start;

    // Run EXPLAIN
    const explainRows = await db.query(`EXPLAIN ${testSql}`);

    // Check existing indexes on Person
    const existingIndexes = await db.query('SHOW INDEX FROM Person');

    res.json({
      success: true,
      action,
      query: testSql,
      executionTimeMs,
      rowsMatched: rows.length,
      explain: explainRows,
      hasIndex: existingIndexes.some((idx) => idx.Key_name === indexName),
      indexName,
      allIndexes: existingIndexes.map((idx) => ({
        table: idx.Table,
        key_name: idx.Key_name,
        column_name: idx.Column_name,
        unique: idx.Non_unique === 0,
      })),
    });
  } catch (err) {
    console.error('Indexing explain error:', err);
    res.status(500).json({ success: false, message: `Indexing demonstration error: ${err.message}` });
  }
});

// ============================================================================
// 6. CONSTRAINTS AND REFERENTIAL INTEGRITY (PHASE 3 #9)
// ============================================================================

router.post('/constraints/test-violation', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { testCase } = req.body;

  try {
    switch (testCase) {
      case 'check-occupied-beds':
        // Try inserting ward with occupied_beds > total_beds
        await db.query(`
          INSERT INTO Ward (hospital_id, ward_name, ward_type, floor_number, total_beds, occupied_beds)
          VALUES (1, 'Test Faulty Ward', 'ICU', 9, 10, 15)
        `);
        return res.json({ success: true, message: 'Constraint test failed: insertion unexpectedly succeeded.' });

      case 'fk-restrict-hospital':
        // Try deleting hospital 1 which has attached wards and patients
        await db.query('DELETE FROM Hospital WHERE hospital_id = 1');
        return res.json({ success: true, message: 'Constraint test failed: delete unexpectedly succeeded.' });

      case 'unique-email':
        // Try inserting person with existing email
        await db.query(`
          INSERT INTO Person (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
          VALUES ('Duplicate', 'Person', '1990-01-01', 'MALE', '+91-9999900000', 'vikram.sharma@aiims.edu', 'Street 1', 'Delhi', 'Delhi', '110001', 'O+', 'Contact', '+91-9999900000')
        `);
        return res.json({ success: true, message: 'Constraint test failed: duplicate insertion succeeded.' });

      case 'not-null':
        await db.query('INSERT INTO Hospital (hospital_name, license_number, city) VALUES (NULL, NULL, NULL)');
        return res.json({ success: true, message: 'Constraint test failed: NOT NULL violation succeeded.' });

      default:
        return res.status(400).json({ success: false, message: 'Unknown test case.' });
    }
  } catch (err) {
    // Constraint correctly rejected by MySQL!
    return res.json({
      success: false,
      blockedByDatabase: true,
      errorCode: err.code,
      sqlState: err.sqlState,
      databaseMessage: err.message,
      explanation:
        'MySQL InnoDB engine successfully enforced referential integrity and blocked data corruption.',
    });
  }
});

// ============================================================================
// 7. TRANSACTION LABORATORY (PHASE 9)
// ============================================================================

router.post('/transactions/simulate', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { scenario = 'rollback-test' } = req.body;
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    const timeline = [];

    if (scenario === 'rollback-test') {
      timeline.push({ step: 1, action: 'START TRANSACTION', status: 'Active' });
      await conn.query('START TRANSACTION');

      timeline.push({ step: 2, action: 'INSERT INTO BloodRequest (Simulated Emergency Request)', status: 'Success' });
      const [insertRes] = await conn.query(`
        INSERT INTO BloodRequest 
        (patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, request_date, required_by_date, request_status, clinical_indication)
        VALUES (1, 1, 'O-', 'RBC', 2, 'CRITICAL', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'PENDING', 'Transaction Lab Simulated Request')
      `);
      const tempId = insertRes.insertId;

      timeline.push({ step: 3, action: 'Verification check encountered validation failure. Executing ROLLBACK', status: 'Rollback' });
      await conn.query('ROLLBACK');

      const [check] = await conn.query('SELECT * FROM BloodRequest WHERE request_id = ?', [tempId]);
      const persisted = check.length > 0;

      timeline.push({
        step: 4,
        action: `Verified database state: Row ${tempId} is ${persisted ? 'PERSISTED' : 'COMPLETELY REMOVED (Atomicity Guaranteed)'}`,
        status: persisted ? 'Corrupted' : 'Atomicity Enforced',
      });

      return res.json({
        success: true,
        scenario,
        guarantee: 'ATOMICITY (All-or-Nothing)',
        timeline,
        summary: 'Transaction was completely rolled back. No orphan records or partial updates remain in MySQL.',
      });
    }

    if (scenario === 'savepoint-test') {
      timeline.push({ step: 1, action: 'START TRANSACTION', status: 'Active' });
      await conn.query('START TRANSACTION');

      timeline.push({ step: 2, action: 'INSERT Step 1: Valid temporary record', status: 'Success' });
      const [r1] = await conn.query(`
        INSERT INTO BloodRequest 
        (patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, request_date, required_by_date, request_status, clinical_indication)
        VALUES (1, 1, 'A+', 'RBC', 1, 'ROUTINE', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 'PENDING', 'Savepoint Step 1')
      `);
      const validId = r1.insertId;

      timeline.push({ step: 3, action: 'SAVEPOINT sp_after_step1', status: 'Savepoint Established' });
      await conn.query('SAVEPOINT sp_after_step1');

      timeline.push({ step: 4, action: 'ROLLBACK TO SAVEPOINT sp_after_step1', status: 'Partial Rollback' });
      await conn.query('ROLLBACK TO SAVEPOINT sp_after_step1');

      timeline.push({ step: 5, action: 'COMMIT Transaction', status: 'Committed' });
      await conn.query('COMMIT');

      // Cleanup
      await conn.query('DELETE FROM BloodRequest WHERE request_id = ?', [validId]);

      return res.json({
        success: true,
        scenario,
        guarantee: 'SAVEPOINT & PARTIAL ROLLBACK',
        timeline,
        summary: 'Savepoint allows rolling back to a specific milestone without aborting the entire transaction.',
      });
    }

    return res.status(400).json({ success: false, message: 'Unknown transaction scenario.' });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Transaction lab error:', err);
    res.status(500).json({ success: false, message: `Transaction lab error: ${err.message}` });
  } finally {
    conn.release();
  }
});

module.exports = router;
