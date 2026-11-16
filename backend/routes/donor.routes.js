/**
 * Donor Management Routes (Module 3 & Query 4)
 * Connected directly to MySQL 8.0 (InnoDB) with full CRUD, search, filter, pagination, and View support
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

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
    const total = countResult[0]?.total || 0;

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
    console.error('Donor retrieve error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donors from database.' });
  }
});

// Query 4 Implementation: Public Donor Directory View (Data Masking)
// Reads directly from MySQL View: vw_public_donor_directory
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
      LIMIT 100
    `;
    const directory = await db.query(sql, params);

    res.json({
      success: true,
      count: directory.length,
      view_name: 'vw_public_donor_directory',
      directory,
      donors: directory,
    });
  } catch (err) {
    console.error('Public directory error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donor directory from database view.' });
  }
};

router.get('/directory', handlePublicDirectory);
router.get('/public-directory', handlePublicDirectory);

// Get single donor with full history
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

    // Donations history
    const donationsSql = `
      SELECT bd.*, h.hospital_name, c.camp_name
      FROM BloodDonation bd
      LEFT JOIN Hospital h ON bd.hospital_id = h.hospital_id
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
    const organDonations = await db.query(organDonationsSql, [donorId]);

    res.json({
      success: true,
      donor: {
        ...donor,
        donations,
        organDonations,
      },
    });
  } catch (err) {
    console.error('Donor detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donor details.' });
  }
});

// Register new donor
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

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
      donor_type = 'BLOOD',
      availability_status = 'AVAILABLE',
      medical_history_notes,
    } = req.body;

    if (!first_name || !last_name || !phone || !blood_group) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, phone, and blood group are required.',
      });
    }

    await conn.query('START TRANSACTION');

    // 1. Check or insert Person
    const [existingPerson] = await conn.query('SELECT person_id FROM Person WHERE phone = ?', [phone]);
    let personId;

    if (existingPerson.length > 0) {
      personId = existingPerson[0].person_id;
      // Check if already registered as donor
      const [existingDonor] = await conn.query('SELECT donor_id FROM Donor WHERE person_id = ?', [personId]);
      if (existingDonor.length > 0) {
        await conn.query('ROLLBACK');
        return res.status(409).json({ success: false, message: 'This person is already registered as a donor.' });
      }
    } else {
      const personInsertSql = `
        INSERT INTO Person 
        (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [personResult] = await conn.query(personInsertSql, [
        first_name,
        last_name,
        date_of_birth || '1995-05-15',
        gender || 'OTHER',
        phone,
        email || `donor_${Date.now()}@lifelink.network`,
        address || 'City Center',
        city || 'Delhi',
        state || 'Delhi',
        pincode || '110001',
        blood_group,
        'Self',
        phone,
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

    res.status(201).json({
      success: true,
      donor_id: donorResult.insertId,
      message: `Donor registered successfully (Donor ID: ${donorResult.insertId}).`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Donor register error:', err);
    res.status(500).json({ success: false, message: `Failed to register donor: ${err.message}` });
  } finally {
    conn.release();
  }
});

// Update donor availability, medical notes, or contact info
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    const donorId = parseInt(req.params.id, 10);
    const { donor_type, availability_status, deferral_reason, medical_history_notes, phone, email, city } = req.body;

    const [dRows] = await conn.query('SELECT * FROM Donor WHERE donor_id = ?', [donorId]);
    if (dRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }
    const currentDonor = dRows[0];

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
      message: `Donor ${donorId} updated successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Donor update error:', err);
    res.status(500).json({ success: false, message: `Failed to update donor: ${err.message}` });
  } finally {
    conn.release();
  }
});

// Delete donor with referential integrity check
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const conn = await db.getConnection();
  if (!conn) {
    return res.status(500).json({ success: false, message: 'Database connection unavailable.' });
  }

  try {
    const donorId = parseInt(req.params.id, 10);

    const [donations] = await conn.query('SELECT COUNT(*) AS c FROM BloodDonation WHERE donor_id = ?', [donorId]);
    const [units] = await conn.query('SELECT COUNT(*) AS c FROM BloodUnit WHERE donor_id = ?', [donorId]);
    const [organs] = await conn.query('SELECT COUNT(*) AS c FROM OrganDonation WHERE donor_id = ?', [donorId]);

    if (donations[0].c > 0 || units[0].c > 0 || organs[0].c > 0) {
      return res.status(409).json({
        success: false,
        message: `Referential Integrity: Donor cannot be deleted because ${donations[0].c} blood donation(s), ${units[0].c} blood unit(s), or ${organs[0].c} organ donation(s) reference this record.`,
      });
    }

    const [dRows] = await conn.query('SELECT person_id FROM Donor WHERE donor_id = ?', [donorId]);
    if (dRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }
    const personId = dRows[0].person_id;

    await conn.query('START TRANSACTION');
    await conn.query('DELETE FROM Donor WHERE donor_id = ?', [donorId]);

    const [patientCheck] = await conn.query('SELECT COUNT(*) AS c FROM Patient WHERE person_id = ?', [personId]);
    const [staffCheck] = await conn.query('SELECT COUNT(*) AS c FROM Staff WHERE person_id = ?', [personId]);

    if (patientCheck[0].c === 0 && staffCheck[0].c === 0) {
      await conn.query('DELETE FROM Person WHERE person_id = ?', [personId]);
    }

    await conn.query('COMMIT');

    res.json({
      success: true,
      message: `Donor ${donorId} deleted successfully.`,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Donor delete error:', err);
    res.status(500).json({ success: false, message: `Failed to delete donor: ${err.message}` });
  } finally {
    conn.release();
  }
});

module.exports = router;
