/**
 * Full Database Dump Generator for LIFE-LINK
 * Exports all schema and current records into database/full_production_dump.sql
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function dumpDatabase() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'lifelink_db',
    multipleStatements: true,
    dateStrings: true
  });

  console.log('Connected to local MySQL database.');
  const outputFile = path.join(__dirname, '..', '..', 'database', 'full_production_dump.sql');
  const writeStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  writeStream.write('-- ============================================================================\n');
  writeStream.write('-- LIFE-LINK COMPLETE DATABASE PRODUCTION RECOVERY DUMP\n');
  writeStream.write(`-- Exported on: ${new Date().toISOString()}\n`);
  writeStream.write('-- ============================================================================\n\n');
  writeStream.write('SET FOREIGN_KEY_CHECKS = 0;\n\n');

  // Ordered list of tables to respect dependencies
  const tables = [
    'BloodCompatibility',
    'Hospital',
    'Ward',
    'Person',
    'Staff',
    'Donor',
    'Patient',
    'AppUser',
    'DonationCamp',
    'CampDonorRegistration',
    'BloodDonation',
    'BloodUnit',
    'BloodRequest',
    'BloodAllocation',
    'OrganDonation',
    'OrganRequest',
    'OrganMatch'
  ];

  for (const table of tables) {
    try {
      // Get Create Table
      const [createResult] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      const createSql = createResult[0]['Create Table'] || createResult[0]['Create View'];

      writeStream.write(`-- ----------------------------------------------------------------------------\n`);
      writeStream.write(`-- Table structure for table \`${table}\`\n`);
      writeStream.write(`-- ----------------------------------------------------------------------------\n`);
      writeStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
      writeStream.write(`${createSql};\n\n`);

      // Get Table Rows
      const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
      console.log(`Dumping ${table}: ${rows.length} rows`);

      if (rows.length > 0) {
        writeStream.write(`-- Data for table \`${table}\`\n`);
        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');

        const chunkSize = 50;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const values = chunk.map(row => {
            const rowValues = Object.values(row).map(val => {
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 1 : 0;
              // Escape strings
              const escaped = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
              return `'${escaped}'`;
            });
            return `(${rowValues.join(', ')})`;
          });

          writeStream.write(`INSERT INTO \`${table}\` (${columns}) VALUES\n  ${values.join(',\n  ')};\n`);
        }
        writeStream.write('\n');
      }
    } catch (err) {
      console.warn(`Error dumping ${table}:`, err.message);
    }
  }

  writeStream.write('SET FOREIGN_KEY_CHECKS = 1;\n');
  writeStream.end();
  await conn.end();
  console.log(`\nDump complete! Saved to: ${outputFile}`);
}

dumpDatabase().catch(err => {
  console.error('Fatal dump error:', err);
  process.exit(1);
});
