/**
 * Patient Management Routes (Module 4)
 * Connected directly to MySQL 8.0 (InnoDB) with full CRUD, search, filter, pagination
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all patients with search, filtering, sorting, and pagination
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const {
      hospital_id,
      medical_status,
      blood_group,
      search,
      sortBy = 'admission_date',
      sortOrder = 'DESC',
      page = 1,
      limit = 25,
    } = req.query;

    const conditions = ['1=1'];
    const params = [];

    if (hospital_id) {
      conditions.push('pt.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }
    if (medical_status) {
      conditions.push('pt.medical_status = ?');
      params.push(medical_status);
    }
    if (blood_group) {
      conditions.push('p.blood_group = ?');
      params.push(blood_group);
    }
    if (search && search.trim()) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ? OR p.city LIKE ? OR pt.medical_notes LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.join(' AND ');

    // Total count for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM Patient pt
      JOIN Person p ON pt.person_id = p.person_id
      JOIN Hospital h ON pt.hospital_id = h.hospital_id
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Sorting whitelist
    const allowedSortFields = {
      patient_id: 'pt.patient_id',
      name: 'p.first_name',
      admission_date: 'pt.admission_date',
      medical_status: 'pt.medical_status',
      hospital_name: 'h.hospital_name',
      blood_group: 'p.blood_group',
    };
    const orderCol = allowedSortFields[sortBy] || 'pt.admission_date';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pagination limits
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? 1000 : Math.max(1, parseInt(limit, 10) || 25);
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT 
        pt.patient_id,
        pt.person_id,
        pt.hospital_id,
        pt.ward_id,
        pt.attending_doctor_id,
        pt.admission_date,
        pt.discharge_date,
        pt.medical_status,
        pt.medical_notes,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.city,
        p.state,
        p.pincode,
        p.blood_group,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        h.hospital_name,
        h.city AS hospital_city,
        COALESCE(w.ward_name, 'Unassigned') AS ward_name,
        COALESCE(w.ward_type, 'N/A') AS ward_type,
        CONCAT('Dr. ', COALESCE(dp.first_name, 'Staff'), ' ', COALESCE(dp.last_name, 'Physician')) AS attending_doctor_name,
        (SELECT COUNT(*) FROM BloodRequest br WHERE br.patient_id = pt.patient_id AND br.request_status IN ('PENDING', 'PARTIALLY_FULFILLED')) AS active_blood_requests,
        (SELECT COUNT(*) FROM OrganRequest orq WHERE orq.patient_id = pt.patient_id AND orq.request_status = 'WAITING') AS active_organ_requests
      FROM Patient pt
      JOIN Person p ON pt.person_id = p.person_id
      JOIN Hospital h ON pt.hospital_id = h.hospital_id
      LEFT JOIN Ward w ON pt.ward_id = w.ward_id
      LEFT JOIN Staff d ON pt.attending_doctor_id = d.staff_id
      LEFT JOIN Person dp ON d.person_id = dp.person_id
      WHERE ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    const patients = await db.query(dataSql, [...params, limitNum, offset]);

    res.json({
      success: true,
      count: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
      patients,
    });
  } catch (err) {
    console.error('Patient retrieve error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve patients from database.' });
  }
});

// Get single patient with requests history
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);

    const patientSql = `
      SELECT 
        pt.*,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.city,
        p.state,
        p.pincode,
        p.blood_group,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        h.hospital_name,
        COALESCE(w.ward_name, 'Unassigned') AS ward_name,
        w.ward_type,
        CONCAT('Dr. ', COALESCE(dp.first_name, 'Staff'), ' ', COALESCE(dp.last_name, 'Physician')) AS attending_doctor_name
      FROM Patient pt
      JOIN Person p ON pt.person_id = p.person_id
      JOIN Hospital h ON pt.hospital_id = h.hospital_id
      LEFT JOIN Ward w ON pt.ward_id = w.ward_id
      LEFT JOIN Staff d ON pt.attending_doctor_id = d.staff_id
      LEFT JOIN Person dp ON d.person_id = dp.person_id
      WHERE pt.patient_id = ?
    `;

    const patientRows = await db.query(patientSql, [patientId]);
    if (patientRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const patient = patientRows[0];

    // RBAC: PATIENT can only view their own record
    if (req.user.role === 'PATIENT') {
      const isOwner = (req.user.patient_id && req.user.patient_id === patientId) || (req.user.person_id && req.user.person_id === patient.person_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Patients are only authorized to view their own medical profile.',
        });
      }
    }

    // Blood Requests
    const bloodReqSql = `
      SELECT br.*, COUNT(ba.allocation_id) AS allocated_count
      FROM BloodRequest br
      LEFT JOIN BloodAllocation ba ON br.request_id = ba.request_id
      WHERE br.patient_id = ?
      GROUP BY br.request_id
      ORDER BY br.request_date DESC
    `;
    const bloodRequests = await db.query(bloodReqSql, [patientId]);

    // Organ Requests
    const organReqSql = `
      SELECT orq.*
      FROM OrganRequest orq
      WHERE orq.patient_id = ?
      ORDER BY orq.request_date DESC
    `;
    const organRequests = await db.query(organReqSql, [patientId]);

    res.json({
      success: true,
      patient: {
        ...patient,
        bloodRequests,
        organRequests,
      },
    });
  } catch (err) {
    console.error('Patient detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve patient details.' });
  }
});

// Register new patient (Person Supertype + Patient Subtype via Transaction)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      hospital_id,
      ward_id,
      attending_doctor_id,
      medical_status,
      medical_notes,
    } = req.body;

    if (!first_name || !last_name || !phone || !blood_group || !hospital_id) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, phone, blood group, and hospital are required.',
      });
    }

    await conn.query('START TRANSACTION');

    // 1. Check or insert Person
    const [existingPerson] = await conn.query('SELECT person_id FROM Person WHERE phone = ?', [phone]);
    let personId;

    if (existingPerson.length > 0) {
      personId = existingPerson[0].person_id;
    } else {
      const personInsertSql = `
        INSERT INTO Person 
        (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [personResult] = await conn.query(personInsertSql, [
        first_name,
        last_name,
        date_of_birth || '1990-01-01',
        gender || 'OTHER',
        phone,
        email || `patient_${Date.now()}@lifelink.network`,
        address || 'Inpatient ward',
        city || 'Delhi',
        state || 'Delhi',
        pincode || '110001',
        blood_group,
        emergency_contact_name || 'Relative',
        emergency_contact_phone || phone,
      ]);
      personId = personResult.insertId;
    }

    // 2. Insert Patient (Triggers automatically update Ward.occupied_beds)
    const patientInsertSql = `
      INSERT INTO Patient 
      (person_id, hospital_id, ward_id, attending_doctor_id, admission_date, medical_status, medical_notes)
      VALUES (?, ?, ?, ?, CURDATE(), ?, ?)
    `;
    const [patientResult] = await conn.query(patientInsertSql, [
      personId,
      parseInt(hospital_id, 10),
      ward_id ? parseInt(ward_id, 10) : null,
      attending_doctor_id ? parseInt(attending_doctor_id, 10) : null,
      medical_status || 'STABLE',
      medical_notes || 'Inpatient admission record.',
    ]);

    await conn.query('COMMIT');

    const newPatientId = patientResult.insertId;

    res.status(201).json({
      success: true,
      patient_id: newPatientId,
      message: `Patient admitted successfully (Patient ID: ${newPatientId}).`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Patient register error:', err);
    res.status(500).json({ success: false, message: `Failed to register patient: ${err.message}` });
  } finally {
    conn.release();
  }
});

// Update patient status, ward, or medical notes
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    const patientId = parseInt(req.params.id, 10);
    const { medical_status, ward_id, discharge_date, medical_notes, phone, email, address, city } = req.body;

    const [ptRows] = await conn.query('SELECT * FROM Patient WHERE patient_id = ?', [patientId]);
    if (ptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    const currentPt = ptRows[0];

    await conn.query('START TRANSACTION');

    const newDischargeDate = medical_status === 'DISCHARGED'
      ? (discharge_date || new Date().toISOString().split('T')[0])
      : currentPt.discharge_date;

    const updatePatientSql = `
      UPDATE Patient 
      SET 
        medical_status = COALESCE(?, medical_status),
        ward_id = ?,
        discharge_date = ?,
        medical_notes = COALESCE(?, medical_notes)
      WHERE patient_id = ?
    `;

    await conn.query(updatePatientSql, [
      medical_status || null,
      ward_id !== undefined ? (ward_id ? parseInt(ward_id, 10) : null) : currentPt.ward_id,
      newDischargeDate,
      medical_notes || null,
      patientId,
    ]);

    // Optional Person info update
    if (phone || email || address || city) {
      const updatePersonSql = `
        UPDATE Person 
        SET 
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          city = COALESCE(?, city)
        WHERE person_id = ?
      `;
      await conn.query(updatePersonSql, [phone || null, email || null, address || null, city || null, currentPt.person_id]);
    }

    await conn.query('COMMIT');

    res.json({
      success: true,
      message: `Patient ${patientId} updated successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Patient update error:', err);
    res.status(500).json({ success: false, message: `Failed to update patient: ${err.message}` });
  } finally {
    conn.release();
  }
});

// Delete patient with referential integrity verification
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    const patientId = parseInt(req.params.id, 10);

    // Check active blood requests or organ requests
    const [bloodReqs] = await conn.query('SELECT COUNT(*) AS c FROM BloodRequest WHERE patient_id = ?', [patientId]);
    const [organReqs] = await conn.query('SELECT COUNT(*) AS c FROM OrganRequest WHERE patient_id = ?', [patientId]);

    if (bloodReqs[0].c > 0 || organReqs[0].c > 0) {
      return res.status(409).json({
        success: false,
        message: `Referential Integrity: Patient cannot be deleted because ${bloodReqs[0].c} blood request(s) and ${organReqs[0].c} organ request(s) reference this record.`,
      });
    }

    const [ptRows] = await conn.query('SELECT person_id FROM Patient WHERE patient_id = ?', [patientId]);
    if (ptRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    const personId = ptRows[0].person_id;

    await conn.query('START TRANSACTION');
    await conn.query('DELETE FROM Patient WHERE patient_id = ?', [patientId]);

    // Check if person has other roles (Donor, Staff)
    const [donorCheck] = await conn.query('SELECT COUNT(*) AS c FROM Donor WHERE person_id = ?', [personId]);
    const [staffCheck] = await conn.query('SELECT COUNT(*) AS c FROM Staff WHERE person_id = ?', [personId]);

    if (donorCheck[0].c === 0 && staffCheck[0].c === 0) {
      await conn.query('DELETE FROM Person WHERE person_id = ?', [personId]);
    }

    await conn.query('COMMIT');

    res.json({
      success: true,
      message: `Patient ${patientId} deleted successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Patient delete error:', err);
    res.status(500).json({ success: false, message: `Failed to delete patient: ${err.message}` });
  } finally {
    conn.release();
  }
});

module.exports = router;
