const fs = require('fs');
const { pool } = require('../config/db');

const parseCSV = (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
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

const componentMap = {
  'FFP': 'PLASMA',
  'RBC': 'RBC',
  'PLT': 'PLATELETS',
  'CRYO': 'CRYO',
};

const statusMap = {
  'ALLOCATED': 'ALLOCATED',
  'EXPIRED': 'EXPIRED',
  'AVAILABLE': 'AVAILABLE',
  'RESERVED': 'RESERVED',
  'QUARANTINED': 'DISCARDED',
};

const HLA_TYPES = [
  'HLA-A*02, B*44, DRB1*04',
  'HLA-A*01, B*08, DRB1*03',
  'HLA-A*24, B*35, DRB1*15',
  'HLA-A*03, B*07, DRB1*11',
  'HLA-A*11, B*40, DRB1*07',
  'HLA-A*26, B*51, DRB1*09',
  'HLA-A*33, B*58, DRB1*13',
  'HLA-A*68, B*18, DRB1*08'
];

const ORGAN_TYPES = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS', 'CORNEA'];

async function importBloodAndOrgan() {
  const connection = await pool.getConnection();
  try {
    console.log('Beginning Blood Bank & Organ Donation Network dataset import...');
    await connection.beginTransaction();

    // 1. Fetch Hospitals and active staff for recording & allocating
    const [hospitals] = await connection.query('SELECT hospital_id, hospital_name, city, state, pincode FROM Hospital');
    const hospMeta = {};
    hospitals.forEach(h => { hospMeta[h.hospital_id] = h; });

    const [staffList] = await connection.query('SELECT staff_id, hospital_id, system_role FROM Staff WHERE is_active = TRUE');
    const staffByHosp = {};
    staffList.forEach(s => {
      if (!staffByHosp[s.hospital_id]) staffByHosp[s.hospital_id] = [];
      staffByHosp[s.hospital_id].push(s);
    });

    const getStaffIdForHosp = (hid) => {
      const list = staffByHosp[hid] || [];
      const doctorOrTech = list.find(s => s.system_role === 'LAB_TECHNICIAN' || s.system_role === 'DOCTOR');
      return doctorOrTech ? doctorOrTech.staff_id : (list[0]?.staff_id || 1);
    };

    // 2. Parse CSVs
    const donationsCSV = parseCSV('database/donations_dataset.csv');
    const unitsCSV = parseCSV('database/blood_units_dataset.csv');
    console.log(`Loaded ${donationsCSV.length} donations and ${unitsCSV.length} blood units from CSV.`);

    // 3. Extract unique donors from donations
    const donorsMap = {};
    donationsCSV.forEach(d => {
      if (!donorsMap[d.donor_name]) {
        donorsMap[d.donor_name] = {
          name: d.donor_name,
          blood_group: d.blood_group,
          facility_id: d.harvest_facility_id,
          first_donation_date: d.collection_date,
          latest_donation_date: d.collection_date,
          status: d.donation_status,
          outcome: d.screening_outcome,
          notes: d.notes,
        };
      } else {
        if (d.collection_date > donorsMap[d.donor_name].latest_donation_date) {
          donorsMap[d.donor_name].latest_donation_date = d.collection_date;
        }
      }
    });

    const uniqueDonorNames = Object.keys(donorsMap);
    console.log(`Identified ${uniqueDonorNames.length} unique donors.`);

    const donorIdMap = {}; // donor_name -> donor_id
    const organDonorIds = []; // donor_ids with BOTH
    let donorsCreated = 0;

    for (let idx = 0; idx < uniqueDonorNames.length; idx++) {
      const donorName = uniqueDonorNames[idx];
      const dInfo = donorsMap[donorName];
      const hid = hospitalMap[dInfo.facility_id] || 1;
      const hMeta = hospMeta[hid];

      const parts = donorName.trim().split(/\s+/);
      const firstName = parts.slice(0, -1).join(' ') || parts[0];
      const lastName = parts.length > 1 ? parts[parts.length - 1] : 'Donor';

      const birthYear = 1978 + (idx % 24);
      const birthMonth = String((idx % 12) + 1).padStart(2, '0');
      const birthDay = String((idx % 27) + 1).padStart(2, '0');
      const dob = `${birthYear}-${birthMonth}-${birthDay}`;

      const gender = (idx % 3 === 0) ? 'FEMALE' : 'MALE';
      const phone = `+91-94${String(hid).padStart(2, '0')}${String(idx + 1).padStart(6, '0')}`;
      const nameSlug = (firstName + '.' + lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `donor.${nameSlug}.${idx + 1}@lifelink.donors.in`;

      // Insert Person
      const [pRes] = await connection.query(
        `INSERT INTO Person (first_name, last_name, date_of_birth, gender, phone, email, address, city, state, pincode, blood_group)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, dob, gender, phone, email, `${donorName} Residence, Sector ${10 + (idx % 40)}`, hMeta.city, hMeta.state, hMeta.pincode, dInfo.blood_group]
      );
      const personId = pRes.insertId;

      // Donor Type: ~50% BOTH (Blood & Organ), ~50% BLOOD
      const isBoth = (idx % 2 === 0);
      const donorType = isBoth ? 'BOTH' : 'BLOOD';
      const isDeferred = dInfo.status.includes('DEFERRED') || dInfo.outcome.includes('REACTIVE');
      const availStatus = isDeferred ? 'DEFERRED' : 'AVAILABLE';
      const deferReason = isDeferred ? 'Screening reactive quarantine in laboratory protocol' : null;

      // Insert Donor
      const [dRes] = await connection.query(
        `INSERT INTO Donor (person_id, donor_type, blood_group, registration_date, availability_status, last_donation_date, deferral_reason, medical_history_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [personId, donorType, dInfo.blood_group, dInfo.first_donation_date, availStatus, dInfo.latest_donation_date, deferReason, 'Verified donor registry record.']
      );
      const donorId = dRes.insertId;
      donorIdMap[donorName] = donorId;
      donorsCreated++;

      if (isBoth) {
        organDonorIds.push({
          donor_id: donorId,
          blood_group: dInfo.blood_group,
          reg_date: dInfo.first_donation_date,
          donor_name: donorName
        });
      }
    }
    console.log(`Successfully created ${donorsCreated} Donors in database.`);

    // 4. Insert Blood Donations (80 records)
    const donationMap = {}; // 'DON-0001' -> { donation_id, donor_id, hospital_id }
    let donationsCreated = 0;

    for (const d of donationsCSV) {
      const hid = hospitalMap[d.harvest_facility_id] || 1;
      const donorId = donorIdMap[d.donor_name];
      const staffId = getStaffIdForHosp(hid);
      const qty = parseInt(d.volume_collected_ml, 10) || 450;
      const hb = parseFloat(d.lab_hemoglobin_g_dl) || 13.5;
      const screeningStatus = d.screening_outcome.includes('PASS') ? 'PASSED' : 'FAILED';
      const remarks = `${d.screening_tests_recorded}; ${d.notes || 'Routine donation'}`.slice(0, 250);

      const [res] = await connection.query(
        `INSERT INTO BloodDonation (donor_id, donation_camp_id, hospital_id, recorded_by_staff_id, donation_date, quantity_ml, hemoglobin_level, screening_status, remarks)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
        [donorId, hid, staffId, d.collection_date, qty, hb, screeningStatus, remarks]
      );

      const donationId = res.insertId;
      donationMap[d.donation_id] = {
        donation_id: donationId,
        donor_id: donorId,
        hospital_id: hid,
        blood_group: d.blood_group
      };
      donationsCreated++;
    }
    console.log(`Successfully inserted ${donationsCreated} BloodDonation records.`);

    // 5. Insert Blood Units and connect Allocations / Requests
    let unitsCreated = 0;
    let allocationsCreated = 0;
    let requestsCreated = 0;

    for (let uIdx = 0; uIdx < unitsCSV.length; uIdx++) {
      const u = unitsCSV[uIdx];
      const dInfo = donationMap[u.donation_id] || { donation_id: 1, donor_id: 1, hospital_id: 1 };
      const hid = hospitalMap[u.hospital_id] || dInfo.hospital_id;
      const compType = componentMap[u.component_code] || 'WHOLE_BLOOD';
      const storageStatus = statusMap[u.unit_status] || 'AVAILABLE';

      let storageLocation = 'Refrigerated Storage Room A-01 (2–6°C)';
      if (compType === 'PLASMA' || compType === 'CRYO') {
        storageLocation = 'Deep Freezer Vault B-02 (≤ -18°C)';
      } else if (compType === 'PLATELETS') {
        storageLocation = 'Platelet Agitator Unit C-03 (20–24°C)';
      }

      // If unit is ALLOCATED, initially insert as AVAILABLE so trigger trg_prevent_expired_allocation allows the allocation
      const initialStatus = (u.unit_status === 'ALLOCATED') ? 'AVAILABLE' : storageStatus;

      // Insert BloodUnit
      const [uRes] = await connection.query(
        `INSERT INTO BloodUnit (donation_id, donor_id, hospital_id, blood_group, component_type, donation_date, expiry_date, storage_status, storage_location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [dInfo.donation_id, dInfo.donor_id, hid, u.blood_group, compType, u.collection_date, u.expiry_date, initialStatus, storageLocation]
      );
      const unitId = uRes.insertId;
      unitsCreated++;

      // If unit is ALLOCATED or RESERVED, create/link BloodRequest & BloodAllocation
      if (u.unit_status === 'ALLOCATED' && u.allocated_patient_id) {
        const patNum = parseInt(u.allocated_patient_id.replace('PAT-', ''), 10);
        const patientId = 20000 + (patNum % 400 || 1);
        const staffId = getStaffIdForHosp(hid);

        // Create BloodRequest
        const [reqRes] = await connection.query(
          `INSERT INTO BloodRequest (patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, request_date, required_by_date, request_status, clinical_indication)
           VALUES (?, ?, ?, ?, 1, 'HIGH', ?, ?, 'FULFILLED', ?)`,
          [patientId, hid, u.blood_group, compType, u.collection_date, u.expiry_date, `Inpatient Transfusion Protocol for ${u.component_name}`]
        );
        const requestId = reqRes.insertId;
        requestsCreated++;

        // Insert BloodAllocation
        await connection.query(
          `INSERT INTO BloodAllocation (request_id, unit_id, allocated_by_staff_id, allocated_date, allocation_status, notes)
           VALUES (?, ?, ?, ?, 'ALLOCATED', ?)`,
          [requestId, unitId, staffId, u.collection_date, `Fulfilled ${u.component_name} allocation for ${u.allocated_patient_id}`]
        );
        allocationsCreated++;

        // Update BloodUnit to ALLOCATED
        await connection.query(
          `UPDATE BloodUnit SET storage_status = 'ALLOCATED' WHERE unit_id = ?`,
          [unitId]
        );
      } else if (u.unit_status === 'RESERVED' && u.reserved_for_request_id) {
        const patNum = (uIdx * 7) % 400 + 1;
        const patientId = 20000 + patNum;

        // Create Reserved BloodRequest
        await connection.query(
          `INSERT INTO BloodRequest (patient_id, hospital_id, blood_group, component_type, units_required, urgency_level, request_date, required_by_date, request_status, clinical_indication)
           VALUES (?, ?, ?, ?, 1, 'HIGH', ?, ?, 'PARTIALLY_FULFILLED', ?)`,
          [patientId, hid, u.blood_group, compType, u.collection_date, u.expiry_date, `Reserved unit allocation for ${u.component_name}`]
        );
        requestsCreated++;
      }
    }

    console.log(`Successfully created ${unitsCreated} BloodUnits.`);
    console.log(`Successfully created ${requestsCreated} BloodRequests.`);
    console.log(`Successfully created ${allocationsCreated} BloodAllocations.`);

    // 6. Integrate with Organ Donation Network
    let organDonationsCreated = 0;
    let organRequestsCreated = 0;
    let organMatchesCreated = 0;

    const insertedOrganDonations = [];

    // For the ~39 organ donors, create diverse organ pledges
    for (let i = 0; i < organDonorIds.length; i++) {
      const oDonor = organDonorIds[i];
      const organType = ORGAN_TYPES[i % ORGAN_TYPES.length];
      const hla = HLA_TYPES[i % HLA_TYPES.length];
      const status = (i % 3 === 0) ? 'MATCH_PENDING' : 'PLEDGED';

      const [odRes] = await connection.query(
        `INSERT INTO OrganDonation (donor_id, organ_type, donation_status, registration_date, hla_type, medical_clearance, clinical_notes)
         VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
        [oDonor.donor_id, organType, status, oDonor.reg_date, hla, `Healthy pledged ${organType.toLowerCase()} donor candidate. Complete histocompatibility panel verified.`]
      );
      insertedOrganDonations.push({
        organ_donation_id: odRes.insertId,
        donor_id: oDonor.donor_id,
        organ_type: organType,
        blood_group: oDonor.blood_group,
        hla_type: hla,
        status
      });
      organDonationsCreated++;
    }

    // Create corresponding waiting organ requests for real patients in DB
    const insertedOrganRequests = [];
    const [eligiblePatients] = await connection.query(
      `SELECT p.patient_id, p.hospital_id, per.blood_group, per.first_name, per.last_name
       FROM Patient p
       JOIN Person per ON p.person_id = per.person_id
       ORDER BY p.patient_id ASC
       LIMIT 30`
    );

    for (let i = 0; i < Math.min(25, eligiblePatients.length); i++) {
      const pat = eligiblePatients[i];
      const organType = ORGAN_TYPES[i % ORGAN_TYPES.length];
      const urgency = (i % 4 === 0) ? 'CRITICAL' : (i % 3 === 0 ? 'HIGH' : 'MEDIUM');
      const score = 65 + (i * 3) % 35;
      const hla = HLA_TYPES[(i + 2) % HLA_TYPES.length];
      const reqStatus = (i % 2 === 0) ? 'MATCH_PROPOSED' : 'WAITING';

      const [orRes] = await connection.query(
        `INSERT INTO OrganRequest (patient_id, hospital_id, organ_type, recipient_blood_group, urgency_level, request_date, request_status, hla_type, medical_urgency_score)
         VALUES (?, ?, ?, ?, ?, '2026-09-01', ?, ?, ?)`,
        [pat.patient_id, pat.hospital_id, organType, pat.blood_group, urgency, reqStatus, hla, score]
      );
      insertedOrganRequests.push({
        organ_request_id: orRes.insertId,
        patient_id: pat.patient_id,
        hospital_id: pat.hospital_id,
        organ_type: organType,
        blood_group: pat.blood_group,
        hla_type: hla
      });
      organRequestsCreated++;
    }

    // Create matches between compatible donation pledges and waiting requests
    for (const od of insertedOrganDonations) {
      // Find a request with matching organ type
      const matchingReq = insertedOrganRequests.find(oq => oq.organ_type === od.organ_type && !oq.matched);
      if (matchingReq) {
        matchingReq.matched = true;
        const staffId = getStaffIdForHosp(matchingReq.hospital_id);
        const matchScore = (85.0 + ((od.organ_donation_id * 3) % 14)).toFixed(2);
        const verStatus = (od.organ_donation_id % 2 === 0) ? 'VERIFIED_BY_COMMITTEE' : 'PENDING_VERIFICATION';

        await connection.query(
          `INSERT INTO OrganMatch (organ_donation_id, organ_request_id, match_date, compatibility_status, verification_status, match_score, medical_notes, verified_by_staff_id, verification_date)
           VALUES (?, ?, NOW(), 'HIGH_COMPATIBILITY', ?, ?, ?, ?, NOW())`,
          [od.organ_donation_id, matchingReq.organ_request_id, verStatus, matchScore, 'Cross-match negative; high HLA compatibility concordance index.', staffId]
        );
        organMatchesCreated++;
      }
    }

    console.log(`Successfully created ${organDonationsCreated} OrganDonations.`);
    console.log(`Successfully created ${organRequestsCreated} OrganRequests.`);
    console.log(`Successfully created ${organMatchesCreated} OrganMatches.`);

    await connection.commit();
    console.log('\n======================================================');
    console.log('SUCCESS: Full Blood & Organ Network Data Imported & Connected!');
    console.log('======================================================');
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('Import failed, rolling back...', err);
    await connection.rollback();
    connection.release();
    process.exit(1);
  }
}

importBloodAndOrgan();
