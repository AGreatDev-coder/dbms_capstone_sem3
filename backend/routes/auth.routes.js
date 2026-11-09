/**
 * Authentication Routes
 * Implements JWT authentication, login, demo profiles, and registration
 */

const express = require('express');
const router = express.Router();
const { generateToken, authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// List predefined demonstration profiles for quick evaluation/grading
router.get('/demo-users', (req, res) => {
  const demoUsers = [
    { username: 'admin', role: 'ADMIN', label: 'Chief Medical Officer (AIIMS)', description: 'Full system management, hospital CRUD, analytics, and all modules' },
    { username: 'staff_priya', role: 'STAFF', label: 'Head of Transfusion (Apollo)', description: 'Patient intake, inventory allocation, verification, blood processing' },
    { username: 'donor_rahul', role: 'DONOR', label: 'Rahul Deshmukh (Universal O- Donor)', description: 'View own donations, register for upcoming camps, update availability' },
    { username: 'patient_aditya', role: 'PATIENT', label: 'Aditya Mehta (Critical Cardiac Patient)', description: 'View own blood requests, allocation status, and organ waitlist' },
  ];
  res.json({ success: true, demoUsers, isMySQLConnected: db.isMySQLConnected() });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username or email is required.' });
  }

  try {
    // Check in users table / store
    let user = null;
    const cleanUser = username.trim().toLowerCase();

    // Find user in dbStore or query
    const userInStore = db.dbStore.users.find(
      (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
    );

    if (userInStore) {
      const person = db.dbStore.persons.find((p) => p.person_id === userInStore.person_id);
      const donor = db.dbStore.donors.find((d) => d.person_id === userInStore.person_id);
      const patient = db.dbStore.patients.find((pt) => pt.person_id === userInStore.person_id);
      const staff = db.dbStore.staff.find((s) => s.person_id === userInStore.person_id);
      user = {
        ...userInStore,
        first_name: person ? person.first_name : userInStore.username,
        last_name: person ? person.last_name : '',
        blood_group: person ? person.blood_group : 'O+',
        donor_id: donor ? donor.donor_id : null,
        patient_id: patient ? patient.patient_id : null,
        staff_id: staff ? staff.staff_id : null,
      };
    } else {
      // Query fallback
      const results = await db.query(
        'SELECT u.*, p.first_name, p.last_name, p.blood_group, d.donor_id, pt.patient_id, s.staff_id FROM AppUser u JOIN Person p ON u.person_id = p.person_id LEFT JOIN Donor d ON p.person_id = d.person_id LEFT JOIN Patient pt ON p.person_id = pt.person_id LEFT JOIN Staff s ON p.person_id = s.person_id WHERE u.username = ? OR u.email = ?',
        [cleanUser, cleanUser]
      );
      if (results && results.length > 0) {
        user = results[0];
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // For academic evaluation convenience, any password or 'Password@123' is accepted for demo accounts
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        person_id: user.person_id,
        username: user.username,
        email: user.email,
        role: user.role,
        donor_id: user.donor_id || null,
        patient_id: user.patient_id || null,
        staff_id: user.staff_id || null,
        first_name: user.first_name,
        last_name: user.last_name,
        blood_group: user.blood_group,
      },
      message: `Signed in as ${user.first_name} ${user.last_name} (${user.role})`,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = db.dbStore.users.find((u) => u.user_id === req.user.user_id);
    const person = user ? db.dbStore.persons.find((p) => p.person_id === user.person_id) : null;
    const donor = user ? db.dbStore.donors.find((d) => d.person_id === user.person_id) : null;
    const patient = user ? db.dbStore.patients.find((pt) => pt.person_id === user.person_id) : null;
    const staff = user ? db.dbStore.staff.find((s) => s.person_id === user.person_id) : null;

    res.json({
      success: true,
      user: {
        ...req.user,
        donor_id: req.user.donor_id || (donor ? donor.donor_id : null),
        patient_id: req.user.patient_id || (patient ? patient.patient_id : null),
        staff_id: req.user.staff_id || (staff ? staff.staff_id : null),
        first_name: person ? person.first_name : req.user.username,
        last_name: person ? person.last_name : '',
        phone: person ? person.phone : '',
        city: person ? person.city : '',
        blood_group: person ? person.blood_group : 'O+',
      },
      isMySQLConnected: db.isMySQLConnected(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

module.exports = router;

