/**
 * Hospital Management Routes (Module 2)
 * Connected directly to MySQL 8.0 (InnoDB) with Wards, Staff Hierarchy (Self-Join)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleMySQLError } = require('../utils/errorHandler');

// Lightweight Hospital Options for Dropdowns (accessible to all authenticated roles)
router.get('/options', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT hospital_id, hospital_name, city, state, is_active
      FROM Hospital
      WHERE is_active = TRUE
      ORDER BY hospital_name ASC
    `;
    const hospitals = await db.query(sql);
    res.json({
      success: true,
      hospitals,
      data: hospitals,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve hospital options.');
  }
});

// Get all hospitals with aggregate metrics
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        h.hospital_id,
        h.hospital_name,
        h.license_number,
        h.address,
        h.city,
        h.state,
        h.pincode,
        h.contact_phone AS phone,
        h.contact_phone,
        h.contact_email AS email,
        h.contact_email,
        h.emergency_helpline,
        h.established_year,
        h.is_active,
        COUNT(DISTINCT w.ward_id) AS ward_count,
        COUNT(DISTINCT s.staff_id) AS staff_count,
        COALESCE(SUM(w.total_beds), 0) AS total_capacity,
        COALESCE(SUM(w.occupied_beds), 0) AS total_occupied
      FROM Hospital h
      LEFT JOIN Ward w ON h.hospital_id = w.hospital_id
      LEFT JOIN Staff s ON h.hospital_id = s.hospital_id
      GROUP BY h.hospital_id
      ORDER BY h.hospital_id ASC
    `;
    const hospitals = await db.query(sql);

    // Format numbers as actual numbers
    const formatted = hospitals.map((h) => ({
      ...h,
      ward_count: Number(h.ward_count) || 0,
      staff_count: Number(h.staff_count) || 0,
      total_capacity: Number(h.total_capacity) || 0,
      total_occupied: Number(h.total_occupied) || 0,
    }));

    res.json({
      success: true,
      count: formatted.length,
      hospitals: formatted,
      data: formatted,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve hospitals from database.');
  }
});

// Staff Hierarchy Tree using SQL Self-Join on Staff (supervisor_staff_id)
const getStaffHierarchyHandler = async (req, res) => {
  try {
    const hospitalId = req.params.id || req.query.hospital_id;
    const conditions = ['s.is_active = TRUE'];
    const params = [];

    if (hospitalId) {
      conditions.push('s.hospital_id = ?');
      params.push(parseInt(hospitalId, 10));
    }

    const sql = `
      SELECT 
        s.staff_id,
        s.staff_id AS employee_staff_id,
        s.hospital_id,
        s.ward_id,
        s.supervisor_staff_id,
        s.job_title,
        s.department,
        s.system_role,
        s.hire_date,
        s.is_active,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
        CONCAT(p.first_name, ' ', p.last_name) AS staff_name,
        CONCAT(p.first_name, ' ', p.last_name) AS employee_name,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        h.hospital_name,
        COALESCE(w.ward_name, 'Hospital Wide') AS ward_name,
        CONCAT(sp.first_name, ' ', sp.last_name) AS supervisor_name,
        sup.job_title AS supervisor_title
      FROM Staff s
      JOIN Person p ON s.person_id = p.person_id
      JOIN Hospital h ON s.hospital_id = h.hospital_id
      LEFT JOIN Ward w ON s.ward_id = w.ward_id
      LEFT JOIN Staff sup ON s.supervisor_staff_id = sup.staff_id
      LEFT JOIN Person sp ON sup.person_id = sp.person_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.hospital_id, s.supervisor_staff_id IS NULL DESC, s.staff_id ASC
    `;

    const staffList = await db.query(sql, params);

    res.json({
      success: true,
      count: staffList.length,
      staff: staffList,
      rows: staffList,
      explanation: 'Computed using SQL Self-Join on Staff table (Staff s LEFT JOIN Staff sup ON s.supervisor_staff_id = sup.staff_id)',
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve staff hierarchy.');
  }
};

router.get('/staff-hierarchy', getStaffHierarchyHandler);
router.get('/:id/staff-hierarchy', getStaffHierarchyHandler);

// Get single hospital with wards and staff count
router.get('/:id', async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        hospital_id,
        hospital_name,
        license_number,
        address,
        city,
        state,
        pincode,
        contact_phone AS phone,
        contact_phone,
        contact_email AS email,
        contact_email,
        emergency_helpline,
        established_year,
        is_active
      FROM Hospital 
      WHERE hospital_id = ?
    `;
    const rows = await db.query(sql, [hospitalId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    const hospital = rows[0];
    const wards = await db.query('SELECT * FROM Ward WHERE hospital_id = ? ORDER BY floor_number, ward_name', [hospitalId]);

    res.json({
      success: true,
      hospital: {
        ...hospital,
        wards,
      },
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve hospital details.');
  }
});

// Get wards for a specific hospital
router.get('/:id/wards', async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id, 10);
    const sql = `
      SELECT 
        w.*,
        (w.total_beds - w.occupied_beds) AS available_beds,
        ROUND((w.occupied_beds / NULLIF(w.total_beds, 0)) * 100, 1) AS occupancy_rate
      FROM Ward w
      WHERE w.hospital_id = ?
      ORDER BY w.floor_number, w.ward_name
    `;
    const wards = await db.query(sql, [hospitalId]);

    const formatted = wards.map((w) => ({
      ...w,
      total_beds: Number(w.total_beds) || 0,
      occupied_beds: Number(w.occupied_beds) || 0,
      available_beds: Number(w.available_beds) || 0,
      occupancy_rate: Number(w.occupancy_rate) || 0,
    }));

    res.json({
      success: true,
      count: formatted.length,
      wards: formatted,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve wards.');
  }
});

// Create new hospital (ADMIN only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const {
      hospital_name,
      license_number,
      address,
      city,
      state,
      pincode,
      phone,
      contact_phone,
      email,
      contact_email,
      emergency_helpline,
      established_year,
    } = req.body;

    const finalPhone = (contact_phone || phone || '').trim();
    const finalEmail = (contact_email || email || '').trim();

    const fields = {};
    if (!hospital_name || !hospital_name.trim()) fields.hospital_name = 'Hospital name is required.';
    if (!license_number || !license_number.trim()) fields.license_number = 'License number is required.';
    if (!city || !city.trim()) fields.city = 'City is required.';
    if (!finalPhone) fields.phone = 'Contact phone is required.';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Required hospital fields are missing.',
        fields,
      });
    }

    const sql = `
      INSERT INTO Hospital 
      (hospital_name, license_number, address, city, state, pincode, contact_phone, contact_email, emergency_helpline, established_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.query(sql, [
      hospital_name.trim(),
      license_number.trim(),
      address?.trim() || 'Medical Center Way',
      city.trim(),
      state?.trim() || 'State',
      pincode?.trim() || '110001',
      finalPhone,
      finalEmail || `${hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.org`,
      emergency_helpline?.trim() || finalPhone,
      established_year ? parseInt(established_year, 10) : 2010,
    ]);

    const createdHospital = {
      hospital_id: result.insertId,
      hospital_name: hospital_name.trim(),
      license_number: license_number.trim(),
      city: city.trim(),
      contact_phone: finalPhone,
      contact_email: finalEmail,
    };

    res.status(201).json({
      success: true,
      hospital_id: result.insertId,
      hospital: createdHospital,
      message: `Hospital "${hospital_name}" registered successfully.`,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to create hospital.');
  }
});

// Create new ward for hospital (ADMIN, STAFF)
router.post('/:id/wards', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id, 10);
    const { ward_name, ward_type, floor_number, total_beds } = req.body;

    const fields = {};
    if (!ward_name || !ward_name.trim()) fields.ward_name = 'Ward name is required.';
    if (!ward_type) fields.ward_type = 'Ward classification type is required.';
    if (floor_number === undefined || isNaN(floor_number)) fields.floor_number = 'Floor number is required.';
    if (!total_beds || parseInt(total_beds, 10) <= 0) fields.total_beds = 'Total beds must be greater than zero.';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ward input parameters.',
        fields,
      });
    }

    const sql = `
      INSERT INTO Ward 
      (hospital_id, ward_name, ward_type, floor_number, total_beds, occupied_beds)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    const result = await db.query(sql, [
      hospitalId,
      ward_name.trim(),
      ward_type,
      parseInt(floor_number, 10),
      parseInt(total_beds, 10),
    ]);

    const createdWard = {
      ward_id: result.insertId,
      hospital_id: hospitalId,
      ward_name: ward_name.trim(),
      ward_type,
      floor_number: parseInt(floor_number, 10),
      total_beds: parseInt(total_beds, 10),
      occupied_beds: 0,
    };

    res.status(201).json({
      success: true,
      ward_id: result.insertId,
      ward: createdWard,
      message: `Ward "${ward_name}" registered successfully.`,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to create ward.');
  }
});

// Add Staff member to hospital (ADMIN only)
router.post('/:id/staff', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const hospitalId = parseInt(req.params.id, 10);
    const {
      first_name,
      last_name,
      phone,
      email,
      date_of_birth,
      gender = 'OTHER',
      blood_group = 'O+',
      job_title,
      department,
      system_role = 'DOCTOR',
      ward_id,
      supervisor_staff_id,
    } = req.body;

    const fields = {};
    if (!first_name) fields.first_name = 'First name is required.';
    if (!last_name) fields.last_name = 'Last name is required.';
    if (!phone) fields.phone = 'Phone number is required.';
    if (!job_title) fields.job_title = 'Job title is required.';
    if (!department) fields.department = 'Department is required.';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({ success: false, message: 'Missing required staff fields.', fields });
    }

    await conn.query('START TRANSACTION');

    // 1. Person supertype
    const [existingPerson] = await conn.query('SELECT person_id FROM Person WHERE phone = ?', [phone]);
    let personId;

    if (existingPerson.length > 0) {
      personId = existingPerson[0].person_id;
    } else {
      const [personResult] = await conn.query(
        `INSERT INTO Person (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group)
         VALUES (?, ?, ?, ?, ?, ?, 'Hospital Staff Quarters', 'Delhi', 'Delhi', '110001', ?)`,
        [first_name, last_name, date_of_birth || '1985-01-01', gender, phone, email || `staff_${Date.now()}@lifelink.org`, blood_group]
      );
      personId = personResult.insertId;
    }

    // 2. Staff subtype
    const [staffResult] = await conn.query(
      `INSERT INTO Staff (person_id, hospital_id, ward_id, supervisor_staff_id, job_title, department, system_role, hire_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), TRUE)`,
      [
        personId,
        hospitalId,
        ward_id ? parseInt(ward_id, 10) : null,
        supervisor_staff_id ? parseInt(supervisor_staff_id, 10) : null,
        job_title,
        department,
        system_role,
      ]
    );

    await conn.query('COMMIT');

    res.status(201).json({
      success: true,
      staff_id: staffResult.insertId,
      message: `Staff member "${first_name} ${last_name}" registered successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to add staff member.');
  } finally {
    conn.release();
  }
});

module.exports = router;
