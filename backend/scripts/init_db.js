/**
 * LIFE-LINK Database Initialization Script
 * Connects to MySQL 8.0, creates lifelink_db, runs schema.sql and seed_data.sql
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function splitSqlStatements(sql) {
  const lines = sql.split(/\r?\n/);
  const statements = [];
  let delimiter = ';';
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^DELIMITER\s+/i.test(trimmed)) {
      delimiter = trimmed.replace(/^DELIMITER\s+/i, '').trim();
      continue;
    }

    current += line + '\n';

    if (current.trimEnd().endsWith(delimiter)) {
      const statement = current.trim().slice(0, -delimiter.length).trim();

      if (statement) {
        statements.push(statement);
      }

      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function executeSqlFile(connection, filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(sql);

  console.log(`Executing ${label}: ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    try {
      await connection.query(statements[i]);
    } catch (err) {
      console.error(`Failed at ${label} statement ${i + 1}:`);
      throw err;
    }
  }

  console.log(`${label} executed successfully.`);
}

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

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    console.log(`Reading schema from: ${schemaPath}`);

    await executeSqlFile(connection, schemaPath, 'Database schema');

    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed_data.sql');
    console.log(`Reading seed data from: ${seedPath}`);

    await executeSqlFile(connection, seedPath, 'Seed data');

    const [hospitals] = await connection.query('SELECT COUNT(*) AS count FROM lifelink_db.Hospital');
    const [donors] = await connection.query('SELECT COUNT(*) AS count FROM lifelink_db.Donor');
    const [units] = await connection.query('SELECT COUNT(*) AS count FROM lifelink_db.BloodUnit');
    const [requests] = await connection.query('SELECT COUNT(*) AS count FROM lifelink_db.BloodRequest');
    const [organMatches] = await connection.query('SELECT COUNT(*) AS count FROM lifelink_db.OrganMatch');

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
    console.error('Error code:', err.code || 'Unknown');
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
