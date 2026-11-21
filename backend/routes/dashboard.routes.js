/**
 * Dashboard & Analytics Routes (Module 1)
 * Connected directly to MySQL 8.0 (InnoDB) with Live Aggregate Metrics and Analytics Charts
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Live KPI Metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const isHospitalScoped = req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id;
    const hid = req.user?.hospital_id;

    const [patientCount] = isHospitalScoped
      ? await db.query('SELECT COUNT(*) AS c FROM Patient WHERE hospital_id = ?', [hid])
      : await db.query('SELECT COUNT(*) AS c FROM Patient');

    const [donorCount] = await db.query('SELECT COUNT(*) AS c FROM Donor');

    const [hospitalCount] = isHospitalScoped
      ? [{ c: 1 }]
      : (await db.query('SELECT COUNT(*) AS c FROM Hospital') || [{ c: 0 }]);

    const [staffCount] = isHospitalScoped
      ? await db.query('SELECT COUNT(*) AS c FROM Staff WHERE hospital_id = ? AND is_active = TRUE', [hid])
      : await db.query('SELECT COUNT(*) AS c FROM Staff WHERE is_active = TRUE');

    const [availUnits] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM BloodUnit WHERE storage_status = 'AVAILABLE' AND expiry_date >= CURDATE() AND hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM BloodUnit WHERE storage_status = 'AVAILABLE' AND expiry_date >= CURDATE()");

    const [pendingRequests] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED') AND hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED')");

    const [urgentRequests] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED') AND urgency_level IN ('CRITICAL', 'HIGH') AND hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED') AND urgency_level IN ('CRITICAL', 'HIGH')");

    const [criticalPatients] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM Patient WHERE medical_status = 'CRITICAL' AND hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM Patient WHERE medical_status = 'CRITICAL'");

    const [organRequests] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM OrganRequest WHERE request_status = 'WAITING' AND hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM OrganRequest WHERE request_status = 'WAITING'");

    const [pendingOrganMatches] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM OrganMatch om JOIN OrganRequest oq ON om.organ_request_id = oq.organ_request_id WHERE om.verification_status = 'PENDING_VERIFICATION' AND oq.hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM OrganMatch WHERE verification_status = 'PENDING_VERIFICATION'");

    const [expiringUnits] = isHospitalScoped
      ? await db.query("SELECT COUNT(*) AS c FROM BloodUnit WHERE storage_status = 'AVAILABLE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND hospital_id = ?", [hid])
      : await db.query("SELECT COUNT(*) AS c FROM BloodUnit WHERE storage_status = 'AVAILABLE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)");

    res.json({
      success: true,
      metrics: {
        totalPatients: Number(patientCount?.c ?? patientCount?.[0]?.c) || 0,
        totalDonors: Number(donorCount?.c ?? donorCount?.[0]?.c) || 0,
        totalHospitals: isHospitalScoped ? 1 : (Number(hospitalCount?.c ?? hospitalCount?.[0]?.c) || 0),
        totalStaff: Number(staffCount?.c ?? staffCount?.[0]?.c) || 0,
        availableBloodUnits: Number(availUnits?.c ?? availUnits?.[0]?.c) || 0,
        pendingBloodRequests: Number(pendingRequests?.c ?? pendingRequests?.[0]?.c) || 0,
        urgentRequests: Number(urgentRequests?.c ?? urgentRequests?.[0]?.c) || 0,
        criticalPatients: Number(criticalPatients?.c ?? criticalPatients?.[0]?.c) || 0,
        organRequests: Number(organRequests?.c ?? organRequests?.[0]?.c) || 0,
        pendingOrganMatches: Number(pendingOrganMatches?.c ?? pendingOrganMatches?.[0]?.c) || 0,
        expiringBloodUnits: Number(expiringUnits?.c ?? expiringUnits?.[0]?.c) || 0,
      },
      isMySQLConnected: db.isMySQLConnected(),
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard metrics.' });
  }
});

// Live Analytics Charts (Database GROUP BY queries)
router.get('/charts', authenticateToken, async (req, res) => {
  try {
    const isHospitalScoped = req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id;
    const hid = req.user?.hospital_id;

    // 1. Blood Group Inventory vs Registered Donors
    const bloodGroupSql = `
      SELECT 
        bg.blood_group,
        COUNT(DISTINCT bu.unit_id) AS units,
        COUNT(DISTINCT d.donor_id) AS donors
      FROM (
        SELECT 'A+' AS blood_group UNION SELECT 'A-' UNION SELECT 'B+' UNION SELECT 'B-' UNION SELECT 'AB+' UNION SELECT 'AB-' UNION SELECT 'O+' UNION SELECT 'O-'
      ) bg
      LEFT JOIN BloodUnit bu ON bg.blood_group = bu.blood_group AND bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() ${isHospitalScoped ? 'AND bu.hospital_id = ?' : ''}
      LEFT JOIN Donor d ON bg.blood_group = d.blood_group
      GROUP BY bg.blood_group
      ORDER BY bg.blood_group
    `;
    const bloodGroupDistribution = isHospitalScoped
      ? await db.query(bloodGroupSql, [hid])
      : await db.query(bloodGroupSql);

    // 2. Request Urgency Distribution
    const urgencySql = `
      SELECT 
        urgency_level AS name,
        urgency_level AS urgency,
        COUNT(*) AS count
      FROM BloodRequest
      WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED') ${isHospitalScoped ? 'AND hospital_id = ?' : ''}
      GROUP BY urgency_level
      ORDER BY FIELD(urgency_level, 'CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE')
    `;
    const requestUrgencyData = isHospitalScoped
      ? await db.query(urgencySql, [hid])
      : await db.query(urgencySql);

    // 3. Hospital Inventory Comparison Data
    const hospitalSql = `
      SELECT 
        h.hospital_name,
        COUNT(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() THEN 1 END) AS available,
        COUNT(CASE WHEN bu.storage_status = 'ALLOCATED' THEN 1 END) AS allocated,
        COUNT(CASE WHEN bu.storage_status = 'EXPIRED' OR (bu.storage_status = 'AVAILABLE' AND bu.expiry_date < CURDATE()) THEN 1 END) AS expired
      FROM Hospital h
      LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id
      ${isHospitalScoped ? 'WHERE h.hospital_id = ?' : ''}
      GROUP BY h.hospital_id, h.hospital_name
      ORDER BY h.hospital_id ASC
    `;
    const hospitalInventoryData = isHospitalScoped
      ? await db.query(hospitalSql, [hid])
      : await db.query(hospitalSql);

    // 4. Recent Blood Allocations
    const recentAllocSql = `
      SELECT 
        ba.allocation_id,
        ba.request_id,
        ba.unit_id,
        ba.allocated_date,
        ba.notes,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.blood_group,
        h.hospital_name,
        CONCAT('Dr. ', COALESCE(sp.first_name, 'Staff'), ' ', COALESCE(sp.last_name, 'Physician')) AS staff_name
      FROM BloodAllocation ba
      JOIN BloodRequest br ON ba.request_id = br.request_id
      JOIN Patient pt ON br.patient_id = pt.patient_id
      JOIN Person p ON pt.person_id = p.person_id
      JOIN Hospital h ON br.hospital_id = h.hospital_id
      LEFT JOIN Staff s ON ba.allocated_by_staff_id = s.staff_id
      LEFT JOIN Person sp ON s.person_id = sp.person_id
      ${isHospitalScoped ? 'WHERE br.hospital_id = ?' : ''}
      ORDER BY ba.allocated_date DESC
      LIMIT 5
    `;
    const recentAllocations = isHospitalScoped
      ? await db.query(recentAllocSql, [hid])
      : await db.query(recentAllocSql);

    res.json({
      success: true,
      charts: {
        bloodGroupDistribution,
        requestUrgencyData,
        hospitalInventoryData,
        recentAllocations,
      },
      bloodGroupDistribution,
      requestUrgencyData,
      hospitalInventoryData,
      recentAllocations,
    });
  } catch (err) {
    console.error('Dashboard charts error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard analytics charts.' });
  }
});

module.exports = router;
