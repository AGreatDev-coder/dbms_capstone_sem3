const fs = require('fs');
const { pool } = require('../config/db');

const csvPath = 'C:/Users/Sanju Samal/.gemini/antigravity/brain/499c3d5a-1047-4060-87c9-472165aabe9f/.user_uploaded/media_1795278625060_55baf586.csv';

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row = [];
    let inQuotes = false;
    let token = '';
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(token.trim());
        token = '';
      } else {
        token += char;
      }
    }
    row.push(token.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
};

const hospitalMap = {
  'HOSP-001': 1,
  'HOSP-002': 2,
  'HOSP-003': 3,
  'HOSP-004': 4,
  'HOSP-005': 5,
  'HOSP-006': 6,
};

function parseName(rawName) {
  const name = rawName.trim();
  if (/^DEMO STAFF \d+/i.test(name)) {
    const num = name.match(/\d+/)[0];
    return {
      first_name: 'Demo Staff',
      last_name: `#${num}`
    };
  }
  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: 'Specialist' };
  }
  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts[parts.length - 1]
  };
}

function determineSystemRole(designation, department) {
  const d = designation.toLowerCase();
  const dept = department.toLowerCase();

  if (
    d.includes('director') ||
    d.includes('superintendent') ||
    d.includes('chairman') ||
    d.includes('chief operating') ||
    d.includes('administrative executive') ||
    d.includes('hospital director') ||
    d.includes('zonal director')
  ) {
    return 'ADMIN';
  }

  if (
    d.includes('nurse') ||
    d.includes('nursing') ||
    d.includes('sister') ||
    dept.includes('nursing')
  ) {
    return 'NURSE';
  }

  if (
    d.includes('technician') ||
    d.includes('technologist') ||
    d.includes('physiotherapist') ||
    dept.includes('laboratory') ||
    dept.includes('pathology') ||
    dept.includes('radiology') ||
    dept.includes('medical physics')
  ) {
    return 'LAB_TECHNICIAN';
  }

  if (
    d.includes('pharmacist') ||
    d.includes('records executive') ||
    dept.includes('pharmacy') ||
    dept.includes('medical records')
  ) {
    return 'INVENTORY_COORDINATOR';
  }

  return 'DOCTOR';
}

function findWardId(hospitalId, department, designation, wardsByHospital) {
  const wards = wardsByHospital[hospitalId] || [];
  if (wards.length === 0) return null;
  const dept = (department || '').toLowerCase();
  const desig = (designation || '').toLowerCase();

  // Admin or hospital-wide leadership
  if (desig.includes('director') || desig.includes('superintendent') || dept.includes('admin') || desig.includes('executive')) {
    return null;
  }

  if (dept.includes('icu') || dept.includes('critical') || desig.includes('icu')) {
    const w = wards.find(x => x.ward_type === 'ICU');
    if (w) return w.ward_id;
  }
  if (dept.includes('emergency') || dept.includes('trauma')) {
    const w = wards.find(x => x.ward_type === 'EMERGENCY');
    if (w) return w.ward_id;
  }
  if (dept.includes('transplant') || dept.includes('renal') || dept.includes('bmt') || dept.includes('oncology') || dept.includes('haematology')) {
    const w = wards.find(x => x.ward_type === 'TRANSPLANT_CARE');
    if (w) return w.ward_id;
  }
  if (dept.includes('surg') || dept.includes('neuro') || dept.includes('ortho')) {
    const w = wards.find(x => x.ward_type === 'SURGICAL');
    if (w) return w.ward_id;
  }
  if (dept.includes('paed') || dept.includes('pediat')) {
    const w = wards.find(x => x.ward_type === 'PEDIATRIC');
    if (w) return w.ward_id;
  }

  return wards[0].ward_id;
}

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

async function importStaff() {
  const connection = await pool.getConnection();
  try {
    console.log('Beginning staff dataset import transaction...');
    await connection.beginTransaction();

    // 1. Fetch Hospitals and Wards
    const [hospitals] = await connection.query('SELECT hospital_id, hospital_name, city, state, pincode, address FROM Hospital');
    const hospMeta = {};
    hospitals.forEach(h => {
      hospMeta[h.hospital_id] = h;
    });

    const [wards] = await connection.query('SELECT ward_id, hospital_id, ward_name, ward_type FROM Ward');
    const wardsByHosp = {};
    wards.forEach(w => {
      if (!wardsByHosp[w.hospital_id]) wardsByHosp[w.hospital_id] = [];
      wardsByHosp[w.hospital_id].push(w);
    });

    // 2. Parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvContent);
    console.log(`Parsed ${rows.length} rows from CSV.`);

    const hospGroups = {};
    rows.forEach(r => {
      const hid = hospitalMap[r.hospital_id];
      if (!hid) {
        console.warn(`Unmapped hospital_id: ${r.hospital_id}`);
        return;
      }
      if (!hospGroups[hid]) hospGroups[hid] = [];
      hospGroups[hid].push(r);
    });

    let totalPersonsInserted = 0;
    let totalStaffInserted = 0;

    for (const hid of Object.keys(hospGroups).sort((a, b) => a - b)) {
      const group = hospGroups[hid];
      const hInfo = hospMeta[hid];
      console.log(`\nImporting Hospital ID ${hid}: ${hInfo.hospital_name} (${group.length} records)...`);

      const insertedStaff = [];

      for (let i = 0; i < group.length; i++) {
        const r = group[i];
        const { first_name, last_name } = parseName(r.staff_name);
        const role = determineSystemRole(r.designation, r.department);
        const wardId = findWardId(hid, r.department, r.designation, wardsByHosp);

        // Deterministic unique phone and email
        const phone = `+91-95${String(hid).padStart(2, '0')}${String(i + 1).padStart(6, '0')}`;
        const nameSlug = (first_name + '.' + last_name).toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${nameSlug}.${r.staff_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@lifelink.med.in`;

        // Deterministic realistic dates
        const birthYear = role === 'ADMIN' ? (1965 + (i % 12)) : (role === 'DOCTOR' ? (1972 + (i % 16)) : (1985 + (i % 14)));
        const birthMonth = String((i % 12) + 1).padStart(2, '0');
        const birthDay = String((i % 27) + 1).padStart(2, '0');
        const dob = `${birthYear}-${birthMonth}-${birthDay}`;

        const hireYear = role === 'ADMIN' ? (2005 + (i % 10)) : (2014 + (i % 10));
        const hireMonth = String(((i * 3) % 12) + 1).padStart(2, '0');
        const hireDay = String(((i * 7) % 27) + 1).padStart(2, '0');
        const hireDate = `${hireYear}-${hireMonth}-${hireDay}`;

        const gender = (r.staff_name.includes('Ms.') || r.staff_name.includes('Mrs.') || r.staff_name.includes('Sister') || (i % 3 === 0))
          ? 'FEMALE'
          : 'MALE';
        const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
        const address = `${hInfo.hospital_name} Staff Quarters, Campus Area`;

        // Insert Person
        const [personResult] = await connection.query(
          `INSERT INTO Person (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [first_name, last_name, dob, gender, phone, email, address, hInfo.city, hInfo.state, hInfo.pincode, bloodGroup]
        );
        const personId = personResult.insertId;
        totalPersonsInserted++;

        // Insert Staff (initially supervisor_staff_id = null)
        const [staffResult] = await connection.query(
          `INSERT INTO Staff (person_id, hospital_id, ward_id, supervisor_staff_id, job_title, department, system_role, hire_date, is_active)
           VALUES (?, ?, ?, NULL, ?, ?, ?, ?, TRUE)`,
          [personId, hid, wardId, r.designation, r.department, role, hireDate]
        );
        const staffId = staffResult.insertId;
        totalStaffInserted++;

        insertedStaff.push({
          staff_id: staffId,
          person_id: personId,
          raw: r,
          role,
          designation: r.designation,
          department: r.department
        });
      }

      // 3. Build Supervision Hierarchy for this hospital
      // Identify Primary Leader: Director / Superintendent / Chairman / First row
      let primaryLeader = insertedStaff.find(s => s.designation.toLowerCase().includes('director'));
      if (!primaryLeader) {
        primaryLeader = insertedStaff.find(s => s.designation.toLowerCase().includes('superintendent') || s.designation.toLowerCase().includes('chairman'));
      }
      if (!primaryLeader) {
        primaryLeader = insertedStaff[0];
      }

      // Map departments to department heads / senior professors
      const deptHeads = {};
      insertedStaff.forEach(s => {
        const desig = s.designation.toLowerCase();
        if (desig.includes('head') || desig.includes('professor') || desig.includes('senior consultant') || desig.includes('hod')) {
          if (!deptHeads[s.department]) {
            deptHeads[s.department] = s;
          }
        }
      });

      // Update supervisor_staff_id for each staff member
      for (const s of insertedStaff) {
        if (s.staff_id === primaryLeader.staff_id) {
          // Top executive has no supervisor (Level 0)
          continue;
        }

        let supervisorId = primaryLeader.staff_id;

        // If s is not an HOD/Director and has a department head in their department:
        const isSelfDeptHead = deptHeads[s.department]?.staff_id === s.staff_id;
        if (!isSelfDeptHead && deptHeads[s.department]) {
          supervisorId = deptHeads[s.department].staff_id;
        }

        await connection.query(
          'UPDATE Staff SET supervisor_staff_id = ? WHERE staff_id = ?',
          [supervisorId, s.staff_id]
        );
      }

      console.log(`  -> Configured hierarchy with leader #${primaryLeader.staff_id} (${primaryLeader.raw.staff_name}) for ${insertedStaff.length} staff.`);
    }

    await connection.commit();
    console.log(`\n======================================================`);
    console.log(`SUCCESS: Imported ${totalPersonsInserted} Persons and ${totalStaffInserted} Staff.`);
    console.log(`======================================================`);
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Import failed, rolling back...', err);
    await connection.rollback();
    connection.release();
    process.exit(1);
  }
}

importStaff();
