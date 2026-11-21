/**
 * Donation Camp Routes (Module 8 & Section 4 Aggregation)
 * Connected directly to MySQL 8.0 (InnoDB) with Aggregation demonstration.
 * Supports:
 * - DONOR self-registration for upcoming camps ("donor apni details bharega")
 * - STAFF/ADMIN/DEVELOPER registering existing users/persons into camps
 * - STAFF/ADMIN/DEVELOPER registering new walk-in participants ("naya banda") into camps
 * - STAFF/ADMIN/DEVELOPER recording attendance and units donated at camps
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleMySQLError } = require('../utils/errorHandler');

// Get all donation camps with aggregated metrics and user registration state
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, hospital_id } = req.query;
    const conditions = ['1=1'];
    const params = [];

    // RBAC: ADMIN and STAFF can only view camps associated with their hospital (unless DEVELOPER)
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      conditions.push('c.hospital_id = ?');
      params.push(req.user.hospital_id);
    } else if (hospital_id) {
      conditions.push('c.hospital_id = ?');
      params.push(parseInt(hospital_id, 10));
    }

    if (status) {
      conditions.push('c.camp_status = ?');
      params.push(status);
    }

    // Determine user donor ID if logged in as DONOR or user has donor row
    let userDonorId = null;
    if (req.user && req.user.person_id) {
      const donorRows = await db.query('SELECT donor_id FROM Donor WHERE person_id = ?', [req.user.person_id]);
      if (donorRows.length > 0) {
        userDonorId = donorRows[0].donor_id;
      }
    }

    const sql = `
      SELECT 
        c.camp_id,
        c.camp_name,
        c.organizer,
        c.hospital_id,
        c.location,
        c.city,
        c.start_date,
        c.end_date,
        c.capacity,
        c.camp_status,
        c.contact_phone,
        h.hospital_name,
        COUNT(DISTINCT cdr.registration_id) AS registered_donors_count,
        COUNT(DISTINCT CASE WHEN cdr.attended = TRUE THEN cdr.registration_id END) AS attended_donors_count,
        COALESCE(SUM(cdr.units_donated), 0) AS total_donations_collected,
        ${userDonorId ? `MAX(CASE WHEN cdr.donor_id = ${parseInt(userDonorId, 10)} THEN 1 ELSE 0 END)` : '0'} AS is_user_registered
      FROM DonationCamp c
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      LEFT JOIN CampDonorRegistration cdr ON c.camp_id = cdr.camp_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.camp_id
      ORDER BY c.start_date DESC
    `;

    const camps = await db.query(sql, params);

    res.json({
      success: true,
      count: camps.length,
      camps,
      user_donor_id: userDonorId,
      aggregation_concept: 'DonationCamp acts as an aggregation root binding hospital organizer, registered donors, and resulting donations.',
    });
  } catch (err) {
    console.error('Donation camps error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donation camps.' });
  }
});

// Get camps registered by the currently logged-in user
router.get('/my-registrations', authenticateToken, async (req, res) => {
  try {
    const personId = req.user?.person_id;
    if (!personId) {
      return res.status(400).json({ success: false, message: 'No authenticated user identity found.' });
    }

    const sql = `
      SELECT 
        cdr.registration_id,
        cdr.camp_id,
        cdr.registration_time,
        cdr.attended,
        cdr.units_donated,
        c.camp_name,
        c.organizer,
        c.location,
        c.city,
        c.start_date,
        c.end_date,
        c.camp_status,
        c.contact_phone,
        h.hospital_name
      FROM CampDonorRegistration cdr
      JOIN DonationCamp c ON cdr.camp_id = c.camp_id
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      JOIN Donor d ON cdr.donor_id = d.donor_id
      WHERE d.person_id = ?
      ORDER BY c.start_date DESC
    `;

    const registrations = await db.query(sql, [personId]);

    res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (err) {
    console.error('My camp registrations error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve your camp registrations.' });
  }
});

// Search existing Person or Donor records to enroll in a camp (for Staff / Admin modal)
router.get('/eligible-persons', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query;
    const queryTerm = q.trim();

    let sql = `
      SELECT 
        p.person_id,
        p.first_name,
        p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
        p.phone,
        p.email,
        p.date_of_birth,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
        p.gender,
        p.blood_group,
        p.city,
        d.donor_id,
        d.availability_status,
        CASE WHEN d.donor_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_already_donor
      FROM Person p
      LEFT JOIN Donor d ON p.person_id = d.person_id
    `;
    const params = [];

    if (queryTerm) {
      sql += ` WHERE (p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)`;
      const pattern = `%${queryTerm}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    sql += ` ORDER BY p.person_id DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 20);

    const persons = await db.query(sql, params);

    res.json({
      success: true,
      count: persons.length,
      persons,
    });
  } catch (err) {
    console.error('Camp eligible persons error:', err);
    res.status(500).json({ success: false, message: 'Failed to search eligible persons for camp.' });
  }
});

// Camp Aggregate Statistics (for Camp Stats tab - Query 7)
router.get('/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.camp_id,
        c.camp_name,
        c.location,
        c.capacity,
        c.camp_status,
        h.hospital_name,
        COUNT(DISTINCT cdr.registration_id) AS total_registrations,
        COUNT(DISTINCT CASE WHEN cdr.attended = TRUE THEN cdr.registration_id END) AS attended_count,
        COALESCE(SUM(cdr.units_donated), 0) AS total_donations_collected,
        COALESCE(SUM(cdr.units_donated * 450), 0) AS total_blood_collected_ml,
        COALESCE(ROUND(AVG(bd.hemoglobin_level), 1), 13.5) AS average_donor_hemoglobin,
        COALESCE(MIN(bd.quantity_ml), 350) AS min_donation_ml,
        COALESCE(MAX(bd.quantity_ml), 450) AS max_donation_ml,
        ROUND((COUNT(DISTINCT CASE WHEN cdr.attended = TRUE THEN cdr.registration_id END) / NULLIF(COUNT(DISTINCT cdr.registration_id), 0)) * 100, 1) AS attendance_rate_pct
      FROM DonationCamp c
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      LEFT JOIN CampDonorRegistration cdr ON c.camp_id = cdr.camp_id
      LEFT JOIN BloodDonation bd ON c.camp_id = bd.donation_camp_id
      GROUP BY c.camp_id, h.hospital_name
      HAVING COUNT(cdr.registration_id) >= 2 OR total_donations_collected >= 1
      ORDER BY c.start_date DESC
    `;
    const stats = await db.query(sql);

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Camp stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve camp statistics.' });
  }
});

// Get single camp with participants list
const getCampDetailHandler = async (req, res) => {
  try {
    const campId = parseInt(req.params.id, 10);
    if (isNaN(campId)) {
      return res.status(400).json({ success: false, message: 'Invalid camp ID.' });
    }

    const campSql = `
      SELECT c.*, h.hospital_name
      FROM DonationCamp c
      JOIN Hospital h ON c.hospital_id = h.hospital_id
      WHERE c.camp_id = ?
    `;
    const campRows = await db.query(campSql, [campId]);
    if (campRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Camp not found.' });
    }

    const camp = campRows[0];

    const regSql = `
      SELECT 
        cdr.registration_id,
        cdr.camp_id,
        cdr.donor_id,
        cdr.registration_time,
        cdr.attended,
        cdr.units_donated,
        CONCAT(p.first_name, ' ', p.last_name) AS donor_name,
        d.blood_group,
        p.phone,
        p.email,
        p.city
      FROM CampDonorRegistration cdr
      JOIN Donor d ON cdr.donor_id = d.donor_id
      JOIN Person p ON d.person_id = p.person_id
      WHERE cdr.camp_id = ?
      ORDER BY cdr.registration_time DESC
    `;
    const registrations = await db.query(regSql, [campId]);

    res.json({
      success: true,
      camp: {
        ...camp,
        registrations,
      },
      donors: registrations,
    });
  } catch (err) {
    console.error('Camp detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve camp details.' });
  }
};

router.get('/:id', getCampDetailHandler);
router.get('/:id/donors', getCampDetailHandler);

// Helper to safely format datetime-local strings (YYYY-MM-DDTHH:mm) to MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
const parseDateTime = (dtStr) => {
  if (!dtStr) return null;
  let s = String(dtStr).replace('T', ' ').trim();
  if (s.length === 16) s += ':00';
  return s;
};

// Create new donation camp (ADMIN, STAFF, DEVELOPER)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const {
      camp_name,
      organizer,
      hospital_id,
      location,
      city,
      start_date,
      end_date,
      capacity = 100,
      contact_phone,
    } = req.body;

    let finalHospitalId = hospital_id || req.user?.hospital_id || 1;
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF') && req.user.hospital_id) {
      finalHospitalId = req.user.hospital_id;
    }

    if (!camp_name || !camp_name.trim()) {
      return res.status(400).json({ success: false, message: 'Camp title is required.' });
    }
    if (!organizer || !organizer.trim()) {
      return res.status(400).json({ success: false, message: 'Organizer organization name is required.' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Camp venue location is required.' });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    const formattedStart = parseDateTime(start_date);
    const formattedEnd = parseDateTime(end_date);

    if (new Date(formattedEnd).getTime() < new Date(formattedStart).getTime()) {
      return res.status(400).json({ success: false, message: 'End date and time must be after the start date.' });
    }

    const targetCapacity = Math.max(1, parseInt(capacity, 10) || 100);

    const sql = `
      INSERT INTO DonationCamp 
      (camp_name, organizer, hospital_id, location, city, start_date, end_date, capacity, camp_status, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
    `;
    const result = await db.query(sql, [
      camp_name.trim(),
      organizer.trim(),
      parseInt(finalHospitalId, 10),
      location.trim(),
      city?.trim() || 'New Delhi',
      formattedStart,
      formattedEnd,
      targetCapacity,
      contact_phone?.trim() || '+91-11-26588500',
    ]);

    res.status(201).json({
      success: true,
      camp_id: result.insertId,
      message: `Donation Camp "${camp_name.trim()}" scheduled successfully (Camp ID: ${result.insertId}).`,
    });
  } catch (err) {
    console.error('Create camp error:', err);
    res.status(500).json({ success: false, message: `Failed to schedule camp: ${err.message}` });
  }
});

// Register participant for camp
// Supports:
// 1. DONOR self-registration ("donor apni details bharega")
// 2. STAFF/ADMIN registering an existing person/donor
// 3. STAFF/ADMIN registering a new person ("naya banda" - walk-in)
router.post('/:id/register', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const campId = parseInt(req.params.id, 10);
    if (isNaN(campId)) {
      return res.status(400).json({ success: false, message: 'Invalid camp identifier.' });
    }

    // Verify camp exists
    const [cRows] = await conn.query('SELECT * FROM DonationCamp WHERE camp_id = ?', [campId]);
    if (cRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation camp not found.' });
    }
    const camp = cRows[0];

    const isDonorUser = req.user?.role === 'DONOR';
    const {
      donor_id,
      person_id,
      first_name,
      last_name,
      date_of_birth,
      gender = 'OTHER',
      phone,
      email,
      address = 'City Center',
      city = 'New Delhi',
      state = 'Delhi',
      pincode = '110001',
      blood_group,
      weight_kg,
      medical_history_notes,
    } = req.body;

    let targetDonorId = null;

    // -------------------------------------------------------------------------
    // FLOW 1: Logged-in DONOR Self-Registration ("donor apni details bharega")
    // -------------------------------------------------------------------------
    if (isDonorUser) {
      const personId = req.user.person_id;
      if (!personId) {
        return res.status(400).json({ success: false, message: 'Authenticated user has no person profile.' });
      }

      await conn.query('START TRANSACTION');

      // Check if user already has a Donor profile
      const [existingDonorRows] = await conn.query('SELECT donor_id, blood_group FROM Donor WHERE person_id = ?', [personId]);
      if (existingDonorRows.length > 0) {
        targetDonorId = existingDonorRows[0].donor_id;
      } else {
        // Create Donor profile for this user if not yet initialized
        const finalBloodGroup = blood_group || 'O+';
        const [dInsert] = await conn.query(
          `INSERT INTO Donor (person_id, donor_type, blood_group, registration_date, availability_status, medical_history_notes)
           VALUES (?, 'BLOOD', ?, CURDATE(), 'AVAILABLE', ?)`,
          [personId, finalBloodGroup, medical_history_notes || 'Registered during camp drive participation.']
        );
        targetDonorId = dInsert.insertId;

        // Update Person blood group and phone if provided
        if (blood_group || phone) {
          await conn.query(
            'UPDATE Person SET blood_group = COALESCE(?, blood_group), phone = COALESCE(?, phone) WHERE person_id = ?',
            [blood_group || null, phone || null, personId]
          );
        }
      }

      // Check if already registered for this camp
      const [dupCheck] = await conn.query(
        'SELECT registration_id FROM CampDonorRegistration WHERE camp_id = ? AND donor_id = ?',
        [campId, targetDonorId]
      );
      if (dupCheck.length > 0) {
        await conn.query('ROLLBACK');
        return res.status(409).json({ success: false, message: 'You are already registered for this donation camp.' });
      }

      // Insert junction record
      const [regResult] = await conn.query(
        `INSERT INTO CampDonorRegistration (camp_id, donor_id, registration_time, attended, units_donated)
         VALUES (?, ?, NOW(), FALSE, 0)`,
        [campId, targetDonorId]
      );

      await conn.query('COMMIT');

      return res.status(201).json({
        success: true,
        registration_id: regResult.insertId,
        donor_id: targetDonorId,
        message: `Successfully registered for "${camp.camp_name}"! We look forward to your voluntary contribution.`,
      });
    }

    // -------------------------------------------------------------------------
    // FLOW 2: STAFF/ADMIN Registering an EXISTING Person or Existing Donor
    // -------------------------------------------------------------------------
    if (donor_id) {
      targetDonorId = parseInt(donor_id, 10);
      const [dCheck] = await conn.query('SELECT donor_id FROM Donor WHERE donor_id = ?', [targetDonorId]);
      if (dCheck.length === 0) {
        return res.status(404).json({ success: false, message: `Donor #${targetDonorId} not found in database.` });
      }
    } else if (person_id) {
      const targetPersonId = parseInt(person_id, 10);
      const [pCheck] = await conn.query('SELECT * FROM Person WHERE person_id = ?', [targetPersonId]);
      if (pCheck.length === 0) {
        return res.status(404).json({ success: false, message: `Person #${targetPersonId} not found in database.` });
      }
      const p = pCheck[0];

      await conn.query('START TRANSACTION');

      // Check if person already has a donor row
      const [existingDonor] = await conn.query('SELECT donor_id FROM Donor WHERE person_id = ?', [targetPersonId]);
      if (existingDonor.length > 0) {
        targetDonorId = existingDonor[0].donor_id;
      } else {
        // Auto-enroll person as a Donor
        const finalBloodGroup = blood_group || p.blood_group || 'O+';
        const [dInsert] = await conn.query(
          `INSERT INTO Donor (person_id, donor_type, blood_group, registration_date, availability_status, medical_history_notes)
           VALUES (?, 'BLOOD', ?, CURDATE(), 'AVAILABLE', ?)`,
          [targetPersonId, finalBloodGroup, medical_history_notes || 'Enrolled as voluntary donor at camp drive.']
        );
        targetDonorId = dInsert.insertId;
      }
    }

    if (targetDonorId) {
      // Check duplicate registration
      const [dupCheck] = await conn.query(
        'SELECT registration_id FROM CampDonorRegistration WHERE camp_id = ? AND donor_id = ?',
        [campId, targetDonorId]
      );
      if (dupCheck.length > 0) {
        if (person_id) await conn.query('ROLLBACK');
        return res.status(409).json({ success: false, message: 'This donor is already registered for this camp drive.' });
      }

      const [regResult] = await conn.query(
        `INSERT INTO CampDonorRegistration (camp_id, donor_id, registration_time, attended, units_donated)
         VALUES (?, ?, NOW(), FALSE, 0)`,
        [campId, targetDonorId]
      );

      if (person_id) await conn.query('COMMIT');

      return res.status(201).json({
        success: true,
        registration_id: regResult.insertId,
        donor_id: targetDonorId,
        message: `Donor #${targetDonorId} enrolled in camp "${camp.camp_name}" successfully.`,
      });
    }

    // -------------------------------------------------------------------------
    // FLOW 3: STAFF/ADMIN Registering a NEW PERSON ("Naya Banda" - Walk-in)
    // -------------------------------------------------------------------------
    const fields = {};
    if (!first_name || !first_name.trim()) fields.first_name = 'First name is required.';
    if (!last_name || !last_name.trim()) fields.last_name = 'Last name is required.';
    if (!phone || !phone.trim()) fields.phone = 'Phone number is required.';
    if (!blood_group) fields.blood_group = 'Blood group is required.';

    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        fields.date_of_birth = `Donor must be at least 18 years of age (Current age: ${age}).`;
      }
    }

    if (weight_kg && Number(weight_kg) < 45) {
      fields.weight_kg = 'Minimum clinical weight of 45 kg is required for blood donation.';
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({ success: false, message: 'Registration requirements not met.', fields });
    }

    await conn.query('START TRANSACTION');

    let personId = null;
    const [pCheck] = await conn.query('SELECT person_id FROM Person WHERE phone = ?', [phone.trim()]);
    if (pCheck.length > 0) {
      personId = pCheck[0].person_id;
    } else {
      const pInsertSql = `
        INSERT INTO Person 
        (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [pRes] = await conn.query(pInsertSql, [
        first_name.trim(),
        last_name.trim(),
        date_of_birth || '1998-05-15',
        gender,
        phone.trim(),
        email?.trim() || `walkin_${Date.now()}@lifelink.network`,
        address?.trim() || 'Camp Venue',
        city?.trim() || camp.city || 'New Delhi',
        state?.trim() || 'Delhi',
        pincode?.trim() || '110001',
        blood_group,
        'Self',
        phone.trim(),
      ]);
      personId = pRes.insertId;
    }

    // Check or insert Donor
    const [dRows] = await conn.query('SELECT donor_id FROM Donor WHERE person_id = ?', [personId]);
    if (dRows.length > 0) {
      targetDonorId = dRows[0].donor_id;
    } else {
      const [dRes] = await conn.query(
        `INSERT INTO Donor (person_id, donor_type, blood_group, registration_date, availability_status, medical_history_notes)
         VALUES (?, 'BLOOD', ?, CURDATE(), 'AVAILABLE', ?)`,
        [personId, blood_group, medical_history_notes || 'Walk-in voluntary donor registered at camp.']
      );
      targetDonorId = dRes.insertId;
    }

    // Check duplicate in camp
    const [dupCheck] = await conn.query(
      'SELECT registration_id FROM CampDonorRegistration WHERE camp_id = ? AND donor_id = ?',
      [campId, targetDonorId]
    );
    if (dupCheck.length > 0) {
      await conn.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This individual is already registered for this camp drive.' });
    }

    // Insert Camp registration
    const [regResult] = await conn.query(
      `INSERT INTO CampDonorRegistration (camp_id, donor_id, registration_time, attended, units_donated)
       VALUES (?, ?, NOW(), FALSE, 0)`,
      [campId, targetDonorId]
    );

    await conn.query('COMMIT');

    res.status(201).json({
      success: true,
      registration_id: regResult.insertId,
      donor_id: targetDonorId,
      message: `Walk-in participant "${first_name} ${last_name}" registered & enrolled in camp successfully!`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to register participant for camp.');
  } finally {
    conn.release();
  }
});

// Update participant attendance and units donated at camp (ADMIN, STAFF, DEVELOPER)
router.put('/:id/registrations/:regId', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const campId = parseInt(req.params.id, 10);
    const regId = parseInt(req.params.regId, 10);
    const { attended, units_donated } = req.body;

    const [regRows] = await conn.query(
      `SELECT cdr.*, c.hospital_id, d.blood_group, d.donor_id
       FROM CampDonorRegistration cdr
       JOIN DonationCamp c ON cdr.camp_id = c.camp_id
       JOIN Donor d ON cdr.donor_id = d.donor_id
       WHERE cdr.registration_id = ? AND cdr.camp_id = ?`,
      [regId, campId]
    );

    if (regRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Camp registration record not found.' });
    }

    const reg = regRows[0];
    const newAttended = attended !== undefined ? Boolean(attended) : reg.attended;
    const newUnits = units_donated !== undefined ? Math.max(0, parseInt(units_donated, 10) || 0) : reg.units_donated;

    await conn.query('START TRANSACTION');

    // Update CampDonorRegistration
    await conn.query(
      'UPDATE CampDonorRegistration SET attended = ?, units_donated = ? WHERE registration_id = ?',
      [newAttended, newUnits, regId]
    );

    // If marked attended with donated units, record/update BloodDonation
    if (newAttended && newUnits > 0) {
      const [existingDonation] = await conn.query(
        'SELECT donation_id FROM BloodDonation WHERE donor_id = ? AND donation_camp_id = ?',
        [reg.donor_id, campId]
      );

      const staffId = req.user.staff_id || null;
      const quantityMl = Math.min(500, Math.max(350, newUnits * 450));

      if (existingDonation.length === 0) {
        await conn.query(
          `INSERT INTO BloodDonation 
           (donor_id, donation_camp_id, hospital_id, recorded_by_staff_id, donation_date, quantity_ml, hemoglobin_level, screening_status)
           VALUES (?, ?, ?, ?, CURDATE(), ?, 13.5, 'PASSED')`,
          [reg.donor_id, campId, reg.hospital_id, staffId, quantityMl]
        );
      } else {
        await conn.query(
          'UPDATE BloodDonation SET quantity_ml = ? WHERE donation_id = ?',
          [quantityMl, existingDonation[0].donation_id]
        );
      }

      // Update Donor last donation date
      await conn.query('UPDATE Donor SET last_donation_date = CURDATE() WHERE donor_id = ?', [reg.donor_id]);
    }

    await conn.query('COMMIT');

    res.json({
      success: true,
      message: `Updated participant attendance: ${newAttended ? 'Attended' : 'Registered'}, ${newUnits} unit(s) collected.`,
      attended: newAttended,
      units_donated: newUnits,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to update participant attendance.');
  } finally {
    conn.release();
  }
});

module.exports = router;
