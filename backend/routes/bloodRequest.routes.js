/**
 * Blood Request & Allocation Routes (Module 6, Query 1, Query 9)
 * Handles Priority Ranking Window Function and ACID Transactional Blood Allocation
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all blood requests
router.get('/', async (req, res) => {
  try {
    const { hospital_id, status, urgency, blood_group } = req.query;

    let requests = db.dbStore.bloodRequests.map((r) => {
      const patient = db.dbStore.patients.find((p) => p.patient_id === r.patient_id);
      const person = patient ? db.dbStore.persons.find((pr) => pr.person_id === patient.person_id) : null;
      const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === r.hospital_id);

      const allocations = db.dbStore.bloodAllocations.filter((a) => a.request_id === r.request_id);

      return {
        ...r,
        patient_name: person ? `${person.first_name} ${person.last_name}` : 'Unknown Patient',
        hospital_name: hospital ? hospital.hospital_name : 'Hospital',
        allocated_units_count: allocations.length,
      };
    });

    if (hospital_id) requests = requests.filter((r) => r.hospital_id === parseInt(hospital_id, 10));
    if (status) requests = requests.filter((r) => r.request_status === status);
    if (urgency) requests = requests.filter((r) => r.urgency_level === urgency);
    if (blood_group) requests = requests.filter((r) => r.blood_group === blood_group);

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve blood requests.' });
  }
});

// Query 1 Implementation: Window Function – Urgency & Waiting Time Priority Ranking
router.get('/priority-ranked', async (req, res) => {
  try {
    const sql = `
      SELECT 
          br.request_id,
          h.hospital_name,
          CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
          br.blood_group,
          br.component_type,
          br.units_required,
          br.urgency_level,
          TIMESTAMPDIFF(HOUR, br.request_date, NOW()) AS waiting_time_hours,
          DENSE_RANK() OVER (
              PARTITION BY br.hospital_id
              ORDER BY 
                  CASE br.urgency_level 
                      WHEN 'CRITICAL' THEN 1 
                      WHEN 'HIGH' THEN 2 
                      WHEN 'MEDIUM' THEN 3 
                      WHEN 'ROUTINE' THEN 4 
                      ELSE 5 
                  END ASC,
                  br.request_date ASC
          ) AS hospital_priority_rank
      FROM BloodRequest br
      JOIN Hospital h ON br.hospital_id = h.hospital_id
      JOIN Patient pt ON br.patient_id = pt.patient_id
      JOIN Person p ON pt.person_id = p.person_id
      WHERE br.request_status IN ('PENDING', 'PARTIALLY_FULFILLED')
      ORDER BY h.hospital_name, hospital_priority_rank;
    `;

    const rankedRequests = await db.query(sql);

    res.json({
      success: true,
      query_concept: 'Window Function: DENSE_RANK() OVER (PARTITION BY hospital_id ORDER BY urgency, waiting_time)',
      count: rankedRequests.length,
      requests: rankedRequests,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute request rankings.' });
  }
});

// Create new blood request
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), async (req, res) => {
  try {
    const { patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, required_by_date, clinical_indication } = req.body;

    if (!patient_id || !hospital_id || !blood_group || !units_required) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, Hospital ID, blood group, and units required are mandatory.',
      });
    }

    const patient = db.dbStore.patients.find((p) => p.patient_id === parseInt(patient_id, 10));
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const newReqId = db.dbStore.bloodRequests.length > 0 ? Math.max(...db.dbStore.bloodRequests.map((r) => r.request_id)) + 1 : 1;
    const reqDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const reqBy = required_by_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

    const newRequest = {
      request_id: newReqId,
      patient_id: parseInt(patient_id, 10),
      hospital_id: parseInt(hospital_id, 10),
      blood_group,
      component_type: component_type || 'WHOLE_BLOOD',
      units_required: parseInt(units_required, 10),
      urgency_level: urgency_level || 'MEDIUM',
      request_date: reqDate,
      required_by_date: reqBy,
      request_status: 'PENDING',
      clinical_indication: clinical_indication || 'Clinical transfusion requirement',
    };

    db.dbStore.bloodRequests.push(newRequest);

    res.status(201).json({
      success: true,
      request_id: newReqId,
      request: newRequest,
      message: `Blood request #${newReqId} created successfully.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create blood request.' });
  }
});

// Query 9 Implementation: ACID Transactional Blood Allocation
// Verifies availability, checks compatibility, locks row, updates status, and commits/rollbacks
router.post('/allocate', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { request_id, unit_id, notes } = req.body;
    const staffId = req.user.user_id || 7; // Lead Technologist default

    if (!request_id || !unit_id) {
      return res.status(400).json({
        success: false,
        message: 'request_id and unit_id are required for allocation.',
      });
    }

    // Call ACID transactional procedure / adapter
    const result = await db.allocateBloodUnitTransaction(request_id, unit_id, staffId, notes);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Allocation error:', err);
    res.status(500).json({ success: false, message: 'Server transaction failure: ' + err.message });
  }
});

// Get allocations for a request
router.get('/:id/allocations', async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const allocations = db.dbStore.bloodAllocations
      .filter((a) => a.request_id === reqId)
      .map((a) => {
        const unit = db.dbStore.bloodUnits.find((u) => u.unit_id === a.unit_id);
        const staff = db.dbStore.staff.find((s) => s.staff_id === a.allocated_by_staff_id);
        const staffPerson = staff ? db.dbStore.persons.find((p) => p.person_id === staff.person_id) : null;

        return {
          ...a,
          unit_blood_group: unit ? unit.blood_group : 'N/A',
          unit_component_type: unit ? unit.component_type : 'N/A',
          authorized_by_name: staffPerson ? `${staffPerson.first_name} ${staffPerson.last_name}` : 'Staff',
        };
      });

    res.json({ success: true, allocations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch allocations.' });
  }
});

module.exports = router;

