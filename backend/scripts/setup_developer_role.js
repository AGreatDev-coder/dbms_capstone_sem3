const { pool, dbStore } = require('../config/db');

async function setupDeveloper() {
  const conn = await pool.getConnection();
  try {
    console.log('1. Altering AppUser role ENUM to include DEVELOPER...');
    await conn.query(`
      ALTER TABLE AppUser 
      MODIFY COLUMN role ENUM('DEVELOPER', 'ADMIN', 'STAFF', 'DONOR', 'PATIENT') NOT NULL DEFAULT 'PATIENT'
    `);
    console.log('AppUser role ENUM updated successfully.');

    // Check if developer user exists
    const [existing] = await conn.query('SELECT * FROM AppUser WHERE username = "developer"');
    if (existing.length === 0) {
      console.log('2. Inserting Developer Person...');
      const [pRes] = await conn.query(`
        INSERT INTO Person (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group)
        VALUES ('System', 'Developer', '1995-01-01', 'OTHER', '+91-9999900000', 'developer@lifelink.system', 'Central Systems HQ, IT Tower', 'New Delhi', 'Delhi', '110001', 'O-')
      `);
      const personId = pRes.insertId;

      console.log('3. Inserting Developer AppUser...');
      // bcrypt hash for Password@123
      const passHash = '$2b$10$7v8sN8n54N6y96mJq4bWueEwK1K92o7cM2uYVl5wWlFzY2u4aQdKu';
      await conn.query(`
        INSERT INTO AppUser (person_id, username, email, password_hash, role, is_active)
        VALUES (?, 'developer', 'developer@lifelink.system', ?, 'DEVELOPER', TRUE)
      `, [personId, passHash]);
      console.log('Developer account created with username: developer and password: Password@123');
    } else {
      console.log('Developer account already exists.');
    }

    // Also verify admin & staff hospital linkages
    const [staffUsers] = await conn.query(`
      SELECT u.username, u.role, s.staff_id, s.hospital_id, h.hospital_name
      FROM AppUser u
      JOIN Staff s ON u.person_id = s.person_id
      JOIN Hospital h ON s.hospital_id = h.hospital_id
    `);
    console.log('Staff/Admin user hospital affiliations:');
    console.table(staffUsers);

    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error setting up developer role:', err);
    conn.release();
    process.exit(1);
  }
}

setupDeveloper();
