/**
 * Organ Donation Network Routes (Module 7 & Section 5)
 * Connected directly to MySQL 8.0 (InnoDB) with Matching Evaluation and Medical Committee Verification
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all organ donations
router.get('/donations', async (req, res) => {
  try {
    const { organ_type, status } = req.query;
    const conditions = ['1=1'];
    const params = [];

    if (organ_type) {
      conditions.push('od.organ_type = ?');
      params.push(organ_type);
    }
    if (status) {
      conditions.push('od.donation_status = ?');
      params.push(status);
    }

    const sql = `
      SELECT 
        od.organ_donation_id,
        od.donor_id,
        od.organ_type,
        od.donation_status,
        od.registration_date,
        od.hla_type,
        od.medical_clearance,
        od.clinical_notes,
        CONCAT(p.first_name, ' ', p.last_name) AS donor_name,
        d.blood_group,
        p.city,
        p.phone
      FROM OrganDonation od
      JOIN Donor d ON od.donor_id = d.donor_id
      JOIN Person p ON d.person_id = p.person_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY od.registration_date DESC
    `;

    const donations = await db.query(sql, params);

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error('Organ donations error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve organ donations.' });
  }
});

// Register organ donation pledge
router.post('/donations', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const { donor_id, organ_type, hla_type, medical_clearance = true, clinical_notes } = req.body;

    if (!donor_id || !organ_type) {
      return res.status(400).json({ success: false, message: 'Donor ID and organ type are required.' });
    }

    const sql = `
      INSERT INTO OrganDonation 
      (donor_id, organ_type, donation_status, registration_date, hla_type, medical_clearance, clinical_notes)
      VALUES (?, ?, 'PLEDGED', CURDATE(), ?, ?, ?)
    `;
    const result = await db.query(sql, [
      parseInt(donor_id, 10),
      organ_type,
      hla_type || 'HLA-Unspecified',
      Boolean(medical_clearance),
      clinical_notes || 'Voluntary organ pledge under medical supervision',
    ]);

    res.status(201).json({
      success: true,
      donation_id: result.insertId,
      message: `Organ donation pledge registered successfully (ID: ${result.insertId}).`,
    });
  } catch (err) {
    console.error('Register organ donation error:', err);
    res.status(500).json({ success: false, message: `Failed to register organ donation: ${err.message}` });
  }
});

// Get organ requests (recipient waitlist)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { organ_type, status, urgency_level } = req.query;
    const conditions = ['1=1'];
    const params = [];

    // RBAC: ADMIN and STAFF are scoped to their own hospital's recipients
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('oq.hospital_id = ?');
      params.push(req.user.hospital_id);
    }

    if (organ_type) {
      conditions.push('oq.organ_type = ?');
      params.push(organ_type);
    }
    if (status) {
      conditions.push('oq.request_status = ?');
      params.push(status);
    }
    if (urgency_level) {
      conditions.push('oq.urgency_level = ?');
      params.push(urgency_level);
    }

    const sql = `
      SELECT 
        oq.organ_request_id,
        oq.patient_id,
        oq.hospital_id,
        oq.organ_type,
        oq.urgency_level,
        oq.request_date,
        oq.request_status,
        oq.hla_type,
        oq.medical_urgency_score,
        CONCAT(p.first_name, ' ', p.last_name) AS recipient_name,
        p.blood_group,
        p.date_of_birth,
        h.hospital_name,
        h.city AS hospital_city
      FROM OrganRequest oq
      JOIN Patient pt ON oq.patient_id = pt.patient_id
      JOIN Person p ON pt.person_id = p.person_id
      JOIN Hospital h ON oq.hospital_id = h.hospital_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY 
        CASE oq.urgency_level 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          ELSE 4 
        END ASC,
        oq.medical_urgency_score DESC,
        oq.request_date ASC
    `;

    const requests = await db.query(sql, params);

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error('Organ requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve organ requests.' });
  }
});

// Create new organ request
router.post('/requests', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { patient_id, hospital_id, organ_type, urgency_level = 'HIGH', hla_type, medical_urgency_score = 75 } = req.body;

    if (!patient_id || !hospital_id || !organ_type) {
      return res.status(400).json({ success: false, message: 'Patient, hospital, and organ type are required.' });
    }

    const sql = `
      INSERT INTO OrganRequest 
      (patient_id, hospital_id, organ_type, urgency_level, request_date, request_status, hla_type, medical_urgency_score)
      VALUES (?, ?, ?, ?, CURDATE(), 'WAITING', ?, ?)
    `;
    const result = await db.query(sql, [
      parseInt(patient_id, 10),
      parseInt(hospital_id, 10),
      organ_type,
      urgency_level,
      hla_type || 'HLA-Unspecified',
      parseInt(medical_urgency_score, 10) || 75,
    ]);

    res.status(201).json({
      success: true,
      organ_request_id: result.insertId,
      message: `Organ recipient request registered (ID: ${result.insertId}).`,
    });
  } catch (err) {
    console.error('Create organ request error:', err);
    res.status(500).json({ success: false, message: `Failed to create organ request: ${err.message}` });
  }
});

// Get organ matches with committee verification status
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const { verification_status } = req.query;
    const conditions = ['1=1'];
    const params = [];

    // RBAC: ADMIN and STAFF are scoped to matches involving their hospital
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('oq.hospital_id = ?');
      params.push(req.user.hospital_id);
    }

    if (verification_status) {
      conditions.push('om.verification_status = ?');
      params.push(verification_status);
    }

    const sql = `
      SELECT 
        om.match_id,
        om.organ_donation_id,
        om.organ_request_id,
        om.match_date,
        om.compatibility_status,
        om.verification_status,
        om.match_score,
        om.medical_notes,
        om.verification_date,
        od.organ_type,
        CONCAT(dp.first_name, ' ', dp.last_name) AS donor_name,
        d.blood_group AS donor_blood_group,
        CONCAT(rp.first_name, ' ', rp.last_name) AS recipient_name,
        rp.blood_group AS recipient_blood_group,
        h.hospital_name,
        CONCAT('Dr. ', vp.first_name, ' ', vp.last_name) AS verified_by_doctor
      FROM OrganMatch om
      JOIN OrganDonation od ON om.organ_donation_id = od.organ_donation_id
      JOIN Donor d ON od.donor_id = d.donor_id
      JOIN Person dp ON d.person_id = dp.person_id
      JOIN OrganRequest oq ON om.organ_request_id = oq.organ_request_id
      JOIN Patient pt ON oq.patient_id = pt.patient_id
      JOIN Person rp ON pt.person_id = rp.person_id
      JOIN Hospital h ON oq.hospital_id = h.hospital_id
      LEFT JOIN Staff vs ON om.verified_by_staff_id = vs.staff_id
      LEFT JOIN Person vp ON vs.person_id = vp.person_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY om.match_score DESC, om.match_date DESC
    `;

    const matches = await db.query(sql, params);

    res.json({
      success: true,
      count: matches.length,
      matches,
      regulatory_notice: 'Illustrative matching records subject to Medical Board Committee verification (Non-clinical academic demonstration).',
    });
  } catch (err) {
    console.error('Organ matches error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve organ matches.' });
  }
});

// Generate organ match candidate pairs (Academic Illustrative Compatibility Algorithm)
router.post('/matches/generate', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    // 1. Fetch WAITING organ requests
    const requests = await db.query(`
      SELECT r.organ_request_id, r.patient_id, r.hospital_id, r.organ_type, r.recipient_blood_group, r.hla_type, r.medical_urgency_score
      FROM OrganRequest r
      WHERE r.request_status = 'WAITING'
    `);

    // 2. Fetch PLEDGED / MATCH_PENDING organ donations with medical clearance
    const donations = await db.query(`
      SELECT od.organ_donation_id, od.donor_id, od.organ_type, od.hla_type, p.blood_group as donor_blood_group
      FROM OrganDonation od
      JOIN Donor d ON od.donor_id = d.donor_id
      JOIN Person p ON d.person_id = p.person_id
      WHERE od.donation_status IN ('PLEDGED', 'MATCH_PENDING') AND od.medical_clearance = TRUE
    `);

    const isAboCompatible = (donorBlood, recipientBlood) => {
      const dClean = (donorBlood || '').replace(/[+-]/g, '').trim().toUpperCase();
      const rClean = (recipientBlood || '').replace(/[+-]/g, '').trim().toUpperCase();
      if (dClean === 'O') return true; // Universal donor
      if (dClean === 'A' && (rClean === 'A' || rClean === 'AB')) return true;
      if (dClean === 'B' && (rClean === 'B' || rClean === 'AB')) return true;
      if (dClean === 'AB' && rClean === 'AB') return true;
      return false;
    };

    let generatedCount = 0;

    for (const reqItem of requests) {
      for (const donItem of donations) {
        if (reqItem.organ_type === donItem.organ_type) {
          const existing = await db.query(
            'SELECT match_id FROM OrganMatch WHERE organ_donation_id = ? AND organ_request_id = ?',
            [donItem.organ_donation_id, reqItem.organ_request_id]
          );

          if (existing.length === 0) {
            const compatible = isAboCompatible(donItem.donor_blood_group, reqItem.recipient_blood_group);
            const score = compatible 
              ? Math.min(99, Math.max(70, Math.floor(reqItem.medical_urgency_score * 0.95 + 8))) 
              : 0;
            const compStatus = compatible ? 'HIGH_COMPATIBILITY' : 'INCOMPATIBLE';
            const verStatus = compatible ? 'PENDING_VERIFICATION' : 'REJECTED';
            const notes = compatible 
              ? `Automated Candidate Match: Donor ${donItem.donor_blood_group} is ABO-compatible with recipient ${reqItem.recipient_blood_group}. HLA crossmatch pending clinical board review.`
              : `ABO Incompatible: Donor blood group ${donItem.donor_blood_group} cannot safely donate to recipient blood group ${reqItem.recipient_blood_group}.`;

            await db.query(`
              INSERT INTO OrganMatch (organ_donation_id, organ_request_id, match_date, compatibility_status, verification_status, match_score, medical_notes)
              VALUES (?, ?, NOW(), ?, ?, ?, ?)
            `, [donItem.organ_donation_id, reqItem.organ_request_id, compStatus, verStatus, score, notes]);

            generatedCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Evaluation completed successfully. Evaluated ${requests.length} waiting requests against ${donations.length} available donations. ${generatedCount} new match pairs recorded.`,
      newMatches: generatedCount
    });
  } catch (err) {
    console.error('Generate matches error:', err);
    res.status(500).json({ success: false, message: `Failed to evaluate match candidates: ${err.message}` });
  }
});

// Update match verification status (Medical Committee Action) - supports both /status and /verify endpoints
const updateMatchVerificationHandler = async (req, res) => {
  try {
    const matchId = parseInt(req.params.id, 10);
    const { verification_status, medical_notes } = req.body;
    const staffId = req.user?.staff_id || 3;

    if (!verification_status) {
      return res.status(400).json({ success: false, message: 'Verification status is required.' });
    }

    const sql = `
      UPDATE OrganMatch 
      SET 
        verification_status = ?,
        medical_notes = COALESCE(?, medical_notes),
        verified_by_staff_id = ?,
        verification_date = NOW()
      WHERE match_id = ?
    `;

    await db.query(sql, [verification_status, medical_notes || null, staffId, matchId]);

    res.json({
      success: true,
      message: `Organ match #${matchId} status updated to ${verification_status} by medical board committee.`,
    });
  } catch (err) {
    console.error('Update organ match error:', err);
    res.status(500).json({ success: false, message: `Failed to update organ match: ${err.message}` });
  }
};

router.put('/matches/:id/status', authenticateToken, authorizeRoles('ADMIN', 'DOCTOR', 'STAFF'), updateMatchVerificationHandler);
router.put('/matches/:id/verify', authenticateToken, authorizeRoles('ADMIN', 'DOCTOR', 'STAFF'), updateMatchVerificationHandler);

module.exports = router;
