/**
 * LIFE-LINK 400 Synthetic Patients Importer
 * Imports 400 patient/person rows from CSV into MySQL 8.0 lifelink_db
 * Parent-to-child order (Person -> Patient), respecting all FK and CHECK constraints.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function runImport() {
  console.log('==================================================');
  console.log(' LIFE-LINK 400-Patient Dataset Import');
  console.log('==================================================');

  const csvPath = path.join(__dirname, '..', '..', 'database', 'dataset_400_patients', 'lifelink_400_synthetic_patients.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(csvPath, 'utf8');
  const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) {
    console.error('Error: CSV file is empty or only has headers.');
    process.exit(1);
  }

  const header = parseCSVLine(lines[0]);
  const dataRows = lines.slice(1);

  console.log(`Total rows in CSV: ${dataRows.length}`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'lifelink_db',
  });

  console.log('Connected to MySQL successfully.');

  let successful = 0;
  let failed = 0;
  let duplicates = 0;
  let invalidFK = 0;

  try {
    // Check valid hospitals and wards
    const [hospitals] = await conn.query('SELECT hospital_id FROM Hospital');
    const validHospitalIds = new Set(hospitals.map((h) => h.hospital_id));

    const [wards] = await conn.query('SELECT ward_id FROM Ward');
    const validWardIds = new Set(wards.map((w) => w.ward_id));

    // Clear any previous import in this range to ensure clean idempotent run
    await conn.query('DELETE FROM Patient WHERE patient_id BETWEEN 20001 AND 20400');
    await conn.query('DELETE FROM Person WHERE person_id BETWEEN 10001 AND 10400');

    await conn.query('START TRANSACTION');

    const personValues = [];
    const patientValues = [];

    for (let i = 0; i < dataRows.length; i++) {
      const cols = parseCSVLine(dataRows[i]);
      if (cols.length < 21) {
        console.warn(`Row ${i + 1} has insufficient columns (${cols.length}).`);
        failed++;
        continue;
      }

      const person_id = parseInt(cols[0], 10);
      const patient_id = parseInt(cols[1], 10);
      const first_name = cols[2];
      const last_name = cols[3];
      const date_of_birth = cols[4];
      const gender = cols[5];
      const phone = cols[6];
      const email = cols[7];
      const address = cols[8];
      const city = cols[9];
      const state = cols[10];
      const pincode = cols[11];
      const blood_group = cols[12];
      const emergency_contact_name = cols[13];
      const emergency_contact_phone = cols[14];
      const hospital_id = parseInt(cols[15], 10);
      const ward_id = cols[16] ? parseInt(cols[16], 10) : null;
      const attending_doctor_id = cols[17] ? parseInt(cols[17], 10) : null;
      const admission_date = cols[18];
      const discharge_date = cols[19] ? cols[19] : null;
      const medical_status = cols[20];
      const medical_notes = cols[21] || 'Inpatient admission record.';

      if (!validHospitalIds.has(hospital_id)) {
        console.warn(`Row ${i + 1}: Invalid hospital_id ${hospital_id}`);
        invalidFK++;
        failed++;
        continue;
      }

      if (ward_id && !validWardIds.has(ward_id)) {
        console.warn(`Row ${i + 1}: Invalid ward_id ${ward_id}`);
        invalidFK++;
        failed++;
        continue;
      }

      personValues.push([
        person_id,
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
        emergency_contact_name,
        emergency_contact_phone,
      ]);

      patientValues.push([
        patient_id,
        person_id,
        hospital_id,
        ward_id,
        attending_doctor_id,
        admission_date,
        discharge_date,
        medical_status,
        medical_notes,
      ]);
    }

    // Batch insert Persons
    const personSql = `
      INSERT INTO Person 
      (person_id, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group, emergency_contact_name, emergency_contact_phone)
      VALUES ?
    `;
    await conn.query(personSql, [personValues]);

    // Batch insert Patients
    const patientSql = `
      INSERT INTO Patient 
      (patient_id, person_id, hospital_id, ward_id, attending_doctor_id, admission_date, discharge_date, medical_status, medical_notes)
      VALUES ?
    `;
    await conn.query(patientSql, [patientValues]);

    await conn.query('COMMIT');

    const [verify] = await conn.query('SELECT COUNT(*) AS count FROM Patient WHERE patient_id BETWEEN 20001 AND 20400');
    successful = verify[0].count;

    console.log('\n--- 400-Patient Dataset Import Summary ---');
    console.log(`Total rows in CSV:           ${dataRows.length}`);
    console.log(`Successfully imported:       ${successful}`);
    console.log(`Failed rows:                 ${failed}`);
    console.log(`Duplicate records:           ${duplicates}`);
    console.log(`Invalid foreign keys:        ${invalidFK}`);
    console.log('-----------------------------------------');

    const [totalPatients] = await conn.query('SELECT COUNT(*) AS count FROM Patient');
    console.log(`Total Patients in Database:  ${totalPatients[0].count} (12 initial + ${successful} imported)`);
    console.log('Import COMPLETED successfully!\n');
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('Import failed! Transaction rolled back:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

runImport();
