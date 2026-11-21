/**
 * Blood Bank & Inventory Routes (Module 5 & Query 2 & Query 3)
 * Connected directly to MySQL 8.0 (InnoDB) with CTE queries and Compatibility Matrix
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleMySQLError } = require('../utils/errorHandler');

// Get blood inventory with filters, search, and pagination
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const { blood_group, component_type, hospital_id, search, page = 1, limit = 50 } = req.query;
    const targetStatus = req.query.storage_status || req.query.status;

    const conditions = ['1=1'];
    const params = [];

    // RBAC: ADMIN and STAFF can only view their own hospital's inventory
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('bu.hospital_id = ?');
      params.push(req.user.hospital_id);
    } else if (hospital_id) {
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
    const total = Number(countRes[0]?.total) || 0;

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
    handleMySQLError(err, res, 'Failed to retrieve blood inventory.');
  }
});

// Hospital-Wise Inventory Matrix Summary (Query 3 / View)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('h.hospital_id = ?');
      params.push(req.user.hospital_id);
    }

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
      WHERE ${conditions.join(' AND ')}
      GROUP BY h.hospital_id, h.hospital_name, h.city
      ORDER BY available_units DESC
    `;
    const summary = await db.query(sql, params);

    const formatted = summary.map((s) => ({
      ...s,
      available_units: Number(s.available_units) || 0,
      expiring_soon_7d: Number(s.expiring_soon_7d) || 0,
      allocated_units: Number(s.allocated_units) || 0,
      expired_units: Number(s.expired_units) || 0,
      total_units_tracked: Number(s.total_units_tracked) || 0,
    }));

    res.json({
      success: true,
      count: formatted.length,
      summary: formatted,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve inventory summary.');
  }
});

// Blood Donations History Log
router.get('/donations', authenticateToken, async (req, res) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('bd.hospital_id = ?');
      params.push(req.user.hospital_id);
    }

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
        COALESCE(c.camp_name, 'In-Hospital Phlebotomy Suite') AS camp_name,
        CONCAT('Dr. ', COALESCE(sp.first_name, 'Staff'), ' ', COALESCE(sp.last_name, 'Physician')) AS staff_name
      FROM BloodDonation bd
      JOIN Donor d ON bd.donor_id = d.donor_id
      JOIN Person p ON d.person_id = p.person_id
      JOIN Hospital h ON bd.hospital_id = h.hospital_id
      LEFT JOIN DonationCamp c ON bd.donation_camp_id = c.camp_id
      LEFT JOIN Staff s ON bd.recorded_by_staff_id = s.staff_id
      LEFT JOIN Person sp ON s.person_id = sp.person_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY bd.donation_date DESC, bd.donation_id DESC
    `;
    const donations = await db.query(sql, params);

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve donation history logs.');
  }
});

// Query 2 Implementation: Expiring Blood Units CTE
router.get('/expiring-soon', authenticateToken, async (req, res) => {
  try {
    const conditions = ['bu.storage_status = "AVAILABLE"', 'bu.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)'];
    const params = [];
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('bu.hospital_id = ?');
      params.push(req.user.hospital_id);
    }

    const sql = `
      WITH ExpiringUnits AS (
        SELECT 
          bu.unit_id,
          bu.blood_group,
          bu.component_type,
          bu.donation_date,
          bu.expiry_date,
          bu.storage_location,
          bu.hospital_id,
          DATEDIFF(bu.expiry_date, CURDATE()) AS remaining_shelf_life_days
        FROM BloodUnit bu
        WHERE ${conditions.join(' AND ')}
      )
      SELECT 
        eu.*,
        h.hospital_name,
        h.city AS hospital_city
      FROM ExpiringUnits eu
      JOIN Hospital h ON eu.hospital_id = h.hospital_id
      ORDER BY remaining_shelf_life_days ASC, blood_group ASC
    `;

    const expiringUnits = await db.query(sql, params);

    res.json({
      success: true,
      count: expiringUnits.length,
      expiringUnits,
      query_type: 'COMMON TABLE EXPRESSION (WITH ... AS)',
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to compute expiring blood units via CTE.');
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
    handleMySQLError(err, res, 'Failed to retrieve blood compatibility matrix.');
  }
});

// Record In-Hospital Blood Donation (STAFF for their hospital, DEVELOPER for any hospital)
// Validates hemoglobin >= 12.5 g/dL and volume 350-450 ml, inserting BloodDonation and creating BloodUnit rows
router.post('/donations', authenticateToken, authorizeRoles('STAFF', 'DEVELOPER'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const {
      donor_id,
      hospital_id,
      quantity_ml = 450,
      hemoglobin_level = 14.0,
      component_types = ['WHOLE_BLOOD'],
      component_type,
      remarks,
    } = req.body;

    let finalHospitalId = hospital_id;
    if (req.user && req.user.role === 'STAFF' && req.user.hospital_id) {
      finalHospitalId = req.user.hospital_id;
    }

    const staffId = req.user?.staff_id || 7;

    const fields = {};
    if (!donor_id) fields.donor_id = 'Donor ID is required.';
    if (!finalHospitalId) fields.hospital_id = 'Hospital ID is required.';

    const hb = Number(hemoglobin_level);
    if (isNaN(hb) || hb < 12.5) {
      fields.hemoglobin_level = `Hemoglobin level must be at least 12.5 g/dL for safe clinical phlebotomy (Provided: ${hb || 0} g/dL).`;
    }

    const qty = Number(quantity_ml);
    if (isNaN(qty) || qty < 350 || qty > 450) {
      fields.quantity_ml = `Standard donation collection volume must be between 350 ml and 450 ml (Provided: ${qty || 0} ml).`;
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Clinical donation parameters do not meet safety protocol.',
        fields,
      });
    }

    await conn.query('START TRANSACTION');

    // 1. Verify donor existence and lock row
    const [donorRows] = await conn.query(
      'SELECT donor_id, blood_group, availability_status FROM Donor WHERE donor_id = ? FOR UPDATE',
      [parseInt(donor_id, 10)]
    );

    if (donorRows.length === 0) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Selected donor record does not exist.' });
    }

    const donor = donorRows[0];
    if (donor.availability_status === 'DEFERRED') {
      await conn.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Donor is currently marked as DEFERRED from donating.' });
    }

    // 2. Insert into BloodDonation
    const donationInsertSql = `
      INSERT INTO BloodDonation 
      (donor_id, hospital_id, recorded_by_staff_id, donation_date, quantity_ml, hemoglobin_level, screening_status, remarks)
      VALUES (?, ?, ?, CURDATE(), ?, ?, 'PASSED', ?)
    `;
    const [donationResult] = await conn.query(donationInsertSql, [
      parseInt(donor_id, 10),
      parseInt(finalHospitalId, 10),
      staffId,
      qty,
      hb,
      remarks || 'Clean in-hospital voluntary donation.',
    ]);
    const donationId = donationResult.insertId;

    // 3. Update donor's last_donation_date
    await conn.query(
      'UPDATE Donor SET last_donation_date = CURDATE(), availability_status = "AVAILABLE" WHERE donor_id = ?',
      [donor.donor_id]
    );

    // 4. Create BloodUnit row(s) based on selected component(s)
    const componentsToCreate = Array.isArray(component_types) && component_types.length > 0
      ? component_types
      : [component_type || 'WHOLE_BLOOD'];

    const shelfLifeDays = {
      WHOLE_BLOOD: 35,
      RBC: 42,
      PLATELETS: 5,
      PLASMA: 365,
      CRYO: 365,
    };

    const unitIds = [];

    for (const comp of componentsToCreate) {
      const days = shelfLifeDays[comp] || 35;
      const unitInsertSql = `
        INSERT INTO BloodUnit 
        (donation_id, donor_id, hospital_id, blood_group, component_type, donation_date, expiry_date, storage_status, storage_location)
        VALUES (?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), 'AVAILABLE', ?)
      `;
      const location = `${comp} Cold Section - Bay ${donor.blood_group}`;
      const [unitResult] = await conn.query(unitInsertSql, [
        donationId,
        donor.donor_id,
        parseInt(finalHospitalId, 10),
        donor.blood_group,
        comp,
        days,
        location,
      ]);
      unitIds.push(unitResult.insertId);
    }

    await conn.query('COMMIT');

    res.status(201).json({
      success: true,
      donation_id: donationId,
      units_created: unitIds,
      message: `Donation #${donationId} recorded successfully. Created ${unitIds.length} inventory blood unit(s): [${unitIds.join(', ')}].`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to record donation.');
  } finally {
    conn.release();
  }
});

// Register manual blood unit into inventory (ADMIN, STAFF)
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

    const fields = {};
    if (!hospital_id) fields.hospital_id = 'Hospital is required.';
    if (!blood_group) fields.blood_group = 'Blood group is required.';
    if (!expiry_date) fields.expiry_date = 'Expiry date is required.';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({ success: false, message: 'Missing required blood unit fields.', fields });
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
      message: `Blood unit #${result.insertId} registered in inventory.`,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to add blood unit to inventory.');
  }
});

// Update blood unit status (ADMIN, STAFF)
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
      message: `Blood unit #${unitId} updated to ${storage_status}.`,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to update blood unit.');
  }
});

module.exports = router;
