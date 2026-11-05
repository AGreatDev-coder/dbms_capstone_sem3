/**
 * LIFE-LINK Database Initialization Script
 * Connects to MySQL 8.0, creates lifelink_db, runs schema.sql and seed_data.sql
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
  console.log('==================================================');
  console.log(' LIFE-LINK MySQL 8.0 Database Initialization');
  console.log('==================================================');

  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true,
  };

  let connection;
  try {
    console.log(`Connecting to MySQL at ${connectionConfig.host}:${connectionConfig.port} as ${connectionConfig.user}...`);
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server successfully.');

    // 1. Read and execute schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    console.log(`Reading DDL schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing database schema creation...');
    await connection.query(schemaSql);
    console.log('Schema created successfully: Tables, Views, Triggers, and Stored Procedures initialized.');

    // 2. Read and execute seed_data.sql
    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed_data.sql');
    console.log(`Reading Seed Data from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed data insertion...');
    await connection.query(seedSql);
    console.log('Seed data inserted successfully.');

    // 3. Verify counts
    const [hospitals] = await connection.query('SELECT COUNT(*) as count FROM lifelink_db.Hospital');
    const [donors] = await connection.query('SELECT COUNT(*) as count FROM lifelink_db.Donor');
    const [units] = await connection.query('SELECT COUNT(*) as count FROM lifelink_db.BloodUnit');
    const [requests] = await connection.query('SELECT COUNT(*) as count FROM lifelink_db.BloodRequest');
    const [organMatches] = await connection.query('SELECT COUNT(*) as count FROM lifelink_db.OrganMatch');

    console.log('\n--- Database Verification Summary ---');
    console.log(`Hospitals:       ${hospitals[0].count}`);
    console.log(`Donors:          ${donors[0].count}`);
    console.log(`Blood Units:     ${units[0].count}`);
    console.log(`Blood Requests:  ${requests[0].count}`);
    console.log(`Organ Matches:   ${organMatches[0].count}`);
    console.log('-------------------------------------');
    console.log('LIFE-LINK database initialization COMPLETED successfully!\n');

  } catch (err) {
    console.error('\n[Database Init Error]:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Hint: Ensure your local MySQL 8.0 service is running and credentials in backend/.env are correct.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();

