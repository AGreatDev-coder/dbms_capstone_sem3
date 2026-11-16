/**
 * Blood Bank & Inventory Routes (Module 5 & Query 2 & Query 3)
 * Connected directly to MySQL 8.0 (InnoDB) with CTE queries and Compatibility Matrix
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get blood inventory with filters, search, and pagination
router.get('/inventory', async (req, res) => {
  try {
    const { blood_group, component_type, hospital_id, search, page = 1, limit = 50 } = req.query;
    const targetStatus = req.query.storage_status || req.query.status;

    const conditions = ['1=1'];
    const params = [];

    if (blood_group) {
      conditions.push('bu.blood_group = ?');
      params.push(blood_group);
    }
    if (component_type) {
      conditions.push('bu.component_type = ?');
      params.push(component_type);
    }
    if (hospital_id) {
      conditions.push('bu.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }
    if (targetStatus && targetStatus !== 'ALL') {
      conditions.push('bu.storage_status = ?');
      params.push(targetStatus);
    }
    if (search && search.trim()) {
      conditions.push('(h.hospital_name LIKE ? OR bu.storage_location LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern);
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `
      SELECT COUNT(*) AS total
      FROM BloodUnit bu
      JOIN Hospital h ON bu.hospital_id = h.hospital_id
      WHERE ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = countRes[0]?.total || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? 1000 : Math.max(1, parseInt(limit, 10) || 50);
    const offset = (pageNum - 1) * limitNum;

    const sql = `
      SELECT 
        bu.unit_id,
        bu.donation_id,
        bu.donor_id,
        bu.hospital_id,
        bu.blood_group,
        bu.component_type,
        bu.donation_date,
        bu.expiry_date,
        DATEDIFF(bu.expiry_date, CURDATE()) AS days_until_expiry,
        bu.storage_status,
        bu.storage_location,
        h.hospital_name,
        h.city AS hospital_city
      FROM BloodUnit bu
      JOIN Hospital h ON bu.hospital_id = h.hospital_id
      WHERE ${whereClause}
      ORDER BY bu.expiry_date ASC, bu.unit_id ASC
      LIMIT ? OFFSET ?
    `;

    const inventory = await db.query(sql, [...params, limitNum, offset]);

    res.json({
      success: true,
      count: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      units: inventory,
      inventory,
    });
  } catch (err) {
    console.error('Inventory retrieve error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve blood inventory.' });
  }
});

// Hospital-Wise Inventory Matrix Summary (Query 3 / View)
router.get('/summary', async (req, res) => {
  try {
    const sql = `
      SELECT 
        h.hospital_id,
        h.hospital_name,
        h.city,
        COUNT(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() THEN 1 END) AS available_units,
        COUNT(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) AS expiring_soon_7d,
        COUNT(CASE WHEN bu.storage_status = 'ALLOCATED' THEN 1 END) AS allocated_units,
        COUNT(CASE WHEN bu.storage_status = 'EXPIRED' OR (bu.storage_status = 'AVAILABLE' AND bu.expiry_date < CURDATE()) THEN 1 END) AS expired_units,
        COUNT(bu.unit_id) AS total_units_tracked
      FROM Hospital h
      LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id
      GROUP BY h.hospital_id, h.hospital_name, h.city
      ORDER BY available_units DESC
    `;
    const summary = await db.query(sql);

    res.json({
      success: true,
      count: summary.length,
      summary,
    });
  } catch (err) {
    console.error('Inventory summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve inventory summary.' });
  }
});

// Blood Donations History Log
router.get('/donations', async (req, res) => {
  try {
    const sql = `
      SELECT 
        bd.donation_id,
        bd.donor_id,
        bd.donation_camp_id,
        bd.hospital_id,
        bd.recorded_by_staff_id,
        bd.donation_date,
        bd.quantity_ml,
        bd.hemoglobin_level,
        bd.screening_status,
        bd.remarks,
        CONCAT(p.first_name, ' ', p.last_name) AS donor_name,
        d.blood_group,
        h.hospital_name,
        c.camp_name
      FROM BloodDonation bd
      JOIN Donor d ON bd.donor_id = d.donor_id
      JOIN Person p ON d.person_id = p.person_id
      JOIN Hospital h ON bd.hospital_id = h.hospital_id
      LEFT JOIN DonationCamp c ON bd.donation_camp_id = c.camp_id
      ORDER BY bd.donation_date DESC, bd.donation_id DESC
    `;
    const donations = await db.query(sql);

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error('Blood donations error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donations log.' });
  }
});

// Query 2 Implementation: CTE for Units Expiring within Next 7 Days
router.get('/expiring-soon', async (req, res) => {
  try {
    const sql = `
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
      ORDER BY remaining_shelf_life_days ASC, blood_group ASC
    `;

    const expiringUnits = await db.query(sql);

    res.json({
      success: true,
      count: expiringUnits.length,
      expiringUnits,
      query_type: 'COMMON TABLE EXPRESSION (WITH ... AS)',
    });
  } catch (err) {
    console.error('CTE expiring units error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute expiring blood units via CTE.' });
  }
});

// Blood Compatibility Reference Matrix
router.get('/compatibility', async (req, res) => {
  try {
    const sql = `
      SELECT * 
      FROM BloodCompatibility
      ORDER BY recipient_blood_group, donor_blood_group
    `;
    const compatibility = await db.query(sql);

    res.json({
      success: true,
      count: compatibility.length,
      compatibility,
    });
  } catch (err) {
    console.error('Compatibility error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve blood compatibility matrix.' });
  }
});

// Register new blood unit into inventory
router.post('/inventory', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const {
      donation_id,
      donor_id,
      hospital_id,
      blood_group,
      component_type = 'WHOLE_BLOOD',
      donation_date,
      expiry_date,
      storage_location,
    } = req.body;

    if (!hospital_id || !blood_group || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'Hospital, blood group, and expiry date are required.',
      });
    }

    const sql = `
      INSERT INTO BloodUnit 
      (donation_id, donor_id, hospital_id, blood_group, component_type, donation_date, expiry_date, storage_status, storage_location)
      VALUES (?, ?, ?, ?, ?, COALESCE(?, CURDATE()), ?, 'AVAILABLE', ?)
    `;
    const result = await db.query(sql, [
      donation_id ? parseInt(donation_id, 10) : null,
      donor_id ? parseInt(donor_id, 10) : null,
      parseInt(hospital_id, 10),
      blood_group,
      component_type,
      donation_date || null,
      expiry_date,
      storage_location || 'Central Blood Vault',
    ]);

    res.status(201).json({
      success: true,
      unit_id: result.insertId,
      message: `Blood unit ${result.insertId} registered in inventory.`,
    });
  } catch (err) {
    console.error('Create blood unit error:', err);
    res.status(500).json({ success: false, message: `Failed to add blood unit: ${err.message}` });
  }
});

// Update blood unit status (e.g. DISCARDED, QUARANTINED)
router.put('/inventory/:id/status', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const unitId = parseInt(req.params.id, 10);
    const { storage_status, storage_location } = req.body;

    const sql = `
      UPDATE BloodUnit 
      SET 
        storage_status = COALESCE(?, storage_status),
        storage_location = COALESCE(?, storage_location)
      WHERE unit_id = ?
    `;
    await db.query(sql, [storage_status || null, storage_location || null, unitId]);

    res.json({
      success: true,
      message: `Blood unit ${unitId} updated to ${storage_status}.`,
    });
  } catch (err) {
    console.error('Update blood unit error:', err);
    res.status(500).json({ success: false, message: `Failed to update blood unit: ${err.message}` });
  }
});

module.exports = router;
