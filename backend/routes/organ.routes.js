/**
 * Organ Donation Network Routes (Module 7)
 * Illustrative Candidate Matching and Staff Verification Workflow
 * Note: Academic demonstration system; strictly non-clinical.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all pledged organ donations
router.get('/donations', async (req, res) => {
  try {
    const { organ_type, status } = req.query;

    let donations = db.dbStore.organDonations.map((od) => {
      const donor = db.dbStore.donors.find((d) => d.donor_id === od.donor_id);
      const person = donor ? db.dbStore.persons.find((p) => p.person_id === donor.person_id) : null;

      return {
        ...od,
        donor_name: person ? `${person.first_name} ${person.last_name}` : 'Unknown Donor',
        blood_group: donor ? donor.blood_group : 'O+',
        city: person ? person.city : '',
        state: person ? person.state : '',
      };
    });

    if (organ_type) donations = donations.filter((od) => od.organ_type === organ_type);
    if (status) donations = donations.filter((od) => od.donation_status === status);

    res.json({ success: true, count: donations.length, donations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve organ donations.' });
  }
});

// Register new organ pledge
router.post('/donations', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const { donor_id, organ_type, hla_type, clinical_notes } = req.body;

    if (!donor_id || !organ_type) {
      return res.status(400).json({ success: false, message: 'donor_id and organ_type are required.' });
    }

    const newId = db.dbStore.organDonations.length > 0 ? Math.max(...db.dbStore.organDonations.map((o) => o.organ_donation_id)) + 1 : 1;
    const newDonation = {
      organ_donation_id: newId,
      donor_id: parseInt(donor_id, 10),
      organ_type,
      donation_status: 'PLEDGED',
      registration_date: new Date().toISOString().split('T')[0],
      hla_type: hla_type || 'Standard Panel',
      medical_clearance: true,
      clinical_notes: clinical_notes || 'Voluntary organ donor registration pledge.',
    };

    db.dbStore.organDonations.push(newDonation);
    res.status(201).json({ success: true, organ_donation_id: newId, donation: newDonation, message: 'Organ pledge registered successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register organ pledge.' });
  }
});

// Get organ waiting list requests
router.get('/requests', async (req, res) => {
  try {
    const { organ_type, status, urgency } = req.query;

    let requests = db.dbStore.organRequests.map((or) => {
      const patient = db.dbStore.patients.find((p) => p.patient_id === or.patient_id);
      const person = patient ? db.dbStore.persons.find((pr) => pr.person_id === patient.person_id) : null;
      const hospital = db.dbStore.hospitals.find((h) => h.hospital_id === or.hospital_id);

      return {
        ...or,
        patient_name: person ? `${person.first_name} ${person.last_name}` : 'Unknown Patient',
        hospital_name: hospital ? hospital.hospital_name : 'Hospital',
        city: hospital ? hospital.city : '',
      };
    });

    if (organ_type) requests = requests.filter((or) => or.organ_type === organ_type);
    if (status) requests = requests.filter((or) => or.request_status === status);
    if (urgency) requests = requests.filter((or) => or.urgency_level === urgency);

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve organ requests.' });
  }
});

// Create organ request
router.post('/requests', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'PATIENT'), async (req, res) => {
  try {
    const { patient_id, hospital_id, organ_type, recipient_blood_group, urgency_level, hla_type, medical_urgency_score } = req.body;

    if (!patient_id || !hospital_id || !organ_type || !recipient_blood_group) {
      return res.status(400).json({
        success: false,
        message: 'patient_id, hospital_id, organ_type, and recipient_blood_group are required.',
      });
    }

    const newId = db.dbStore.organRequests.length > 0 ? Math.max(...db.dbStore.organRequests.map((o) => o.organ_request_id)) + 1 : 1;
    const newRequest = {
      organ_request_id: newId,
      patient_id: parseInt(patient_id, 10),
      hospital_id: parseInt(hospital_id, 10),
      organ_type,
      recipient_blood_group,
      urgency_level: urgency_level || 'HIGH',
      request_date: new Date().toISOString().split('T')[0],
      request_status: 'WAITING',
      hla_type: hla_type || 'Standard Recipient Panel',
      medical_urgency_score: parseInt(medical_urgency_score || 75, 10),
    };

    db.dbStore.organRequests.push(newRequest);
    res.status(201).json({ success: true, organ_request_id: newId, request: newRequest, message: 'Organ request added to waiting list.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create organ request.' });
  }
});

// Get organ matches list
router.get('/matches', async (req, res) => {
  try {
    const matches = db.dbStore.organMatches.map((m) => {
      const donation = db.dbStore.organDonations.find((od) => od.organ_donation_id === m.organ_donation_id);
      const donor = donation ? db.dbStore.donors.find((d) => d.donor_id === donation.donor_id) : null;
      const donorPerson = donor ? db.dbStore.persons.find((p) => p.person_id === donor.person_id) : null;

      const request = db.dbStore.organRequests.find((or) => or.organ_request_id === m.organ_request_id);
      const patient = request ? db.dbStore.patients.find((pt) => pt.patient_id === request.patient_id) : null;
      const patientPerson = patient ? db.dbStore.persons.find((p) => p.person_id === patient.person_id) : null;
      const hospital = request ? db.dbStore.hospitals.find((h) => h.hospital_id === request.hospital_id) : null;

      const staff = m.verified_by_staff_id ? db.dbStore.staff.find((s) => s.staff_id === m.verified_by_staff_id) : null;
      const staffPerson = staff ? db.dbStore.persons.find((p) => p.person_id === staff.person_id) : null;

      return {
        ...m,
        organ_type: donation ? donation.organ_type : (request ? request.organ_type : 'N/A'),
        donor_name: donorPerson ? `${donorPerson.first_name} ${donorPerson.last_name}` : 'Unknown Donor',
        donor_blood_group: donor ? donor.blood_group : 'N/A',
        donor_hla: donation ? donation.hla_type : 'N/A',
        patient_name: patientPerson ? `${patientPerson.first_name} ${patientPerson.last_name}` : 'Unknown Patient',
        patient_blood_group: request ? request.recipient_blood_group : 'N/A',
        patient_hla: request ? request.hla_type : 'N/A',
        hospital_name: hospital ? hospital.hospital_name : 'Hospital',
        verified_by_name: staffPerson ? `Dr. ${staffPerson.first_name} ${staffPerson.last_name}` : null,
      };
    });

    res.json({
      success: true,
      count: matches.length,
      clinical_disclaimer: 'Illustrative matching algorithms for demonstration only; subject to authorized verification.',
      matches,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve organ matches.' });
  }
});

// Generate potential candidate matches
router.post('/matches/generate', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    let generatedCount = 0;
    const newMatches = [];

    // Find waiting requests and pledged donations of same organ type
    db.dbStore.organRequests.filter((r) => r.request_status === 'WAITING').forEach((reqItem) => {
      const candidates = db.dbStore.organDonations.filter(
        (od) => od.organ_type === reqItem.organ_type && od.donation_status === 'PLEDGED'
      );

      candidates.forEach((donorItem) => {
        // Check if match already exists
        const exists = db.dbStore.organMatches.some(
          (m) => m.organ_donation_id === donorItem.organ_donation_id && m.organ_request_id === reqItem.organ_request_id
        );

        if (!exists) {
          const donor = db.dbStore.donors.find((d) => d.donor_id === donorItem.donor_id);
          const isCompatible = donor ? db.dbStore.compatibility.some(
            (c) => c.donor_blood_group === donor.blood_group && c.recipient_blood_group === reqItem.recipient_blood_group && c.is_compatible
          ) : true;

          const baseScore = isCompatible ? 85.0 : 60.0;
          const randomVariation = +(Math.random() * 12).toFixed(2);
          const totalScore = Math.min(99.0, baseScore + randomVariation);

          const matchId = db.dbStore.organMatches.length > 0 ? Math.max(...db.dbStore.organMatches.map((m) => m.match_id)) + 1 : 1;
          const newMatch = {
            match_id: matchId,
            organ_donation_id: donorItem.organ_donation_id,
            organ_request_id: reqItem.organ_request_id,
            match_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
            compatibility_status: totalScore >= 90 ? 'HIGH_COMPATIBILITY' : 'POTENTIAL_MATCH',
            verification_status: 'PENDING_VERIFICATION',
            match_score: totalScore,
            medical_notes: `Candidate evaluated. ABO: ${isCompatible ? 'Compatible' : 'Requires Crossmatch'}. Awaiting Board review.`,
            verified_by_staff_id: null,
            verification_date: null,
          };

          db.dbStore.organMatches.push(newMatch);
          newMatches.push(newMatch);
          generatedCount++;
        }
      });
    });

    res.json({
      success: true,
      generatedCount,
      message: `Generated ${generatedCount} potential candidate pair(s) pending medical board verification.`,
      matches: newMatches,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate organ matches.' });
  }
});

// Update match verification status (Authorized Staff only)
router.put('/matches/:id/verify', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const matchId = parseInt(req.params.id, 10);
    const { verification_status, medical_notes } = req.body;

    const match = db.dbStore.organMatches.find((m) => m.match_id === matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Organ match record not found.' });
    }

    match.verification_status = verification_status || 'VERIFIED_BY_COMMITTEE';
    match.verified_by_staff_id = req.user.user_id || 3;
    match.verification_date = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (medical_notes) match.medical_notes = medical_notes;

    // If verified or transplant scheduled, update request status
    if (verification_status === 'TRANSPLANT_SCHEDULED') {
      const request = db.dbStore.organRequests.find((r) => r.organ_request_id === match.organ_request_id);
      if (request) request.request_status = 'MATCH_PROPOSED';
      const donation = db.dbStore.organDonations.find((d) => d.organ_donation_id === match.organ_donation_id);
      if (donation) donation.donation_status = 'ALLOCATED';
    }

    res.json({
      success: true,
      match,
      message: `Match #${matchId} status updated to '${match.verification_status}'.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update verification status.' });
  }
});

module.exports = router;

