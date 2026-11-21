/**
 * Donor Management Routes (Module 3 & Query 4)
 * Connected directly to MySQL 8.0 (InnoDB) with full CRUD, search, filter, pagination, and View support
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { handleMySQLError } = require('../utils/errorHandler');

// Get all donors with Person supertype attributes, donation counts, search, and pagination
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const {
      blood_group,
      donor_type,
      status,
      search,
      sortBy = 'registration_date',
      sortOrder = 'DESC',
      page = 1,
      limit = 25,
    } = req.query;

    const conditions = ['1=1'];
    const params = [];

    if (blood_group) {
      conditions.push('d.blood_group = ?');
      params.push(blood_group);
    }
    if (donor_type) {
      conditions.push('d.donor_type = ?');
      params.push(donor_type);
    }
    if (status) {
      conditions.push('d.availability_status = ?');
      params.push(status);
    }
    if (search && search.trim()) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ? OR p.city LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countSql = `
      SELECT COUNT(*) AS total
      FROM Donor d
      JOIN Person p ON d.person_id = p.person_id
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countSql, params);
    const total = Number(countResult[0]?.total) || 0;

    const allowedSortFields = {
      donor_id: 'd.donor_id',
      name: 'p.first_name',
      blood_group: 'd.blood_group',
      donor_type: 'd.donor_type',
      registration_date: 'd.registration_date',
      availability_status: 'd.availability_status',
    };
    const orderCol = allowedSortFields[sortBy] || 'd.registration_date';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? 1000 : Math.max(1, parseInt(limit, 10) || 25);
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT 
        d.donor_id,
        d.person_id,
        d.donor_type,
        d.blood_group,
        d.registration_date,
        d.availability_status,
        d.last_donation_date,
        d.deferral_reason,
        d.medical_history_notes,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
        p.first_name,
        p.last_name,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.city,
        p.state,
        p.pincode,
        COUNT(bd.donation_id) AS donation_count
      FROM Donor d
      JOIN Person p ON d.person_id = p.person_id
      LEFT JOIN BloodDonation bd ON d.donor_id = bd.donor_id
      WHERE ${whereClause}
      GROUP BY d.donor_id
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    const donors = await db.query(dataSql, [...params, limitNum, offset]);

    res.json({
      success: true,
      count: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
      donors,
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve donors from database.');
  }
});

// Query 4 Implementation: Public Donor Directory View (Data Masking)
const handlePublicDirectory = async (req, res) => {
  try {
    const { blood_group, city } = req.query;
    const conditions = ['1=1'];
    const params = [];

    if (blood_group) {
      conditions.push('blood_group = ?');
      params.push(blood_group);
    }
    if (city) {
      conditions.push('city = ?');
      params.push(city);
    }

    const sql = `
      SELECT * 
      FROM vw_public_donor_directory
      WHERE ${conditions.join(' AND ')}
      ORDER BY donor_id ASC
    `;

    const donors = await db.query(sql, params);

    res.json({
      success: true,
      count: donors.length,
      donors,
      view_applied: 'vw_public_donor_directory (Query 4 Masked Projection)',
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve public donor directory view.');
  }
};

router.get('/public-directory', handlePublicDirectory);
router.get('/query4-view', handlePublicDirectory);

// Get single donor with complete donation history
router.get('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  try {
    const donorId = parseInt(req.params.id, 10);

    const donorSql = `
      SELECT 
        d.*,
        CONCAT(p.first_name, ' ', p.last_name) AS name,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.city,
        p.state,
        p.pincode
      FROM Donor d
      JOIN Person p ON d.person_id = p.person_id
      WHERE d.donor_id = ?
    `;
    const donorRows = await db.query(donorSql, [donorId]);

    if (donorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }

    const donor = donorRows[0];

    // RBAC: DONOR can only view their own history
    if (req.user.role === 'DONOR') {
      const isOwner =
        (req.user.donor_id && Number(req.user.donor_id) === donorId) ||
        (req.user.person_id && Number(req.user.person_id) === Number(donor.person_id));
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Donors are only authorized to view their own profile and history.',
        });
      }
    }

    // Blood donations history
    const donationsSql = `
      SELECT 
        bd.*,
        h.hospital_name,
        COALESCE(c.camp_name, 'In-Hospital Phlebotomy') AS camp_name
      FROM BloodDonation bd
      JOIN Hospital h ON bd.hospital_id = h.hospital_id
      LEFT JOIN DonationCamp c ON bd.donation_camp_id = c.camp_id
      WHERE bd.donor_id = ?
      ORDER BY bd.donation_date DESC
    `;
    const donations = await db.query(donationsSql, [donorId]);

    // Organ donations
    const organDonationsSql = `
      SELECT * 
      FROM OrganDonation
      WHERE donor_id = ?
      ORDER BY registration_date DESC
    `;
    const organPledges = await db.query(organDonationsSql, [donorId]);

    res.json({
      success: true,
      donor: {
        ...donor,
        donations,
        organPledges,
      },
    });
  } catch (err) {
    handleMySQLError(err, res, 'Failed to retrieve donor details.');
  }
});

// Register new donor (ADMIN, STAFF, DONOR)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const {
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
      donor_type = 'BLOOD',
      availability_status = 'AVAILABLE',
      medical_history_notes,
      weight_kg,
    } = req.body;

    const fields = {};
    if (!first_name || !first_name.trim()) fields.first_name = 'First name is required.';
    if (!last_name || !last_name.trim()) fields.last_name = 'Last name is required.';
    if (!phone || !phone.trim()) fields.phone = 'Phone number is required.';
    if (!blood_group) fields.blood_group = 'Blood group is required.';

    // Server-side eligibility checks: Age >= 18
    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        fields.date_of_birth = `Donor must be at least 18 years of age (Current age: ${age}).`;
      }
    }

    // Weight check (if provided, must be >= 45 kg)
    if (weight_kg && Number(weight_kg) < 45) {
      fields.weight_kg = 'Minimum weight of 45 kg is required for clinical donor eligibility.';
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Donor eligibility requirements not met.',
        fields,
      });
    }

    await conn.query('START TRANSACTION');

    // 1. Check or insert Person
    let personId = req.user.role === 'DONOR' ? req.user.person_id : null;

    if (!personId) {
      const [existingPerson] = await conn.query('SELECT person_id FROM Person WHERE phone = ?', [phone.trim()]);
      if (existingPerson.length > 0) {
        personId = existingPerson[0].person_id;
      }
    }

    if (personId) {
      // Check if already registered as a donor
      const [existingDonor] = await conn.query('SELECT donor_id FROM Donor WHERE person_id = ?', [personId]);
      if (existingDonor.length > 0) {
        await conn.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `This person is already registered as a donor (Donor #${existingDonor[0].donor_id}).`,
          fields: { phone: 'Donor profile already exists for this person.' },
        });
      }
    } else {
      const personInsertSql = `
        INSERT INTO Person 
        (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [personResult] = await conn.query(personInsertSql, [
        first_name.trim(),
        last_name.trim(),
        date_of_birth || '1995-05-15',
        gender,
        phone.trim(),
        email?.trim() || `donor_${Date.now()}@lifelink.network`,
        address?.trim() || 'City Center',
        city?.trim() || 'Delhi',
        state?.trim() || 'Delhi',
        pincode?.trim() || '110001',
        blood_group,
        'Self',
        phone.trim(),
      ]);
      personId = personResult.insertId;
    }

    // 2. Insert Donor
    const donorInsertSql = `
      INSERT INTO Donor 
      (person_id, donor_type, blood_group, registration_date, availability_status, medical_history_notes)
      VALUES (?, ?, ?, CURDATE(), ?, ?)
    `;
    const [donorResult] = await conn.query(donorInsertSql, [
      personId,
      donor_type,
      blood_group,
      availability_status,
      medical_history_notes || 'Voluntary donor registration.',
    ]);

    await conn.query('COMMIT');

    const createdDonor = {
      donor_id: donorResult.insertId,
      person_id: personId,
      name: `${first_name.trim()} ${last_name.trim()}`,
      blood_group,
      donor_type,
      availability_status,
    };

    res.status(201).json({
      success: true,
      donor_id: donorResult.insertId,
      donor: createdDonor,
      message: `Donor registered successfully (Donor ID: ${donorResult.insertId}).`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to register donor.');
  } finally {
    conn.release();
  }
});

// Update donor availability, medical notes, or contact info (ADMIN, STAFF, DONOR)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF', 'DONOR'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection pool unavailable.' });
  }

  try {
    const donorId = parseInt(req.params.id, 10);
    const { donor_type, availability_status, deferral_reason, medical_history_notes, phone, email, city } = req.body;

    const [dRows] = await conn.query('SELECT * FROM Donor WHERE donor_id = ?', [donorId]);
    if (dRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }
    const currentDonor = dRows[0];

    // RBAC: DONOR can only update their own record
    if (req.user.role === 'DONOR') {
      const isOwner =
        (req.user.donor_id && Number(req.user.donor_id) === donorId) ||
        (req.user.person_id && Number(req.user.person_id) === Number(currentDonor.person_id));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own donor profile.' });
      }
    }

    await conn.query('START TRANSACTION');

    const updateDonorSql = `
      UPDATE Donor 
      SET 
        donor_type = COALESCE(?, donor_type),
        availability_status = COALESCE(?, availability_status),
        deferral_reason = ?,
        medical_history_notes = COALESCE(?, medical_history_notes)
      WHERE donor_id = ?
    `;

    await conn.query(updateDonorSql, [
      donor_type || null,
      availability_status || null,
      deferral_reason !== undefined ? deferral_reason : currentDonor.deferral_reason,
      medical_history_notes || null,
      donorId,
    ]);

    if (phone || email || city) {
      const updatePersonSql = `
        UPDATE Person 
        SET 
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          city = COALESCE(?, city)
        WHERE person_id = ?
      `;
      await conn.query(updatePersonSql, [phone || null, email || null, city || null, currentDonor.person_id]);
    }

    await conn.query('COMMIT');

    res.json({
      success: true,
      message: `Donor #${donorId} profile updated successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    handleMySQLError(err, res, 'Failed to update donor profile.');
  } finally {
    conn.release();
  }
});

module.exports = router;
