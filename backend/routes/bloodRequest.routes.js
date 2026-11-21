/**
 * Blood Request Routes (Module 6 & Query 1 & Query 9)
 * Connected directly to MySQL 8.0 (InnoDB) with Window Functions and ACID Transaction Stored Procedure
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleMySQLError } = require('../utils/errorHandler');

// Get all blood requests with patient, hospital info, and allocation counts
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), async (req, res) => {
  try {
    const { hospital_id, status, blood_group } = req.query;

    const conditions = ['1=1'];
    const params = [];

    // RBAC: PATIENT can only view their own blood requests
    if (req.user.role === 'PATIENT') {
      const patientId = req.user.patient_id;
      if (patientId) {
        conditions.push('br.patient_id = ?');
        params.push(patientId);
      } else {
        conditions.push('pt.person_id = ?');
        params.push(req.user.person_id);
      }
    }

    if (hospital_id) {
      conditions.push('br.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }
    const urgency = req.query.urgency_level || req.query.urgency;
    if (urgency) {
      conditions.push('br.urgency_level = ?');
      params.push(urgency);
    }
    if (status) {
      conditions.push('br.request_status = ?');
      params.push(status);
    }
    if (blood_group) {
      conditions.push('br.blood_group = ?');
      params.push(blood_group);
    }

    const sql = `
      SELECT 
        br.request_id,
        br.patient_id,
        br.hospital_id,
        br.blood_group,
        br.component_type,
        br.units_required,
        br.urgency_level,
        br.request_date,
        br.required_by_date,
        br.request_status,
        br.clinical_indication,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.phone AS patient_phone,
        h.hospital_name,
        h.city AS hospital_city,
        COUNT(ba.allocation_id) AS allocated_count
      FROM BloodRequest br
      JOIN Patient pt ON br.patient_id = pt.patient_id
      JOIN Person p ON pt.person_id = p.person_id
      JOIN Hospital h ON br.hospital_id = h.hospital_id
      LEFT JOIN BloodAllocation ba ON br.request_id = ba.request_id AND ba.allocation_status = 'ALLOCATED'
      WHERE ${conditions.join(' AND ')}
      GROUP BY br.request_id
      ORDER BY 
        CASE br.urgency_level 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END ASC,
        br.request_date ASC
    `;

    const requests = await db.query(sql, params);

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve blood requests.');
  }
});

// Query 1 Implementation: Hospital Blood Request Priority Ranking using Window Function (DENSE_RANK)
const handlePrioritizedRequests = async (req, res) => {
  try {
    const { hospital_id } = req.query;
    const conditions = ["br.request_status IN ('PENDING', 'PARTIALLY_FULFILLED')"];
    const params = [];

    if (hospital_id) {
      conditions.push('br.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }

    const sql = `
      SELECT 
        br.request_id,
        br.patient_id,
        br.hospital_id,
        h.hospital_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        br.blood_group,
        br.component_type,
        br.units_required,
        br.urgency_level,
        br.request_date,
        br.request_status,
        TIMESTAMPDIFF(HOUR, br.request_date, NOW()) AS waiting_time_hours,
        COUNT(ba.allocation_id) AS allocated_units,
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
      LEFT JOIN BloodAllocation ba ON br.request_id = ba.request_id AND ba.allocation_status = 'ALLOCATED'
      WHERE ${conditions.join(' AND ')}
      GROUP BY br.request_id
      ORDER BY h.hospital_name ASC, hospital_priority_rank ASC
    `;

    const prioritizedRequests = await db.query(sql, params);

    res.json({
      success: true,
      count: prioritizedRequests.length,
      requests: prioritizedRequests,
      prioritizedRequests,
      query_type: 'WINDOW FUNCTION (DENSE_RANK() OVER PARTITION BY)',
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to compute prioritized blood requests.');
  }
};

router.get('/prioritized', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), handlePrioritizedRequests);
router.get('/priority-ranked', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), handlePrioritizedRequests);

// Create new blood request (ADMIN, STAFF, PATIENT)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), async (req, res) => {
  try {
    const {
      hospital_id,
      blood_group,
      component_type = 'WHOLE_BLOOD',
      units_required = 1,
      urgency_level = 'MEDIUM',
      required_by_date,
      clinical_indication,
    } = req.body;

    let targetPatientId = req.body.patient_id;

    // RBAC: If PATIENT, force own patient_id
    if (req.user.role === 'PATIENT') {
      if (req.user.patient_id) {
        targetPatientId = req.user.patient_id;
      } else {
        const [ptRows] = await db.query('SELECT patient_id FROM Patient WHERE person_id = ?', [req.user.person_id]);
        if (ptRows.length > 0) {
          targetPatientId = ptRows[0].patient_id;
        }
      }
    }

    const fields = {};
    if (!targetPatientId) fields.patient_id = 'Patient ID is required.';
    if (!hospital_id) fields.hospital_id = 'Hospital ID is required.';
    if (!blood_group) fields.blood_group = 'Blood group is required.';
    if (!units_required || parseInt(units_required, 10) <= 0) fields.units_required = 'Units required must be at least 1.';

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({ success: false, message: 'Missing required blood request parameters.', fields });
    }

    const sql = `
      INSERT INTO BloodRequest 
      (patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, request_date, required_by_date, request_status, clinical_indication)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), COALESCE(?, DATE_ADD(NOW(), INTERVAL 24 HOUR)), 'PENDING', ?)
    `;

    const result = await db.query(sql, [
      parseInt(targetPatientId, 10),
      parseInt(hospital_id, 10),
      blood_group,
      component_type,
      parseInt(units_required, 10),
      urgency_level,
      required_by_date || null,
      clinical_indication || 'Clinical transfusion requirement',
    ]);

    const created = {
      request_id: result.insertId,
      patient_id: parseInt(targetPatientId, 10),
      hospital_id: parseInt(hospital_id, 10),
      blood_group,
      component_type,
      units_required: parseInt(units_required, 10),
      urgency_level,
      request_status: 'PENDING',
    };

    res.status(201).json({
      success: true,
      request_id: result.insertId,
      request: created,
      message: `Blood request #${result.insertId} submitted successfully.`,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to create blood request.');
  }
});

// Central Allocation Handler supporting BOTH /blood-requests/allocate and /blood-requests/:id/allocate
const handleBloodAllocation = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id || req.body.request_id, 10);
    const unitId = parseInt(req.body.unit_id, 10);
    const { notes } = req.body;
    const staffId = req.user?.staff_id || 7;

    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Valid Request ID is required for allocation.' });
    }
    if (!unitId || isNaN(unitId)) {
      return res.status(400).json({ success: false, message: 'Valid Unit ID is required for allocation.' });
    }

    const result = await db.allocateBloodUnitTransaction(
      requestId,
      unitId,
      staffId,
      notes || 'Clinical blood transfusion allocation'
    );

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      allocationId: result.allocationId,
      transaction_guarantees: 'ACID Enforced (Row-Level Lock, Compatibility Check, Expiry Validation, Atomic Commit)',
    });
  } catch (err) {
    handleMySQLError(err, res, 'Blood allocation transaction failed.');
  }
};

router.post('/allocate', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), handleBloodAllocation);
router.post('/:id/allocate', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), handleBloodAllocation);

// Update blood request status
router.put('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { request_status } = req.body;

    if (!request_status) {
      return res.status(400).json({ success: false, message: 'Request status is required.' });
    }

    const sql = 'UPDATE BloodRequest SET request_status = ? WHERE request_id = ?';
    await db.query(sql, [request_status, requestId]);

    res.json({
      success: true,
      message: `Blood request #${requestId} status updated to ${request_status}.`,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to update request status.');
  }
});

module.exports = router;
