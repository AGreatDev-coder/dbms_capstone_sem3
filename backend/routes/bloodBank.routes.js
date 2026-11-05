/**
 * Blood Bank Management Routes (Module 5, Query 2, Query 3)
 * Handles Blood Donations, Generating Blood Units, Inventory, and Expiry Tracking CTE
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get blood inventory with filters
router.get('/inventory', async (req, res) => {
  try {
    const { blood_group, storage_status, hospital_id, component_type } = req.query;

    let units = db.dbStore.bloodUnits.map((u) => {
      const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === u.hospital_id);
      const donor = db.dbStore.donors.find((d) => d.donor_id === u.donor_id);
      const donorPerson = donor ? db.dbStore.persons.find((p) => p.person_id === donor.person_id) : null;

      const today = new Date();
      const exp = new Date(u.expiry_date);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

      return {
        ...u,
        hospital_name: hospital ? hospital.hospital_name : 'Unknown Hospital',
        donor_name: donorPerson ? `${donorPerson.first_name} ${donorPerson.last_name}` : 'Anonymous Donor',
        days_to_expiry: diffDays,
        is_expired: exp < today,
      };
    });

    if (blood_group) units = units.filter((u) => u.blood_group === blood_group);
    if (storage_status) units = units.filter((u) => u.storage_status === storage_status);
    if (hospital_id) units = units.filter((u) => u.hospital_id === parseInt(hospital_id, 10));
    if (component_type) units = units.filter((u) => u.component_type === component_type);

    res.json({ success: true, count: units.length, units });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve blood inventory.' });
  }
});

// Query 2 Implementation: CTE Blood Expiry Tracking (Next 7 Days)
// Excludes expired, allocated, and discarded units
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
      ORDER BY remaining_shelf_life_days ASC, blood_group ASC;
    `;

    const results = await db.query(sql);

    res.json({
      success: true,
      query_concept: 'Common Table Expression (WITH clause) with Date Math Predicate',
      count: results.length,
      expiringUnits: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to execute expiry tracking CTE.' });
  }
});

// Query 3 Implementation: CTE Hospital-wise Blood Inventory Summary
router.get('/summary', async (req, res) => {
  try {
    const sql = `
      WITH HospitalBloodStats AS (
          SELECT 
              h.hospital_id,
              h.hospital_name,
              h.city,
              bu.blood_group,
              SUM(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date >= CURDATE() THEN 1 ELSE 0 END) AS available_units,
              SUM(CASE WHEN bu.storage_status = 'AVAILABLE' AND bu.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_soon_7d,
              SUM(CASE WHEN bu.storage_status = 'EXPIRED' OR (bu.storage_status = 'AVAILABLE' AND bu.expiry_date < CURDATE()) THEN 1 ELSE 0 END) AS expired_units,
              SUM(CASE WHEN bu.storage_status = 'ALLOCATED' THEN 1 ELSE 0 END) AS allocated_units,
              COUNT(bu.unit_id) AS total_units_cataloged
          FROM Hospital h
          LEFT JOIN BloodUnit bu ON h.hospital_id = bu.hospital_id
          GROUP BY h.hospital_id, h.hospital_name, h.city, bu.blood_group
      )
      SELECT 
          hospital_name,
          city,
          IFNULL(blood_group, 'N/A') AS blood_group,
          available_units,
          expiring_soon_7d,
          expired_units,
          allocated_units,
          total_units_cataloged
      FROM HospitalBloodStats
      ORDER BY hospital_name, blood_group;
    `;

    const results = await db.query(sql);
    res.json({ success: true, summary: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute inventory summary.' });
  }
});

// Get blood donations history
router.get('/donations', async (req, res) => {
  try {
    const donations = db.dbStore.donations.map((d) => {
      const donor = db.dbStore.donors.find((dn) => dn.donor_id === d.donor_id);
      const person = donor ? db.dbStore.persons.find((p) => p.person_id === donor.person_id) : null;
      const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === d.hospital_id);
      const camp = d.donation_camp_id ? db.dbStore.camps.find((c) => c.camp_id === d.donation_camp_id) : null;
      const staff = d.recorded_by_staff_id ? db.dbStore.staff.find((s) => s.staff_id === d.recorded_by_staff_id) : null;
      const staffPerson = staff ? db.dbStore.persons.find((p) => p.person_id === staff.person_id) : null;

      return {
        ...d,
        donor_name: person ? `${person.first_name} ${person.last_name}` : 'Unknown Donor',
        blood_group: donor ? donor.blood_group : 'O+',
        hospital_name: hospital ? hospital.hospital_name : 'Hospital',
        camp_name: camp ? camp.camp_name : 'In-Hospital Collection',
        recorded_by_name: staffPerson ? `${staffPerson.first_name} ${staffPerson.last_name}` : 'Medical Staff',
      };
    });

    res.json({ success: true, count: donations.length, donations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve blood donations.' });
  }
});

// Record new blood donation and generate blood units
router.post('/donations', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { donor_id, hospital_id, donation_camp_id, quantity_ml, hemoglobin_level, component_types, remarks } = req.body;

    if (!donor_id || !hospital_id || !quantity_ml || !hemoglobin_level) {
      return res.status(400).json({
        success: false,
        message: 'Donor ID, Hospital ID, quantity_ml, and hemoglobin_level are required.',
      });
    }

    const donor = db.dbStore.donors.find((d) => d.donor_id === parseInt(donor_id, 10));
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    const hb = parseFloat(hemoglobin_level);
    if (hb < 10.0) {
      return res.status(422).json({
        success: false,
        message: `Safety Deferral: Donor hemoglobin (${hb} g/dL) is below the minimum threshold of 10.0 g/dL.`,
      });
    }

    const screeningStatus = hb >= 12.5 ? 'PASSED' : 'PENDING';
    const donationDate = new Date().toISOString().split('T')[0];

    // 1. Create Donation Record
    const newDonationId = db.dbStore.donations.length > 0 ? Math.max(...db.dbStore.donations.map((d) => d.donation_id)) + 1 : 1;
    const newDonation = {
      donation_id: newDonationId,
      donor_id: parseInt(donor_id, 10),
      donation_camp_id: donation_camp_id ? parseInt(donation_camp_id, 10) : null,
      hospital_id: parseInt(hospital_id, 10),
      recorded_by_staff_id: req.user.user_id || 7,
      donation_date: donationDate,
      quantity_ml: parseInt(quantity_ml, 10),
      hemoglobin_level: hb,
      screening_status: screeningStatus,
      remarks: remarks || 'Standard phlebotomy collection.',
    };
    db.dbStore.donations.push(newDonation);

    // Update donor's last donation date
    donor.last_donation_date = donationDate;

    // 2. Generate Blood Unit(s)
    const generatedUnits = [];
    const components = component_types && component_types.length > 0 ? component_types : ['WHOLE_BLOOD'];

    components.forEach((comp) => {
      const newUnitId = db.dbStore.bloodUnits.length > 0 ? Math.max(...db.dbStore.bloodUnits.map((u) => u.unit_id)) + 1 : 1;
      
      // Shelf life based on component
      const expDate = new Date();
      if (comp === 'PLATELETS') {
        expDate.setDate(expDate.getDate() + 5);
      } else if (comp === 'PLASMA' || comp === 'CRYO') {
        expDate.setDate(expDate.getDate() + 365);
      } else {
        // WHOLE_BLOOD or RBC
        expDate.setDate(expDate.getDate() + 35);
      }

      const unit = {
        unit_id: newUnitId,
        donation_id: newDonationId,
        donor_id: parseInt(donor_id, 10),
        hospital_id: parseInt(hospital_id, 10),
        blood_group: donor.blood_group,
        component_type: comp,
        donation_date: donationDate,
        expiry_date: expDate.toISOString().split('T')[0],
        storage_status: 'AVAILABLE',
        storage_location: `Vault Bay ${comp[0]}-${Math.floor(Math.random() * 20 + 1)}`,
      };

      db.dbStore.bloodUnits.push(unit);
      generatedUnits.push(unit);
    });

    res.status(201).json({
      success: true,
      donation_id: newDonationId,
      units_generated: generatedUnits.length,
      generatedUnits,
      message: `Donation registered and ${generatedUnits.length} blood unit(s) cataloged into inventory.`,
    });
  } catch (err) {
    console.error('Blood donation error:', err);
    res.status(500).json({ success: false, message: 'Failed to record blood donation.' });
  }
});

// Compatibility Matrix lookup
router.get('/compatibility', (req, res) => {
  res.json({ success: true, compatibility: db.dbStore.compatibility });
});

module.exports = router;

