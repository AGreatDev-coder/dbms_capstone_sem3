/**
 * Dashboard & Analytics Routes (Module 1)
 * Computes live KPIs, blood inventory distribution, urgency breakdown, and alerts
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/metrics', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(new Date().getDate() + 7);
    const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

    // Total Donors
    const totalDonors = db.dbStore.donors.length;

    // Total Patients
    const totalPatients = db.dbStore.patients.length;

    // Total Hospitals
    const totalHospitals = db.dbStore.hospitals.length;

    // Available Blood Units (Valid, not expired)
    const availableBloodUnits = db.dbStore.bloodUnits.filter(
      (u) => u.storage_status === 'AVAILABLE' && u.expiry_date >= today
    ).length;

    // Pending Blood Requests
    const pendingBloodRequests = db.dbStore.bloodRequests.filter(
      (r) => r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED'
    ).length;

    // Urgent Requests (CRITICAL + HIGH)
    const urgentRequests = db.dbStore.bloodRequests.filter(
      (r) => (r.urgency_level === 'CRITICAL' || r.urgency_level === 'HIGH') &&
             (r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED')
    ).length;

    // Organ Donation Requests
    const organRequests = db.dbStore.organRequests.filter(
      (r) => r.request_status === 'WAITING' || r.request_status === 'MATCH_PROPOSED'
    ).length;

    // Expiring Blood Units within next 7 days
    const expiringBloodUnits = db.dbStore.bloodUnits.filter(
      (u) => u.storage_status === 'AVAILABLE' && u.expiry_date >= today && u.expiry_date <= sevenDaysStr
    ).length;

    res.json({
      success: true,
      metrics: {
        totalDonors,
        totalPatients,
        totalHospitals,
        availableBloodUnits,
        pendingBloodRequests,
        urgentRequests,
        organRequests,
        expiringBloodUnits,
      },
      isMySQLConnected: db.isMySQLConnected(),
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard metrics.' });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    // 1. Blood Group Distribution (Available units)
    const bloodGroupDistribution = allGroups.map((bg) => {
      const units = db.dbStore.bloodUnits.filter(
        (u) => u.blood_group === bg && u.storage_status === 'AVAILABLE' && u.expiry_date >= today
      );
      const donors = db.dbStore.donors.filter((d) => d.blood_group === bg).length;
      return {
        blood_group: bg,
        units: units.length,
        donors: donors,
      };
    });

    // 2. Request Urgency Breakdown
    const urgencyCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, ROUTINE: 0 };
    db.dbStore.bloodRequests.forEach((r) => {
      if (urgencyCounts[r.urgency_level] !== undefined) {
        urgencyCounts[r.urgency_level]++;
      }
    });
    const requestUrgencyData = Object.keys(urgencyCounts).map((key) => ({
      urgency: key,
      count: urgencyCounts[key],
    }));

    // 3. Hospital Inventory Comparison
    const hospitalInventoryData = db.dbStore.hospitals.map((h) => {
      const available = db.dbStore.bloodUnits.filter(
        (u) => u.hospital_id === h.hospital_id && u.storage_status === 'AVAILABLE' && u.expiry_date >= today
      ).length;
      const allocated = db.dbStore.bloodUnits.filter(
        (u) => u.hospital_id === h.hospital_id && u.storage_status === 'ALLOCATED'
      ).length;
      const expired = db.dbStore.bloodUnits.filter(
        (u) => u.hospital_id === h.hospital_id && (u.storage_status === 'EXPIRED' || u.expiry_date < today)
      ).length;

      return {
        hospital_name: h.hospital_name.split(' ')[0] + ' ' + (h.hospital_name.split(' ')[1] || ''),
        full_name: h.hospital_name,
        available,
        allocated,
        expired,
      };
    });

    // 4. Recent Allocations Activity
    const recentAllocations = db.dbStore.bloodAllocations.slice(-5).reverse().map((a) => {
      const req = db.dbStore.bloodRequests.find((r) => r.request_id === a.request_id);
      const unit = db.dbStore.bloodUnits.find((u) => u.unit_id === a.unit_id);
      const staff = db.dbStore.staff.find((s) => s.staff_id === a.allocated_by_staff_id);
      const staffPerson = staff ? db.dbStore.persons.find((p) => p.person_id === staff.person_id) : null;

      return {
        allocation_id: a.allocation_id,
        request_id: a.request_id,
        unit_id: a.unit_id,
        blood_group: unit ? unit.blood_group : 'N/A',
        component_type: unit ? unit.component_type : 'N/A',
        allocated_date: a.allocated_date,
        authorized_by: staffPerson ? `${staffPerson.first_name} ${staffPerson.last_name}` : 'Staff Member',
        status: a.allocation_status,
      };
    });

    res.json({
      success: true,
      bloodGroupDistribution,
      requestUrgencyData,
      hospitalInventoryData,
      recentAllocations,
    });
  } catch (err) {
    console.error('Dashboard charts error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate dashboard chart data.' });
  }
});

module.exports = router;

