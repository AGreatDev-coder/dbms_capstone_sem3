/**
 * Donation Camp Routes (Module 8 & Section 4 Aggregation)
 * Connected directly to MySQL 8.0 (InnoDB) with Aggregation demonstration
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all donation camps with aggregated metrics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, hospital_id } = req.query;
    const conditions = ['1=1'];
    const params = [];

    // RBAC: ADMIN and STAFF can only view camps associated with their hospital
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('c.hospital_id = ?');
      params.push(req.user.hospital_id);
    } else if (hospital_id) {
      conditions.push('c.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }

    const sql = `
      SELECT 
        c.camp_id,
        c.camp_name,
        c.organizer,
        c.hospital_id,
        c.location,
        c.city,
        c.start_date,
        c.end_date,
        c.capacity,
        c.camp_status,
        c.contact_phone,
        h.hospital_name,
        COUNT(DISTINCT cdr.registration_id) AS registered_donors,
        COUNT(DISTINCT CASE WHEN cdr.attended = TRUE THEN cdr.registration_id END) AS attended_donors,
        COALESCE(SUM(cdr.units_donated), 0) AS total_units_collected
      FROM DonationCamp c
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      LEFT JOIN CampDonorRegistration cdr ON c.camp_id = cdr.camp_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.camp_id
      ORDER BY c.start_date DESC
    `;

    const camps = await db.query(sql, params);

    res.json({
      success: true,
      count: camps.length,
      camps,
      aggregation_concept: 'DonationCamp acts as an aggregation root binding hospital organizer, registered donors, and resulting donations.',
    });
  } catch (err) {
    console.error('Donation camps error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donation camps.' });
  }
});

// Camp Aggregate Statistics (for Camp Stats tab)
router.get('/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.camp_id,
        c.camp_name,
        c.location,
        c.capacity,
        c.camp_status,
        h.hospital_name,
        COUNT(cdr.registration_id) AS total_registrations,
        COUNT(CASE WHEN cdr.attended = TRUE THEN 1 END) AS attended_count,
        COALESCE(SUM(cdr.units_donated), 0) AS units_collected,
        ROUND((COUNT(CASE WHEN cdr.attended = TRUE THEN 1 END) / NULLIF(COUNT(cdr.registration_id), 0)) * 100, 1) AS attendance_rate_pct
      FROM DonationCamp c
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      LEFT JOIN CampDonorRegistration cdr ON c.camp_id = cdr.camp_id
      GROUP BY c.camp_id, h.hospital_name
      ORDER BY c.start_date DESC
    `;
    const stats = await db.query(sql);

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Camp stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve camp statistics.' });
  }
});

// Get single camp with registrations
router.get('/:id', async (req, res) => {
  try {
    const campId = parseInt(req.params.id, 10);

    const campSql = `
      SELECT c.*, h.hospital_name
      FROM DonationCamp c
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      WHERE c.camp_id = ?
    `;
    const campRows = await db.query(campSql, [campId]);
    if (campRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Camp not found.' });
    }

    const camp = campRows[0];

    const regSql = `
      SELECT 
        cdr.registration_id,
        cdr.camp_id,
        cdr.donor_id,
        cdr.registration_time,
        cdr.attended,
        cdr.units_donated,
        CONCAT(p.first_name, ' ', p.last_name) AS donor_name,
        d.blood_group,
        p.phone,
        p.city
      FROM CampDonorRegistration cdr
      JOIN Donor d ON cdr.donor_id = d.donor_id
      JOIN Person p ON d.person_id = p.person_id
      WHERE cdr.camp_id = ?
      ORDER BY cdr.registration_time DESC
    `;
    const registrations = await db.query(regSql, [campId]);

    res.json({
      success: true,
      camp: {
        ...camp,
        registrations,
      },
    });
  } catch (err) {
    console.error('Camp detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve camp details.' });
  }
});

// Create new donation camp
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const {
      camp_name,
      organizer,
      hospital_id,
      location,
      city,
      start_date,
      end_date,
      capacity = 100,
      contact_phone,
    } = req.body;

    let finalHospitalId = hospital_id;
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      finalHospitalId = req.user.hospital_id;
    }

    if (!camp_name || !organizer || !finalHospitalId || !location || !city || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'All required camp details must be provided.' });
    }

    const sql = `
      INSERT INTO DonationCamp 
      (camp_name, organizer, hospital_id, location, city, start_date, end_date, capacity, camp_status, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
    `;
    const result = await db.query(sql, [
      camp_name,
      organizer,
      parseInt(finalHospitalId, 10),
      location,
      city,
      start_date,
      end_date,
      parseInt(capacity, 10),
      contact_phone || '+91-9811002233',
    ]);

    res.status(201).json({
      success: true,
      camp_id: result.insertId,
      message: `Donation Camp "${camp_name}" scheduled successfully (Camp ID: ${result.insertId}).`,
    });
  } catch (err) {
    console.error('Create camp error:', err);
    res.status(500).json({ success: false, message: `Failed to schedule camp: ${err.message}` });
  }
});

// Register donor for camp (M:N junction table CampDonorRegistration)
router.post('/:id/register', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const campId = parseInt(req.params.id, 10);
    const donorId = req.body.donor_id || req.user?.donor_id;

    if (!donorId) {
      return res.status(400).json({ success: false, message: 'Donor ID is required for registration.' });
    }

    const sql = `
      INSERT INTO CampDonorRegistration 
      (camp_id, donor_id, registration_time, attended, units_donated)
      VALUES (?, ?, NOW(), FALSE, 0)
    `;
    const result = await db.query(sql, [campId, parseInt(donorId, 10)]);

    res.status(201).json({
      success: true,
      registration_id: result.insertId,
      message: `Donor #${donorId} successfully registered for camp #${campId}.`,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Donor is already registered for this camp.' });
    }
    console.error('Register for camp error:', err);
    res.status(500).json({ success: false, message: `Failed to register for camp: ${err.message}` });
  }
});

module.exports = router;
