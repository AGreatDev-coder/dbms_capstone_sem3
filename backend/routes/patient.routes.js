/**
 * Patient Management Routes (Module 4)
 * Connected directly to MySQL 8.0 (InnoDB) with full CRUD, search, filter, pagination
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleMySQLError } = require('../utils/errorHandler');

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
    const total = Number(countResult[0]?.total) || 0;

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
    handleMySQLError(err, res, 'Failed to retrieve patients from database.');
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
      const isOwner =
        (req.user.patient_id && Number(req.user.patient_id) === patientId) ||
        (req.user.person_id && Number(req.user.person_id) === Number(patient.person_id));
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
    handleMySQLError(err, res, 'Failed to retrieve patient details.');
  }
});

// Register new patient (Person Supertype + Patient Subtype via Transaction)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender = 'OTHER',
      phone,
      email,
      address = 'City Care Ward',
      city = 'New Delhi',
      state = 'Delhi',
      pincode = '110001',
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      hospital_id,
      ward_id,
      attending_doctor_id,
      medical_status = 'STABLE',
      medical_notes,
    } = req.body;

    const fields = {};
    if (!first_name || !first_name.trim()) fields.first_name = 'First name is required.';
    if (!last_name || !last_name.trim()) fields.last_name = 'Last name is required.';
    if (!phone || !phone.trim()) fields.phone = 'Phone number is required.';
    if (!blood_group) fields.blood_group = 'Blood group is required.';
    if (!hospital_id) fields.hospital_id = 'Hospital is required.';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Required patient details missing.',
        fields,
      });
    }

    await conn.query('START TRANSACTION');

    // 1. Lock Ward and Validate Capacity before admitting
    if (ward_id) {
      const [wardRows] = await conn.query(
        'SELECT ward_id, total_beds, occupied_beds FROM Ward WHERE ward_id = ? FOR UPDATE',
        [parseInt(ward_id, 10)]
      );

      if (wardRows.length === 0) {
        await conn.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Selected ward does not exist.',
          fields: { ward_id: 'Invalid ward selected.' },
        });
      }

      const ward = wardRows[0];
      if (ward.occupied_beds >= ward.total_beds && medical_status !== 'DISCHARGED') {
        await conn.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Ward is currently at full capacity (${ward.occupied_beds}/${ward.total_beds} beds occupied). Cannot admit patient to this ward.`,
          fields: { ward_id: 'Ward is at maximum capacity.' },
        });
      }
    }

    // 2. Check or insert Person
    const [existingPerson] = await conn.query('SELECT person_id FROM Person WHERE phone = ?', [phone.trim()]);
    let personId;

    if (existingPerson.length > 0) {
      personId = existingPerson[0].person_id;

      // Check if person already has an ACTIVE patient record
      const [activePatient] = await conn.query(
        "SELECT patient_id FROM Patient WHERE person_id = ? AND medical_status != 'DISCHARGED'",
        [personId]
      );
      if (activePatient.length > 0) {
        await conn.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `Person is already an active admitted inpatient (Patient #${activePatient[0].patient_id}).`,
          fields: { phone: 'Patient already has an active hospital admission.' },
        });
      }
    } else {
      const personInsertSql = `
        INSERT INTO Person 
        (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [personResult] = await conn.query(personInsertSql, [
        first_name.trim(),
        last_name.trim(),
        date_of_birth || '1990-01-01',
        gender,
        phone.trim(),
        email?.trim() || `patient_${Date.now()}@lifelink.network`,
        address?.trim() || 'Inpatient ward',
        city?.trim() || 'Delhi',
        state?.trim() || 'Delhi',
        pincode?.trim() || '110001',
        blood_group,
        emergency_contact_name?.trim() || 'Relative',
        emergency_contact_phone?.trim() || phone.trim(),
      ]);
      personId = personResult.insertId;
    }

    // 3. Insert Patient (Triggers automatically update Ward.occupied_beds)
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
      medical_status,
      medical_notes || 'Inpatient admission record.',
    ]);

    await conn.query('COMMIT');

    const newPatientId = patientResult.insertId;

    res.status(201).json({
      success: true,
      patient_id: newPatientId,
      patient: {
        patient_id: newPatientId,
        person_id: personId,
        name: `${first_name.trim()} ${last_name.trim()}`,
        blood_group,
        hospital_id: parseInt(hospital_id, 10),
        ward_id: ward_id ? parseInt(ward_id, 10) : null,
        medical_status,
      },
      message: `Patient admitted successfully (Patient ID: ${newPatientId}).`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to admit patient.');
  } finally {
    conn.release();
  }
});

// Update patient status, ward, or discharge
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
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

    // If transferring to a different ward, lock and check capacity
    const newWardId = ward_id !== undefined ? (ward_id ? parseInt(ward_id, 10) : null) : currentPt.ward_id;
    if (newWardId && newWardId !== currentPt.ward_id && medical_status !== 'DISCHARGED') {
      const [wardRows] = await conn.query(
        'SELECT ward_id, total_beds, occupied_beds FROM Ward WHERE ward_id = ? FOR UPDATE',
        [newWardId]
      );
      if (wardRows.length === 0) {
        await conn.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Target transfer ward does not exist.' });
      }
      if (wardRows[0].occupied_beds >= wardRows[0].total_beds) {
        await conn.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Target ward is at maximum capacity (${wardRows[0].occupied_beds}/${wardRows[0].total_beds} beds occupied). Cannot transfer.`,
        });
      }
    }

    const newDischargeDate = medical_status === 'DISCHARGED'
      ? (discharge_date || new Date().toISOString().split('T')[0])
      : (medical_status && medical_status !== 'DISCHARGED' ? null : currentPt.discharge_date);

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
      newWardId,
      newDischargeDate,
      medical_notes || null,
      patientId,
    ]);

    // Update Person contact if provided
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
      message: `Patient #${patientId} updated successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to update patient.');
  } finally {
    conn.release();
  }
});

// Delete patient with referential integrity verification (ADMIN only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
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
      message: `Patient #${patientId} discharged and archived successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to delete patient.');
  } finally {
    conn.release();
  }
});

module.exports = router;
