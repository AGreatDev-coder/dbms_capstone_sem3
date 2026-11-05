/**
 * Hospital & Ward Management Routes (Module 2)
 * Manages Hospitals, Wards, Bed Occupancy, and Hospital Staff hierarchy
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all hospitals with bed capacity statistics
router.get('/', async (req, res) => {
  try {
    const hospitals = db.dbStore.hospitals.map((h) => {
      const wards = db.dbStore.wards.filter((w) => w.hospital_id === h.hospital_id);
      const staff = db.dbStore.staff.filter((s) => s.hospital_id === h.hospital_id);
      const totalBeds = wards.reduce((sum, w) => sum + w.total_beds, 0);
      const occupiedBeds = wards.reduce((sum, w) => sum + w.occupied_beds, 0);
      const availableUnits = db.dbStore.bloodUnits.filter(
        (u) => u.hospital_id === h.hospital_id && u.storage_status === 'AVAILABLE'
      ).length;

      return {
        ...h,
        ward_count: wards.length,
        staff_count: staff.length,
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        occupancy_rate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        available_units: availableUnits,
      };
    });

    res.json({ success: true, hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve hospitals.' });
  }
});

// Get hospital details with wards and staff
router.get('/:id', async (req, res) => {
  try {
    const hospId = parseInt(req.params.id, 10);
    const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === hospId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    const wards = db.dbStore.wards.filter((w) => w.hospital_id === hospId);
    const staffList = db.dbStore.staff
      .filter((s) => s.hospital_id === hospId)
      .map((s) => {
        const p = db.dbStore.persons.find((pr) => pr.person_id === s.person_id);
        const supervisor = s.supervisor_staff_id ? db.dbStore.staff.find((sp) => sp.staff_id === s.supervisor_staff_id) : null;
        const supPerson = supervisor ? db.dbStore.persons.find((pr) => pr.person_id === supervisor.person_id) : null;
        return {
          ...s,
          name: p ? `${p.first_name} ${p.last_name}` : 'Unknown',
          email: p ? p.email : '',
          phone: p ? p.phone : '',
          supervisor_name: supPerson ? `${supPerson.first_name} ${supPerson.last_name}` : 'Executive / Direct Head',
        };
      });

    res.json({
      success: true,
      hospital: {
        ...hospital,
        wards,
        staff: staffList,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve hospital details.' });
  }
});

// Add new hospital
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { hospital_name, license_number, address, city, state, pincode, contact_phone, contact_email, emergency_helpline, established_year } = req.body;

    if (!hospital_name || !license_number || !contact_email) {
      return res.status(400).json({ success: false, message: 'Required fields: hospital_name, license_number, contact_email.' });
    }

    const newId = db.dbStore.hospitals.length > 0 ? Math.max(...db.dbStore.hospitals.map((h) => h.hospital_id)) + 1 : 1;
    const newHospital = {
      hospital_id: newId,
      hospital_name,
      license_number,
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      contact_phone: contact_phone || '',
      contact_email,
      emergency_helpline: emergency_helpline || contact_phone || '',
      established_year: parseInt(established_year || new Date().getFullYear(), 10),
      is_active: true,
    };

    db.dbStore.hospitals.push(newHospital);
    res.status(201).json({ success: true, hospital: newHospital, message: 'Hospital created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create hospital.' });
  }
});

// Update hospital
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const hospId = parseInt(req.params.id, 10);
    const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === hospId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    Object.assign(hospital, req.body);
    res.json({ success: true, hospital, message: 'Hospital updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update hospital.' });
  }
});

// Get wards for a hospital
router.get('/:id/wards', async (req, res) => {
  try {
    const hospId = parseInt(req.params.id, 10);
    const wards = db.dbStore.wards.filter((w) => w.hospital_id === hospId);
    res.json({ success: true, wards });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch wards.' });
  }
});

// Add ward to hospital
router.post('/:id/wards', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const hospId = parseInt(req.params.id, 10);
    const { ward_name, ward_type, floor_number, total_beds } = req.body;

    if (!ward_name || !ward_type || !total_beds) {
      return res.status(400).json({ success: false, message: 'Ward name, type, and total beds are required.' });
    }

    const newId = db.dbStore.wards.length > 0 ? Math.max(...db.dbStore.wards.map((w) => w.ward_id)) + 1 : 1;
    const newWard = {
      ward_id: newId,
      hospital_id: hospId,
      ward_name,
      ward_type,
      floor_number: parseInt(floor_number || 1, 10),
      total_beds: parseInt(total_beds, 10),
      occupied_beds: 0,
    };

    db.dbStore.wards.push(newWard);
    res.status(201).json({ success: true, ward: newWard, message: 'Ward added successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add ward.' });
  }
});

module.exports = router;

