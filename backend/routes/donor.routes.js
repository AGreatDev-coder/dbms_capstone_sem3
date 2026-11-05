/**
 * Donor Management Routes (Module 3 & Query 4)
 * Handles Donor registration, filtering, donation history, and sensitive data view
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all donors with Person supertype attributes (Authorized Staff / Admin view)
router.get('/', async (req, res) => {
  try {
    const { blood_group, donor_type, status } = req.query;

    let donors = db.dbStore.donors.map((d) => {
      const person = db.dbStore.persons.find((p) => p.person_id === d.person_id);
      const donationCount = db.dbStore.donations.filter((dn) => dn.donor_id === d.donor_id).length;
      return {
        ...d,
        name: person ? `${person.first_name} ${person.last_name}` : 'Unknown',
        first_name: person ? person.first_name : '',
        last_name: person ? person.last_name : '',
        gender: person ? person.gender : 'OTHER',
        phone: person ? person.phone : '',
        email: person ? person.email : '',
        city: person ? person.city : '',
        state: person ? person.state : '',
        donation_count: donationCount,
      };
    });

    if (blood_group) {
      donors = donors.filter((d) => d.blood_group === blood_group);
    }
    if (donor_type) {
      donors = donors.filter((d) => d.donor_type === donor_type);
    }
    if (status) {
      donors = donors.filter((d) => d.availability_status === status);
    }

    res.json({ success: true, count: donors.length, donors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve donors.' });
  }
});

// Query 4 Implementation: Public Donor Directory View (Data Masking)
// Never exposes phone, email, full address, or medical history notes
router.get('/public-directory', async (req, res) => {
  try {
    const { blood_group } = req.query;
    let directory = db.dbStore.donors
      .filter((d) => d.availability_status !== 'INACTIVE')
      .map((d) => {
        const person = db.dbStore.persons.find((p) => p.person_id === d.person_id);
        const approvedName = person ? `${person.first_name.charAt(0)}. ${person.last_name}` : 'Anonymous Donor';
        return {
          donor_id: d.donor_id,
          approved_display_name: approvedName,
          gender: person ? person.gender : 'OTHER',
          city: person ? person.city : 'N/A',
          state: person ? person.state : 'N/A',
          blood_group: d.blood_group,
          donor_type: d.donor_type,
          availability_status: d.availability_status,
          registration_date: d.registration_date,
        };
      });

    if (blood_group) {
      directory = directory.filter((d) => d.blood_group === blood_group);
    }

    res.json({
      success: true,
      view_name: 'vw_public_donor_directory',
      security_note: 'Confidential personal identifiers (phone, email, full address, medical history) are strictly masked.',
      donors: directory,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch public donor directory.' });
  }
});

// Get single donor details and complete history
router.get('/:id', async (req, res) => {
  try {
    const donorId = parseInt(req.params.id, 10);
    const donor = db.dbStore.donors.find((d) => d.donor_id === donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    const person = db.dbStore.persons.find((p) => p.person_id === donor.person_id);
    const donations = db.dbStore.donations
      .filter((dn) => dn.donor_id === donorId)
      .map((dn) => {
        const camp = dn.donation_camp_id ? db.dbStore.camps.find((c) => c.camp_id === dn.donation_camp_id) : null;
        const hosp = db.dbStore.hospitals.find((h) => h.hospital_id === dn.hospital_id);
        const units = db.dbStore.bloodUnits.filter((u) => u.donation_id === dn.donation_id);
        return {
          ...dn,
          camp_name: camp ? camp.camp_name : 'In-Hospital Direct Collection',
          hospital_name: hosp ? hosp.hospital_name : 'Hospital',
          units_generated: units.length,
        };
      });

    const organPledges = db.dbStore.organDonations.filter((od) => od.donor_id === donorId);

    res.json({
      success: true,
      donor: {
        ...donor,
        first_name: person ? person.first_name : '',
        last_name: person ? person.last_name : '',
        gender: person ? person.gender : '',
        phone: person ? person.phone : '',
        email: person ? person.email : '',
        address: person ? person.address : '',
        city: person ? person.city : '',
        state: person ? person.state : '',
        pincode: person ? person.pincode : '',
        donations,
        organPledges,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch donor details.' });
  }
});

// Register new donor (Handles Person Supertype and Donor Subtype)
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      blood_group,
      donor_type,
      medical_history_notes,
    } = req.body;

    if (!first_name || !last_name || !phone || !blood_group) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, phone, and blood group are required.',
      });
    }

    // 1. Check if Person already exists by phone or email
    let person = db.dbStore.persons.find((p) => p.phone === phone || (email && p.email === email));
    let personId;

    if (!person) {
      personId = db.dbStore.persons.length > 0 ? Math.max(...db.dbStore.persons.map((p) => p.person_id)) + 1 : 1;
      person = {
        person_id: personId,
        first_name,
        last_name,
        date_of_birth: date_of_birth || '1995-01-01',
        gender: gender || 'OTHER',
        phone,
        email: email || `donor_${personId}@lifelink.network`,
        address: address || 'City Center',
        city: city || 'New Delhi',
        state: state || 'Delhi',
        pincode: pincode || '110001',
        blood_group,
        created_at: new Date().toISOString(),
      };
      db.dbStore.persons.push(person);
    } else {
      personId = person.person_id;
      // Check if already registered as donor
      const existingDonor = db.dbStore.donors.find((d) => d.person_id === personId);
      if (existingDonor) {
        return res.status(409).json({
          success: false,
          message: `Person with phone ${phone} is already registered as Donor ID ${existingDonor.donor_id}.`,
        });
      }
    }

    // 2. Insert Donor Subtype
    const newDonorId = db.dbStore.donors.length > 0 ? Math.max(...db.dbStore.donors.map((d) => d.donor_id)) + 1 : 1;
    const newDonor = {
      donor_id: newDonorId,
      person_id: personId,
      donor_type: donor_type || 'BLOOD',
      blood_group,
      registration_date: new Date().toISOString().split('T')[0],
      availability_status: 'AVAILABLE',
      last_donation_date: null,
      deferral_reason: null,
      medical_history_notes: medical_history_notes || 'Voluntary donor self-registration.',
    };
    db.dbStore.donors.push(newDonor);

    res.status(201).json({
      success: true,
      donor_id: newDonorId,
      message: `Donor registered successfully (Donor ID: ${newDonorId}, Person ID: ${personId}).`,
      donor: {
        ...newDonor,
        first_name: person.first_name,
        last_name: person.last_name,
      },
    });
  } catch (err) {
    console.error('Donor registration error:', err);
    res.status(500).json({ success: false, message: 'Failed to register donor.' });
  }
});

// Update Donor Information
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const donorId = parseInt(req.params.id, 10);
    const donor = db.dbStore.donors.find((d) => d.donor_id === donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    const { availability_status, deferral_reason, medical_history_notes, phone, email, address, city } = req.body;

    if (availability_status) donor.availability_status = availability_status;
    if (deferral_reason !== undefined) donor.deferral_reason = deferral_reason;
    if (medical_history_notes !== undefined) donor.medical_history_notes = medical_history_notes;

    // Update person demographic details if provided
    const person = db.dbStore.persons.find((p) => p.person_id === donor.person_id);
    if (person) {
      if (phone) person.phone = phone;
      if (email) person.email = email;
      if (address) person.address = address;
      if (city) person.city = city;
    }

    res.json({ success: true, donor, message: 'Donor information updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update donor information.' });
  }
});

module.exports = router;

