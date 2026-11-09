/**
 * Patient Management Routes (Module 4)
 * Handles Patient registration, hospital/ward assignment, medical status, and requests
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all patients (RBAC: Authorized Staff / Admin view)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { hospital_id, medical_status, blood_group } = req.query;

    let patients = db.dbStore.patients.map((pt) => {
      const person = db.dbStore.persons.find((p) => p.person_id === pt.person_id);
      const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === pt.hospital_id);
      const ward = pt.ward_id ? db.dbStore.wards.find((w) => w.ward_id === pt.ward_id) : null;
      const doctor = pt.attending_doctor_id ? db.dbStore.staff.find((s) => s.staff_id === pt.attending_doctor_id) : null;
      const docPerson = doctor ? db.dbStore.persons.find((p) => p.person_id === doctor.person_id) : null;

      const activeBloodRequests = db.dbStore.bloodRequests.filter(
        (r) => r.patient_id === pt.patient_id && (r.request_status === 'PENDING' || r.request_status === 'PARTIALLY_FULFILLED')
      ).length;

      const activeOrganRequests = db.dbStore.organRequests.filter(
        (r) => r.patient_id === pt.patient_id && r.request_status === 'WAITING'
      ).length;

      return {
        ...pt,
        name: person ? `${person.first_name} ${person.last_name}` : 'Unknown Patient',
        first_name: person ? person.first_name : '',
        last_name: person ? person.last_name : '',
        gender: person ? person.gender : 'OTHER',
        date_of_birth: person ? person.date_of_birth : '',
        phone: person ? person.phone : '',
        email: person ? person.email : '',
        blood_group: person ? person.blood_group : 'O+',
        city: person ? person.city : '',
        hospital_name: hospital ? hospital.hospital_name : 'Unknown Hospital',
        ward_name: ward ? `${ward.ward_name} (${ward.ward_type})` : 'Unassigned',
        attending_doctor_name: docPerson ? `Dr. ${docPerson.first_name} ${docPerson.last_name}` : 'Staff Physician',
        active_blood_requests: activeBloodRequests,
        active_organ_requests: activeOrganRequests,
      };
    });

    if (hospital_id) {
      patients = patients.filter((pt) => pt.hospital_id === parseInt(hospital_id, 10));
    }
    if (medical_status) {
      patients = patients.filter((pt) => pt.medical_status === medical_status);
    }
    if (blood_group) {
      patients = patients.filter((pt) => pt.blood_group === blood_group);
    }

    res.json({ success: true, count: patients.length, patients });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve patients.' });
  }
});

// Get single patient with requests history (RBAC protected)
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    const patient = db.dbStore.patients.find((pt) => pt.patient_id === patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Role check: PATIENT can only view their own patient profile
    if (req.user.role === 'PATIENT') {
      const isOwner = (req.user.patient_id && req.user.patient_id === patientId) || (req.user.person_id && req.user.person_id === patient.person_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Patients are only authorized to view their own medical profile.',
        });
      }
    }

    const person = db.dbStore.persons.find((p) => p.person_id === patient.person_id);
    const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === patient.hospital_id);
    const ward = patient.ward_id ? db.dbStore.wards.find((w) => w.ward_id === patient.ward_id) : null;

    const bloodRequests = db.dbStore.bloodRequests
      .filter((r) => r.patient_id === patientId)
      .map((r) => {
        const allocations = db.dbStore.bloodAllocations.filter((a) => a.request_id === r.request_id);
        return {
          ...r,
          allocated_count: allocations.length,
        };
      });

    const organRequests = db.dbStore.organRequests.filter((r) => r.patient_id === patientId);

    res.json({
      success: true,
      patient: {
        ...patient,
        first_name: person ? person.first_name : '',
        last_name: person ? person.last_name : '',
        gender: person ? person.gender : '',
        date_of_birth: person ? person.date_of_birth : '',
        phone: person ? person.phone : '',
        email: person ? person.email : '',
        address: person ? person.address : '',
        city: person ? person.city : '',
        blood_group: person ? person.blood_group : 'O+',
        hospital_name: hospital ? hospital.hospital_name : '',
        ward_name: ward ? ward.ward_name : '',
        bloodRequests,
        organRequests,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve patient details.' });
  }
});

// Register new patient (Person Supertype + Patient Subtype)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
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
      hospital_id,
      ward_id,
      attending_doctor_id,
      medical_status,
      medical_notes,
    } = req.body;

    if (!first_name || !last_name || !phone || !blood_group || !hospital_id) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, phone, blood group, and hospital are required.',
      });
    }

    // Check or create Person
    let person = db.dbStore.persons.find((p) => p.phone === phone);
    let personId;

    if (!person) {
      personId = db.dbStore.persons.length > 0 ? Math.max(...db.dbStore.persons.map((p) => p.person_id)) + 1 : 1;
      person = {
        person_id: personId,
        first_name,
        last_name,
        date_of_birth: date_of_birth || '1990-01-01',
        gender: gender || 'OTHER',
        phone,
        email: email || `patient_${personId}@lifelink.network`,
        address: address || 'Clinical Care Unit',
        city: city || 'City',
        state: state || 'State',
        pincode: pincode || '110001',
        blood_group,
        created_at: new Date().toISOString(),
      };
      db.dbStore.persons.push(person);
    } else {
      personId = person.person_id;
    }

    const newPatientId = db.dbStore.patients.length > 0 ? Math.max(...db.dbStore.patients.map((pt) => pt.patient_id)) + 1 : 1;
    const newPatient = {
      patient_id: newPatientId,
      person_id: personId,
      hospital_id: parseInt(hospital_id, 10),
      ward_id: ward_id ? parseInt(ward_id, 10) : null,
      attending_doctor_id: attending_doctor_id ? parseInt(attending_doctor_id, 10) : null,
      admission_date: new Date().toISOString().split('T')[0],
      discharge_date: null,
      medical_status: medical_status || 'STABLE',
      medical_notes: medical_notes || 'Inpatient admission record.',
    };

    db.dbStore.patients.push(newPatient);

    // Bed occupancy increment trigger simulation
    if (newPatient.ward_id) {
      const ward = db.dbStore.wards.find((w) => w.ward_id === newPatient.ward_id);
      if (ward && ward.occupied_beds < ward.total_beds) {
        ward.occupied_beds++;
      }
    }

    res.status(201).json({
      success: true,
      patient_id: newPatientId,
      message: `Patient admitted successfully (Patient ID: ${newPatientId}).`,
      patient: newPatient,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register patient.' });
  }
});

// Update patient status or discharge
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    const patient = db.dbStore.patients.find((pt) => pt.patient_id === patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const { medical_status, ward_id, discharge_date, medical_notes } = req.body;

    if (medical_status) {
      if (medical_status === 'DISCHARGED' && patient.medical_status !== 'DISCHARGED') {
        patient.discharge_date = discharge_date || new Date().toISOString().split('T')[0];
        // Decrement ward occupancy
        if (patient.ward_id) {
          const ward = db.dbStore.wards.find((w) => w.ward_id === patient.ward_id);
          if (ward && ward.occupied_beds > 0) ward.occupied_beds--;
        }
      }
      patient.medical_status = medical_status;
    }

    if (ward_id !== undefined && ward_id !== patient.ward_id) {
      // Transfer ward
      if (patient.ward_id) {
        const oldWard = db.dbStore.wards.find((w) => w.ward_id === patient.ward_id);
        if (oldWard && oldWard.occupied_beds > 0) oldWard.occupied_beds--;
      }
      patient.ward_id = ward_id ? parseInt(ward_id, 10) : null;
      if (patient.ward_id) {
        const newWard = db.dbStore.wards.find((w) => w.ward_id === patient.ward_id);
        if (newWard && newWard.occupied_beds < newWard.total_beds) newWard.occupied_beds++;
      }
    }

    if (medical_notes) patient.medical_notes = medical_notes;

    res.json({ success: true, patient, message: 'Patient updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update patient.' });
  }
});

module.exports = router;

