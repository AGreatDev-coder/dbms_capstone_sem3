/**
 * Donation Camp & Aggregation Routes (Module 8 & Query 7)
 * Implements Camp management, CampDonorRegistration junction, and Aggregates with HAVING
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all donation camps with registration and donation stats
router.get('/', async (req, res) => {
  try {
    const { status, hospital_id } = req.query;

    let camps = db.dbStore.camps.map((c) => {
      const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === c.hospital_id);
      const registrations = db.dbStore.campRegistrations.filter((r) => r.camp_id === c.camp_id);
      const attendedCount = registrations.filter((r) => r.attended).length;
      const donations = db.dbStore.donations.filter((d) => d.donation_camp_id === c.camp_id);
      const totalUnitsDonated = donations.length;

      return {
        ...c,
        hospital_name: hospital ? hospital.hospital_name : 'Hospital',
        registered_donors_count: registrations.length,
        attended_donors_count: attendedCount,
        total_donations_collected: totalUnitsDonated,
      };
    });

    if (status) camps = camps.filter((c) => c.camp_status === status);
    if (hospital_id) camps = camps.filter((c) => c.hospital_id === parseInt(hospital_id, 10));

    res.json({ success: true, count: camps.length, camps });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve donation camps.' });
  }
});

// Query 7 Implementation: Aggregate Functions with GROUP BY and HAVING
router.get('/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
          dc.camp_id,
          dc.camp_name,
          h.hospital_name,
          COUNT(bd.donation_id) AS total_donations_collected,
          SUM(bd.quantity_ml) AS total_blood_collected_ml,
          ROUND(AVG(bd.hemoglobin_level), 2) AS average_donor_hemoglobin,
          MIN(bd.quantity_ml) AS min_donation_ml,
          MAX(bd.quantity_ml) AS max_donation_ml
      FROM DonationCamp dc
      JOIN Hospital h ON dc.hospital_id = h.hospital_id
      JOIN BloodDonation bd ON dc.camp_id = bd.donation_camp_id
      WHERE bd.screening_status = 'PASSED'
      GROUP BY dc.camp_id, dc.camp_name, h.hospital_name
      HAVING COUNT(bd.donation_id) >= 2;
    `;

    const stats = await db.query(sql);

    res.json({
      success: true,
      query_concept: 'Aggregate Functions: COUNT, SUM, AVG, MIN, MAX with GROUP BY and HAVING COUNT() >= 2',
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute camp statistics.' });
  }
});

// Create new donation camp
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { camp_name, organizer, hospital_id, location, city, start_date, end_date, capacity, contact_phone } = req.body;

    if (!camp_name || !organizer || !hospital_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'camp_name, organizer, hospital_id, start_date, and end_date are required.',
      });
    }

    const newId = db.dbStore.camps.length > 0 ? Math.max(...db.dbStore.camps.map((c) => c.camp_id)) + 1 : 1;
    const newCamp = {
      camp_id: newId,
      camp_name,
      organizer,
      hospital_id: parseInt(hospital_id, 10),
      location: location || 'City Hall',
      city: city || 'New Delhi',
      start_date,
      end_date,
      capacity: parseInt(capacity || 200, 10),
      camp_status: 'SCHEDULED',
      contact_phone: contact_phone || '+91-11-26588500',
    };

    db.dbStore.camps.push(newCamp);
    res.status(201).json({ success: true, camp: newCamp, message: 'Donation camp created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create donation camp.' });
  }
});

// Register donor for camp (CampDonorRegistration Junction Table)
router.post('/:id/register', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const campId = parseInt(req.params.id, 10);
    const { donor_id } = req.body;

    const camp = db.dbStore.camps.find((c) => c.camp_id === campId);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Donation camp not found.' });
    }

    const donor = db.dbStore.donors.find((d) => d.donor_id === parseInt(donor_id, 10));
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    // Check duplicate
    const exists = db.dbStore.campRegistrations.some((r) => r.camp_id === campId && r.donor_id === donor.donor_id);
    if (exists) {
      return res.status(409).json({ success: false, message: 'Donor is already registered for this camp.' });
    }

    const regId = db.dbStore.campRegistrations.length > 0 ? Math.max(...db.dbStore.campRegistrations.map((r) => r.registration_id)) + 1 : 1;
    const registration = {
      registration_id: regId,
      camp_id: campId,
      donor_id: donor.donor_id,
      registration_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      attended: false,
      units_donated: 0,
    };

    db.dbStore.campRegistrations.push(registration);

    res.status(201).json({
      success: true,
      registration,
      message: `Donor #${donor.donor_id} registered for camp '${camp.camp_name}'.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register donor for camp.' });
  }
});

// Get donors registered for a camp
router.get('/:id/donors', async (req, res) => {
  try {
    const campId = parseInt(req.params.id, 10);
    const registrations = db.dbStore.campRegistrations
      .filter((r) => r.camp_id === campId)
      .map((r) => {
        const donor = db.dbStore.donors.find((d) => d.donor_id === r.donor_id);
        const person = donor ? db.dbStore.persons.find((p) => p.person_id === donor.person_id) : null;
        return {
          ...r,
          donor_name: person ? `${person.first_name} ${person.last_name}` : 'Unknown',
          blood_group: donor ? donor.blood_group : 'O+',
          phone: person ? person.phone : '',
        };
      });

    res.json({ success: true, donors: registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch registered donors.' });
  }
});

module.exports = router;

