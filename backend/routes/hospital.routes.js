/**
 * Hospital Management Routes (Module 2)
 * Connected directly to MySQL 8.0 (InnoDB) with Wards, Staff Hierarchy (Self-Join)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

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
        h.phone,
        h.email,
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

    res.json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (err) {
    console.error('Hospital list error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve hospitals from database.' });
  }
});

// Staff Hierarchy Tree using SQL Self-Join on Staff (supervisor_staff_id)
router.get('/staff-hierarchy', async (req, res) => {
  try {
    const { hospital_id } = req.query;
    const conditions = ['s.is_active = TRUE'];
    const params = [];

    if (hospital_id) {
      conditions.push('s.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }

    const sql = `
      SELECT 
        s.staff_id,
        s.hospital_id,
        s.ward_id,
        s.supervisor_staff_id,
        s.job_title,
        s.department,
        s.system_role,
        s.hire_date,
        s.is_active,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
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
    console.error('Staff hierarchy error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve staff hierarchy.' });
  }
});

// Get single hospital with wards and staff count
router.get('/:id', async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id, 10);
    const sql = 'SELECT * FROM Hospital WHERE hospital_id = ?';
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
    console.error('Hospital detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve hospital details.' });
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
        ROUND((w.occupied_beds / w.total_beds) * 100, 1) AS occupancy_rate
      FROM Ward w
      WHERE w.hospital_id = ?
      ORDER BY w.floor_number, w.ward_name
    `;
    const wards = await db.query(sql, [hospitalId]);

    res.json({
      success: true,
      count: wards.length,
      wards,
    });
  } catch (err) {
    console.error('Wards retrieve error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve wards.' });
  }
});

// Create new hospital
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
      email,
      emergency_helpline,
      established_year,
    } = req.body;

    if (!hospital_name || !license_number || !city || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name, license number, city, and phone are required.',
      });
    }

    const sql = `
      INSERT INTO Hospital 
      (hospital_name, license_number, address, city, state, pincode, phone, email, emergency_helpline, established_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.query(sql, [
      hospital_name,
      license_number,
      address || 'Medical Center Way',
      city,
      state || 'State',
      pincode || '110001',
      phone,
      email || `${hospital_name.toLowerCase().replace(/\s+/g, '')}@hospital.org`,
      emergency_helpline || phone,
      established_year ? parseInt(established_year, 10) : 2010,
    ]);

    res.status(201).json({
      success: true,
      hospital_id: result.insertId,
      message: `Hospital ${hospital_name} registered successfully.`,
    });
  } catch (err) {
    console.error('Create hospital error:', err);
    res.status(500).json({ success: false, message: `Failed to create hospital: ${err.message}` });
  }
});

// Create new ward for hospital
router.post('/:id/wards', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id, 10);
    const { ward_name, ward_type, floor_number, total_beds } = req.body;

    if (!ward_name || !ward_type || !floor_number || !total_beds) {
      return res.status(400).json({
        success: false,
        message: 'Ward name, ward type, floor number, and total beds are required.',
      });
    }

    const sql = `
      INSERT INTO Ward 
      (hospital_id, ward_name, ward_type, floor_number, total_beds, occupied_beds)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    const result = await db.query(sql, [
      hospitalId,
      ward_name,
      ward_type,
      parseInt(floor_number, 10),
      parseInt(total_beds, 10),
    ]);

    res.status(201).json({
      success: true,
      ward_id: result.insertId,
      message: `Ward ${ward_name} created successfully.`,
    });
  } catch (err) {
    console.error('Create ward error:', err);
    res.status(500).json({ success: false, message: `Failed to create ward: ${err.message}` });
  }
});

module.exports = router;
