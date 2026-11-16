/**
 * Dashboard & Analytics Routes (Module 1)
 * Connected directly to MySQL 8.0 (InnoDB) with Live Aggregate Metrics and Analytics Charts
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Live KPI Metrics
router.get('/metrics', async (req, res) => {
  try {
    const [patientCount] = await db.query('SELECT COUNT(*) AS c FROM Patient');
    const [donorCount] = await db.query('SELECT COUNT(*) AS c FROM Donor');
    const [hospitalCount] = await db.query('SELECT COUNT(*) AS c FROM Hospital');
    const [staffCount] = await db.query('SELECT COUNT(*) AS c FROM Staff');

    const [availUnits] = await db.query(
      "SELECT COUNT(*) AS c FROM BloodUnit WHERE storage_status = 'AVAILABLE' AND expiry_date >= CURDATE()"
    );

    const [pendingRequests] = await db.query(
      "SELECT COUNT(*) AS c FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED')"
    );

    const [urgentRequests] = await db.query(
      "SELECT COUNT(*) AS c FROM BloodRequest WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED') AND urgency_level IN ('CRITICAL', 'HIGH')"
    );

    const [criticalPatients] = await db.query(
      "SELECT COUNT(*) AS c FROM Patient WHERE medical_status = 'CRITICAL'"
    );

    const [organRequests] = await db.query(
      "SELECT COUNT(*) AS c FROM OrganRequest WHERE request_status = 'WAITING'"
    );

    const [pendingOrganMatches] = await db.query(
      "SELECT COUNT(*) AS c FROM OrganMatch WHERE verification_status = 'PENDING_VERIFICATION'"
    );

    const [expiringUnits] = await db.query(
      "SELECT COUNT(*) AS c FROM BloodUnit WHERE storage_status = 'AVAILABLE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)"
    );

    res.json({
      success: true,
      metrics: {
        totalPatients: patientCount[0]?.c || 0,
        totalDonors: donorCount[0]?.c || 0,
        totalHospitals: hospitalCount[0]?.c || 0,
        totalStaff: staffCount[0]?.c || 0,
        availableBloodUnits: availUnits[0]?.c || 0,
        pendingBloodRequests: pendingRequests[0]?.c || 0,
        urgentRequests: urgentRequests[0]?.c || 0,
        criticalPatients: criticalPatients[0]?.c || 0,
        organRequests: organRequests[0]?.c || 0,
        pendingOrganMatches: pendingOrganMatches[0]?.c || 0,
        expiringBloodUnits: expiringUnits[0]?.c || 0,
      },
      isMySQLConnected: db.isMySQLConnected(),
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard metrics.' });
  }
});

// Live Analytics Charts (Database GROUP BY queries)
router.get('/charts', async (req, res) => {
  try {
    // 1. Blood Group Inventory vs Registered Donors
    const bloodGroupSql = `
      SELECT 
        bg.blood_group,
        COUNT(DISTINCT bu.unit_id) AS units,
        COUNT(DISTINCT d.donor_id) AS donors
      FROM (
        SELECT 'A+' AS blood_group UNION SELECT 'A-' UNION SELECT 'B+' UNION SELECT 'B-' UNION SELECT 'AB+' UNION SELECT 'AB-' UNION SELECT 'O+' UNION SELECT 'O-'
      ) bg
      LEFT JOIN BloodUnit bu ON bg.blood_group = bu.blood_group AND bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE()
      LEFT JOIN Donor d ON bg.blood_group = d.blood_group
      GROUP BY bg.blood_group
      ORDER BY bg.blood_group
    `;
    const bloodGroupDistribution = await db.query(bloodGroupSql);

    // 2. Request Urgency Distribution
    const urgencySql = `
      SELECT 
        urgency_level AS name,
        urgency_level AS urgency,
        COUNT(*) AS count
      FROM BloodRequest
      WHERE request_status IN ('PENDING', 'PARTIALLY_FULFILLED')
      GROUP BY urgency_level
      ORDER BY FIELD(urgency_level, 'CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE')
    `;
    const requestUrgencyData = await db.query(urgencySql);

    // 3. Hospital Inventory Comparison Data
    const hospitalSql = `
      SELECT 
        h.hospital_name,
        COUNT(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() THEN 1 END) AS available,
        COUNT(CASE WHEN bu.storage_status = 'ALLOCATED' THEN 1 END) AS allocated,
        COUNT(CASE WHEN bu.storage_status = 'EXPIRED' OR (bu.storage_status = 'AVAILABLE' AND bu.expiry_date < CURDATE()) THEN 1 END) AS expired
      FROM Hospital h
      LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id
      GROUP BY h.hospital_id, h.hospital_name
      ORDER BY h.hospital_id ASC
    `;
    const hospitalInventoryData = await db.query(hospitalSql);

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
      ORDER BY ba.allocated_date DESC
      LIMIT 5
    `;
    const recentAllocations = await db.query(recentAllocSql);

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
