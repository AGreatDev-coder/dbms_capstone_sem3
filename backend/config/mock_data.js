/**
 * LIFE-LINK Initial Dataset (Mirroring database/seed_data.sql)
 * Provides relational dataset continuity and resilience.
 */

const initialCompatibility = [
  { donor_blood_group: 'O-', recipient_blood_group: 'O-', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'O+', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'A-', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'A+', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'B-', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'B+', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'AB-', is_compatible: true },
  { donor_blood_group: 'O-', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'O+', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'O+', recipient_blood_group: 'O+', is_compatible: true },
  { donor_blood_group: 'O+', recipient_blood_group: 'A-', is_compatible: false },
  { donor_blood_group: 'O+', recipient_blood_group: 'A+', is_compatible: true },
  { donor_blood_group: 'O+', recipient_blood_group: 'B-', is_compatible: false },
  { donor_blood_group: 'O+', recipient_blood_group: 'B+', is_compatible: true },
  { donor_blood_group: 'O+', recipient_blood_group: 'AB-', is_compatible: false },
  { donor_blood_group: 'O+', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'A-', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'A-', recipient_blood_group: 'O+', is_compatible: false },
  { donor_blood_group: 'A-', recipient_blood_group: 'A-', is_compatible: true },
  { donor_blood_group: 'A-', recipient_blood_group: 'A+', is_compatible: true },
  { donor_blood_group: 'A-', recipient_blood_group: 'B-', is_compatible: false },
  { donor_blood_group: 'A-', recipient_blood_group: 'B+', is_compatible: false },
  { donor_blood_group: 'A-', recipient_blood_group: 'AB-', is_compatible: true },
  { donor_blood_group: 'A-', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'A+', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'A+', recipient_blood_group: 'O+', is_compatible: false },
  { donor_blood_group: 'A+', recipient_blood_group: 'A-', is_compatible: false },
  { donor_blood_group: 'A+', recipient_blood_group: 'A+', is_compatible: true },
  { donor_blood_group: 'A+', recipient_blood_group: 'B-', is_compatible: false },
  { donor_blood_group: 'A+', recipient_blood_group: 'B+', is_compatible: false },
  { donor_blood_group: 'A+', recipient_blood_group: 'AB-', is_compatible: false },
  { donor_blood_group: 'A+', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'B-', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'B-', recipient_blood_group: 'O+', is_compatible: false },
  { donor_blood_group: 'B-', recipient_blood_group: 'A-', is_compatible: false },
  { donor_blood_group: 'B-', recipient_blood_group: 'A+', is_compatible: false },
  { donor_blood_group: 'B-', recipient_blood_group: 'B-', is_compatible: true },
  { donor_blood_group: 'B-', recipient_blood_group: 'B+', is_compatible: true },
  { donor_blood_group: 'B-', recipient_blood_group: 'AB-', is_compatible: true },
  { donor_blood_group: 'B-', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'B+', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'B+', recipient_blood_group: 'O+', is_compatible: false },
  { donor_blood_group: 'B+', recipient_blood_group: 'A-', is_compatible: false },
  { donor_blood_group: 'B+', recipient_blood_group: 'A+', is_compatible: false },
  { donor_blood_group: 'B+', recipient_blood_group: 'B-', is_compatible: false },
  { donor_blood_group: 'B+', recipient_blood_group: 'B+', is_compatible: true },
  { donor_blood_group: 'B+', recipient_blood_group: 'AB-', is_compatible: false },
  { donor_blood_group: 'B+', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'AB-', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'AB-', recipient_blood_group: 'O+', is_compatible: false },
  { donor_blood_group: 'AB-', recipient_blood_group: 'A-', is_compatible: false },
  { donor_blood_group: 'AB-', recipient_blood_group: 'A+', is_compatible: false },
  { donor_blood_group: 'AB-', recipient_blood_group: 'B-', is_compatible: false },
  { donor_blood_group: 'AB-', recipient_blood_group: 'B+', is_compatible: false },
  { donor_blood_group: 'AB-', recipient_blood_group: 'AB-', is_compatible: true },
  { donor_blood_group: 'AB-', recipient_blood_group: 'AB+', is_compatible: true },

  { donor_blood_group: 'AB+', recipient_blood_group: 'O-', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'O+', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'A-', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'A+', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'B-', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'B+', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'AB-', is_compatible: false },
  { donor_blood_group: 'AB+', recipient_blood_group: 'AB+', is_compatible: true },
];

const initialHospitals = [
  {
    hospital_id: 1,
    hospital_name: 'All India Institute of Medical Sciences (AIIMS)',
    license_number: 'LIC-AIIMS-2001',
    address: 'Ansari Nagar East',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    contact_phone: '+91-11-26588500',
    contact_email: 'bloodbank@aiims.edu',
    emergency_helpline: '102',
    established_year: 1956,
    is_active: true,
  },
  {
    hospital_id: 2,
    hospital_name: 'Apollo Multispeciality Hospital',
    license_number: 'LIC-APOLLO-4482',
    address: '21 Greams Lane, Thousand Lights',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    contact_phone: '+91-44-28290200',
    contact_email: 'lifelink@apollo.org',
    emergency_helpline: '+91-44-28293333',
    established_year: 1983,
    is_active: true,
  },
  {
    hospital_id: 3,
    hospital_name: 'Fortis Memorial Research Institute',
    license_number: 'LIC-FORTIS-9011',
    address: 'Sector 44, Opposite HUDA City Centre',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    contact_phone: '+91-124-4921021',
    contact_email: 'transplant@fortis.in',
    emergency_helpline: '105',
    established_year: 2001,
    is_active: true,
  },
  {
    hospital_id: 4,
    hospital_name: 'Tata Memorial Cancer & Research Centre',
    license_number: 'LIC-TATA-3301',
    address: 'Dr. E Borges Road, Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400012',
    contact_phone: '+91-22-24177000',
    contact_email: 'bloodcare@tatamemorial.org',
    emergency_helpline: '108',
    established_year: 1941,
    is_active: true,
  },
  {
    hospital_id: 5,
    hospital_name: 'Manipal Hospital Life Centre',
    license_number: 'LIC-MANIPAL-7721',
    address: '98 HAL Old Airport Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560017',
    contact_phone: '+91-80-25024444',
    contact_email: 'donors@manipal.edu',
    emergency_helpline: '+91-80-25023333',
    established_year: 1991,
    is_active: true,
  },
];

const initialWards = [
  { ward_id: 1, hospital_id: 1, ward_name: 'Cardiovascular ICU', ward_type: 'ICU', floor_number: 3, total_beds: 20, occupied_beds: 14 },
  { ward_id: 2, hospital_id: 1, ward_name: 'Emergency Trauma Bay', ward_type: 'EMERGENCY', floor_number: 1, total_beds: 30, occupied_beds: 22 },
  { ward_id: 3, hospital_id: 1, ward_name: 'Organ Transplant Recovery Unit', ward_type: 'TRANSPLANT_CARE', floor_number: 4, total_beds: 15, occupied_beds: 8 },
  { ward_id: 4, hospital_id: 1, ward_name: 'General Surgical Ward A', ward_type: 'SURGICAL', floor_number: 2, total_beds: 40, occupied_beds: 28 },
  { ward_id: 5, hospital_id: 2, ward_name: 'Main Emergency & Triage', ward_type: 'EMERGENCY', floor_number: 1, total_beds: 25, occupied_beds: 18 },
  { ward_id: 6, hospital_id: 2, ward_name: 'Critical Care Complex', ward_type: 'ICU', floor_number: 2, total_beds: 18, occupied_beds: 12 },
  { ward_id: 7, hospital_id: 2, ward_name: 'Liver & Renal Transplant Wing', ward_type: 'TRANSPLANT_CARE', floor_number: 3, total_beds: 12, occupied_beds: 6 },
  { ward_id: 8, hospital_id: 3, ward_name: 'Pediatric Intensive Care Unit', ward_type: 'PEDIATRIC', floor_number: 2, total_beds: 15, occupied_beds: 9 },
  { ward_id: 9, hospital_id: 3, ward_name: 'Neurosurgery Recovery Unit', ward_type: 'SURGICAL', floor_number: 4, total_beds: 20, occupied_beds: 11 },
  { ward_id: 10, hospital_id: 4, ward_name: 'Hematology & Bone Marrow Unit', ward_type: 'TRANSPLANT_CARE', floor_number: 5, total_beds: 25, occupied_beds: 19 },
  { ward_id: 11, hospital_id: 4, ward_name: 'Oncology Emergency Ward', ward_type: 'EMERGENCY', floor_number: 1, total_beds: 30, occupied_beds: 21 },
  { ward_id: 12, hospital_id: 5, ward_name: 'Cardiothoracic Care Unit', ward_type: 'ICU', floor_number: 3, total_beds: 16, occupied_beds: 10 },
];

const initialPersons = [
  // Staff 1-10
  { person_id: 1, first_name: 'Vikram', last_name: 'Sharma', date_of_birth: '1975-04-12', gender: 'MALE', phone: '+91-9810011221', email: 'vikram.sharma@aiims.edu', address: 'C-4/12 Hauz Khas', city: 'New Delhi', state: 'Delhi', pincode: '110016', blood_group: 'O+' },
  { person_id: 2, first_name: 'Priya', last_name: 'Sundaram', date_of_birth: '1982-08-23', gender: 'FEMALE', phone: '+91-9840022332', email: 'priya.sundaram@apollo.org', address: '14 Annanagar West', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', blood_group: 'A+' },
  { person_id: 3, first_name: 'Rajesh', last_name: 'Menon', date_of_birth: '1980-01-19', gender: 'MALE', phone: '+91-9818833443', email: 'rajesh.menon@fortis.in', address: 'Flat 702 DLF Phase 4', city: 'Gurugram', state: 'Haryana', pincode: '122009', blood_group: 'B+' },
  { person_id: 4, first_name: 'Meera', last_name: 'Kulkarni', date_of_birth: '1987-11-05', gender: 'FEMALE', phone: '+91-9820044554', email: 'meera.k@tatamemorial.org', address: 'B-102 Dadar West', city: 'Mumbai', state: 'Maharashtra', pincode: '400028', blood_group: 'AB+' },
  { person_id: 5, first_name: 'Suresh', last_name: 'Bhat', date_of_birth: '1978-06-30', gender: 'MALE', phone: '+91-9845055665', email: 'suresh.bhat@manipal.edu', address: '34 Indiranagar 100ft Rd', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', blood_group: 'O-' },
  { person_id: 6, first_name: 'Neha', last_name: 'Kapoor', date_of_birth: '1990-09-14', gender: 'FEMALE', phone: '+91-9811166776', email: 'neha.kapoor@aiims.edu', address: 'A-33 South Extension II', city: 'New Delhi', state: 'Delhi', pincode: '110049', blood_group: 'A-' },
  { person_id: 7, first_name: 'Arun', last_name: 'Verma', date_of_birth: '1985-03-22', gender: 'MALE', phone: '+91-9810277887', email: 'arun.verma@aiims.edu', address: '12 Mayur Vihar Phase 1', city: 'New Delhi', state: 'Delhi', pincode: '110091', blood_group: 'B-' },
  { person_id: 8, first_name: 'Deepa', last_name: 'Nambiar', date_of_birth: '1992-12-08', gender: 'FEMALE', phone: '+91-9840388998', email: 'deepa.n@apollo.org', address: '88 T Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017', blood_group: 'O+' },
  { person_id: 9, first_name: 'Amit', last_name: 'Chauhan', date_of_birth: '1989-05-17', gender: 'MALE', phone: '+91-9818499009', email: 'amit.c@fortis.in', address: '54 Sushant Lok 1', city: 'Gurugram', state: 'Haryana', pincode: '122002', blood_group: 'AB-' },
  { person_id: 10, first_name: 'Sunil', last_name: 'Jadhav', date_of_birth: '1983-02-28', gender: 'MALE', phone: '+91-9820511220', email: 'sunil.j@tatamemorial.org', address: '23 Worli Seaface', city: 'Mumbai', state: 'Maharashtra', pincode: '400018', blood_group: 'O+' },

  // Donors 11-22
  { person_id: 11, first_name: 'Rahul', last_name: 'Deshmukh', date_of_birth: '1995-07-15', gender: 'MALE', phone: '+91-9871110011', email: 'rahul.deshmukh@gmail.com', address: '45 Model Town', city: 'New Delhi', state: 'Delhi', pincode: '110009', blood_group: 'O-' },
  { person_id: 12, first_name: 'Ananya', last_name: 'Iyer', date_of_birth: '1998-03-20', gender: 'FEMALE', phone: '+91-9841110022', email: 'ananya.iyer@gmail.com', address: '19 Besant Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600090', blood_group: 'A+' },
  { person_id: 13, first_name: 'Kabir', last_name: 'Sen', date_of_birth: '1993-10-11', gender: 'MALE', phone: '+91-9818110033', email: 'kabir.sen@gmail.com', address: '78 Sector 15', city: 'Gurugram', state: 'Haryana', pincode: '122001', blood_group: 'B+' },
  { person_id: 14, first_name: 'Tanvi', last_name: 'Patel', date_of_birth: '1996-01-25', gender: 'FEMALE', phone: '+91-9821110044', email: 'tanvi.patel@gmail.com', address: '89 Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', blood_group: 'AB+' },
  { person_id: 15, first_name: 'Gaurav', last_name: 'Reddy', date_of_birth: '1991-05-09', gender: 'MALE', phone: '+91-9848110055', email: 'gaurav.reddy@gmail.com', address: '12 Koramangala 4th Block', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', blood_group: 'O+' },
  { person_id: 16, first_name: 'Ishita', last_name: 'Bose', date_of_birth: '1997-09-18', gender: 'FEMALE', phone: '+91-9831110066', email: 'ishita.bose@gmail.com', address: '62 Salt Lake Sector 2', city: 'Kolkata', state: 'West Bengal', pincode: '700091', blood_group: 'A-' },
  { person_id: 17, first_name: 'Manish', last_name: 'Malhotra', date_of_birth: '1988-12-03', gender: 'MALE', phone: '+91-9810110077', email: 'manish.m@gmail.com', address: '33 Greater Kailash I', city: 'New Delhi', state: 'Delhi', pincode: '110048', blood_group: 'B-' },
  { person_id: 18, first_name: 'Ritu', last_name: 'Singhania', date_of_birth: '1994-04-14', gender: 'FEMALE', phone: '+91-9820110088', email: 'ritu.singhania@gmail.com', address: '14 Juhu Tara Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400049', blood_group: 'AB-' },
  { person_id: 19, first_name: 'Kunal', last_name: 'Nair', date_of_birth: '1992-06-27', gender: 'MALE', phone: '+91-9845110099', email: 'kunal.nair@gmail.com', address: '56 Whitefield Main Rd', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', blood_group: 'O+' },
  { person_id: 20, first_name: 'Divya', last_name: 'Aggarwal', date_of_birth: '1999-11-29', gender: 'FEMALE', phone: '+91-9811110111', email: 'divya.aggarwal@gmail.com', address: '21 Punjabi Bagh West', city: 'New Delhi', state: 'Delhi', pincode: '110026', blood_group: 'A+' },
  { person_id: 21, first_name: 'Siddharth', last_name: 'Joshi', date_of_birth: '1986-08-07', gender: 'MALE', phone: '+91-9822110122', email: 'siddharth.j@gmail.com', address: '90 Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411038', blood_group: 'B+' },
  { person_id: 22, first_name: 'Pooja', last_name: 'Hegde', date_of_birth: '1995-02-17', gender: 'FEMALE', phone: '+91-9849110133', email: 'pooja.hegde@gmail.com', address: '11 Malleshwaram', city: 'Bengaluru', state: 'Karnataka', pincode: '560003', blood_group: 'O-' },

  // Patients 23-34
  { person_id: 23, first_name: 'Aditya', last_name: 'Mehta', date_of_birth: '1968-04-10', gender: 'MALE', phone: '+91-9810220011', email: 'aditya.mehta@outlook.com', address: '101 Defence Colony', city: 'New Delhi', state: 'Delhi', pincode: '110024', blood_group: 'O+' },
  { person_id: 24, first_name: 'Lakshmi', last_name: 'Narayanan', date_of_birth: '1972-09-02', gender: 'FEMALE', phone: '+91-9840220022', email: 'lakshmi.n@outlook.com', address: '55 Mylapore', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004', blood_group: 'A+' },
  { person_id: 25, first_name: 'Harish', last_name: 'Khurana', date_of_birth: '1959-11-19', gender: 'MALE', phone: '+91-9818220033', email: 'harish.k@outlook.com', address: '88 South City 1', city: 'Gurugram', state: 'Haryana', pincode: '122001', blood_group: 'B-' },
  { person_id: 26, first_name: 'Sangeeta', last_name: 'Shah', date_of_birth: '1965-01-30', gender: 'FEMALE', phone: '+91-9820220044', email: 'sangeeta.shah@outlook.com', address: '72 Marine Drive', city: 'Mumbai', state: 'Maharashtra', pincode: '400020', blood_group: 'AB+' },
  { person_id: 27, first_name: 'Naveen', last_name: 'Kumar', date_of_birth: '1984-07-21', gender: 'MALE', phone: '+91-9845220055', email: 'naveen.k@outlook.com', address: '39 Jayanagar 4th Block', city: 'Bengaluru', state: 'Karnataka', pincode: '560011', blood_group: 'O-' },
  { person_id: 28, first_name: 'Bhavna', last_name: 'Tiwari', date_of_birth: '1990-10-15', gender: 'FEMALE', phone: '+91-9811220066', email: 'bhavna.t@outlook.com', address: '67 Rohini Sector 9', city: 'New Delhi', state: 'Delhi', pincode: '110085', blood_group: 'A-' },
  { person_id: 29, first_name: 'Ramesh', last_name: 'Pawar', date_of_birth: '1963-03-08', gender: 'MALE', phone: '+91-9821220077', email: 'ramesh.pawar@outlook.com', address: '18 Thane West', city: 'Mumbai', state: 'Maharashtra', pincode: '400601', blood_group: 'B+' },
  { person_id: 30, first_name: 'Gayatri', last_name: 'Rao', date_of_birth: '1977-05-24', gender: 'FEMALE', phone: '+91-9841220088', email: 'gayatri.rao@outlook.com', address: '4 Adyar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020', blood_group: 'AB-' },
  { person_id: 31, first_name: 'Farhan', last_name: 'Akhtar', date_of_birth: '1989-12-12', gender: 'MALE', phone: '+91-9819220099', email: 'farhan.a@outlook.com', address: '32 Bandra Bandstand', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', blood_group: 'O+' },
  { person_id: 32, first_name: 'Kavita', last_name: 'Sood', date_of_birth: '1981-08-14', gender: 'FEMALE', phone: '+91-9810220111', email: 'kavita.sood@outlook.com', address: '71 Vasant Kunj', city: 'New Delhi', state: 'Delhi', pincode: '110070', blood_group: 'A+' },
  { person_id: 33, first_name: 'Pradeep', last_name: 'Gowda', date_of_birth: '1970-02-05', gender: 'MALE', phone: '+91-9845220122', email: 'pradeep.g@outlook.com', address: '29 Rajajinagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560010', blood_group: 'B+' },
  { person_id: 34, first_name: 'Anuradha', last_name: 'Chatterjee', date_of_birth: '1974-06-18', gender: 'FEMALE', phone: '+91-9830220133', email: 'anuradha.c@outlook.com', address: '15 Alipore', city: 'Kolkata', state: 'West Bengal', pincode: '700027', blood_group: 'O-' },
];

const initialStaff = [
  { staff_id: 1, person_id: 1, hospital_id: 1, ward_id: 1, supervisor_staff_id: null, job_title: 'Chief Medical Officer', department: 'Cardiovascular Surgery', system_role: 'ADMIN', hire_date: '2010-06-01', is_active: true },
  { staff_id: 2, person_id: 2, hospital_id: 2, ward_id: 5, supervisor_staff_id: null, job_title: 'Head of Blood Transfusion Services', department: 'Hematology', system_role: 'ADMIN', hire_date: '2012-09-15', is_active: true },
  { staff_id: 3, person_id: 3, hospital_id: 3, ward_id: 8, supervisor_staff_id: null, job_title: 'Director of Organ Transplantation', department: 'Transplant Surgery', system_role: 'ADMIN', hire_date: '2014-03-10', is_active: true },
  { staff_id: 4, person_id: 4, hospital_id: 4, ward_id: 10, supervisor_staff_id: null, job_title: 'Senior Hematology Consultant', department: 'Oncology', system_role: 'DOCTOR', hire_date: '2016-01-20', is_active: true },
  { staff_id: 5, person_id: 5, hospital_id: 5, ward_id: 12, supervisor_staff_id: null, job_title: 'Chief of Critical Care', department: 'Emergency Medicine', system_role: 'DOCTOR', hire_date: '2011-11-01', is_active: true },
  { staff_id: 6, person_id: 6, hospital_id: 1, ward_id: 2, supervisor_staff_id: 1, job_title: 'Senior Trauma Surgeon', department: 'Emergency Care', system_role: 'DOCTOR', hire_date: '2018-04-12', is_active: true },
  { staff_id: 7, person_id: 7, hospital_id: 1, ward_id: 1, supervisor_staff_id: 1, job_title: 'Lead Blood Bank Technologist', department: 'Blood Bank', system_role: 'LAB_TECHNICIAN', hire_date: '2019-07-01', is_active: true },
  { staff_id: 8, person_id: 8, hospital_id: 2, ward_id: 6, supervisor_staff_id: 2, job_title: 'Transplant Coordination Nurse', department: 'Critical Care', system_role: 'NURSE', hire_date: '2020-02-15', is_active: true },
  { staff_id: 9, person_id: 9, hospital_id: 3, ward_id: 9, supervisor_staff_id: 3, job_title: 'Organ Procurement Officer', department: 'Transplantation', system_role: 'INVENTORY_COORDINATOR', hire_date: '2021-05-18', is_active: true },
  { staff_id: 10, person_id: 10, hospital_id: 4, ward_id: 11, supervisor_staff_id: 4, job_title: 'Senior Blood Safety Officer', department: 'Pathology', system_role: 'LAB_TECHNICIAN', hire_date: '2017-08-25', is_active: true },
];

const initialDonors = [
  { donor_id: 1, person_id: 11, donor_type: 'BOTH', blood_group: 'O-', registration_date: '2022-01-10', availability_status: 'AVAILABLE', last_donation_date: '2026-08-15', deferral_reason: null, medical_history_notes: 'Universal blood donor. Registered kidney donor.' },
  { donor_id: 2, person_id: 12, donor_type: 'BLOOD', blood_group: 'A+', registration_date: '2021-03-22', availability_status: 'AVAILABLE', last_donation_date: '2026-09-10', deferral_reason: null, medical_history_notes: 'Regular voluntary donor. Hemoglobin normal.' },
  { donor_id: 3, person_id: 13, donor_type: 'ORGAN', blood_group: 'B+', registration_date: '2023-05-18', availability_status: 'AVAILABLE', last_donation_date: null, deferral_reason: null, medical_history_notes: 'Pledged liver donor. HLA typing completed.' },
  { donor_id: 4, person_id: 14, donor_type: 'BOTH', blood_group: 'AB+', registration_date: '2022-07-09', availability_status: 'AVAILABLE', last_donation_date: '2026-10-02', deferral_reason: null, medical_history_notes: 'Universal recipient. Whole blood and cornea pledged.' },
  { donor_id: 5, person_id: 15, donor_type: 'BLOOD', blood_group: 'O+', registration_date: '2020-11-14', availability_status: 'AVAILABLE', last_donation_date: '2026-07-20', deferral_reason: null, medical_history_notes: 'Platelet apheresis donor.' },
  { donor_id: 6, person_id: 16, donor_type: 'BLOOD', blood_group: 'A-', registration_date: '2023-02-04', availability_status: 'AVAILABLE', last_donation_date: '2026-08-28', deferral_reason: null, medical_history_notes: 'Rare A- blood donor.' },
  { donor_id: 7, person_id: 17, donor_type: 'ORGAN', blood_group: 'B-', registration_date: '2021-09-30', availability_status: 'AVAILABLE', last_donation_date: null, deferral_reason: null, medical_history_notes: 'Pledged kidney and heart donor.' },
  { donor_id: 8, person_id: 18, donor_type: 'BOTH', blood_group: 'AB-', registration_date: '2024-01-15', availability_status: 'AVAILABLE', last_donation_date: '2026-09-25', deferral_reason: null, medical_history_notes: 'Rare AB- donor. Pledged tissues.' },
  { donor_id: 9, person_id: 19, donor_type: 'BLOOD', blood_group: 'O+', registration_date: '2022-06-11', availability_status: 'DEFERRED', last_donation_date: '2026-03-10', deferral_reason: 'Temporary antibiotic therapy', medical_history_notes: 'Eligible after November 2026.' },
  { donor_id: 10, person_id: 20, donor_type: 'BLOOD', blood_group: 'A+', registration_date: '2023-08-19', availability_status: 'AVAILABLE', last_donation_date: '2026-10-14', deferral_reason: null, medical_history_notes: 'Regular campus blood drive participant.' },
  { donor_id: 11, person_id: 21, donor_type: 'ORGAN', blood_group: 'B+', registration_date: '2022-12-05', availability_status: 'AVAILABLE', last_donation_date: null, deferral_reason: null, medical_history_notes: 'Organ donor pledge for lung and kidney.' },
  { donor_id: 12, person_id: 22, donor_type: 'BOTH', blood_group: 'O-', registration_date: '2024-04-18', availability_status: 'AVAILABLE', last_donation_date: '2026-09-01', deferral_reason: null, medical_history_notes: 'Universal donor, registered for organ and blood network.' },
];

const initialPatients = [
  { patient_id: 1, person_id: 23, hospital_id: 1, ward_id: 1, attending_doctor_id: 1, admission_date: '2026-10-25', discharge_date: null, medical_status: 'CRITICAL', medical_notes: 'Severe acute coronary syndrome. Requires packed RBC support.' },
  { patient_id: 2, person_id: 24, hospital_id: 2, ward_id: 5, attending_doctor_id: 2, admission_date: '2026-10-28', discharge_date: null, medical_status: 'CRITICAL', medical_notes: 'Post-partum hemorrhage requiring immediate blood transfusion.' },
  { patient_id: 3, person_id: 25, hospital_id: 3, ward_id: 8, attending_doctor_id: 3, admission_date: '2026-10-30', discharge_date: null, medical_status: 'CRITICAL', medical_notes: 'End-stage renal disease. On priority waiting list for kidney transplant.' },
  { patient_id: 4, person_id: 26, hospital_id: 4, ward_id: 10, attending_doctor_id: 4, admission_date: '2026-10-20', discharge_date: null, medical_status: 'STABLE', medical_notes: 'Acute myeloid leukemia undergoing chemotherapy. Needs platelet transfusions.' },
  { patient_id: 5, person_id: 27, hospital_id: 5, ward_id: 12, attending_doctor_id: 5, admission_date: '2026-10-29', discharge_date: null, medical_status: 'CRITICAL', medical_notes: 'Severe multitrauma from traffic accident. Emergency surgery planned.' },
  { patient_id: 6, person_id: 28, hospital_id: 1, ward_id: 2, attending_doctor_id: 6, admission_date: '2026-11-01', discharge_date: null, medical_status: 'CRITICAL', medical_notes: 'Ruptured aortic aneurysm. Urgent O- or A- blood required.' },
  { patient_id: 7, person_id: 29, hospital_id: 4, ward_id: 11, attending_doctor_id: 4, admission_date: '2026-10-18', discharge_date: null, medical_status: 'STABLE', medical_notes: 'Chronic aplastic anemia. Scheduled weekly transfusions.' },
  { patient_id: 8, person_id: 30, hospital_id: 2, ward_id: 7, attending_doctor_id: 2, admission_date: '2026-10-15', discharge_date: null, medical_status: 'STABLE', medical_notes: 'Decompensated cirrhosis. Awaiting potential liver transplant match.' },
  { patient_id: 9, person_id: 31, hospital_id: 3, ward_id: 9, attending_doctor_id: 3, admission_date: '2026-11-02', discharge_date: null, medical_status: 'STABLE', medical_notes: 'Elective orthopedic surgery planned. Type B+ blood cross-match requested.' },
  { patient_id: 10, person_id: 32, hospital_id: 1, ward_id: 4, attending_doctor_id: 6, admission_date: '2026-10-22', discharge_date: null, medical_status: 'RECOVERING', medical_notes: 'Post laparoscopic cholecystectomy recovery.' },
  { patient_id: 11, person_id: 33, hospital_id: 5, ward_id: 12, attending_doctor_id: 5, admission_date: '2026-10-10', discharge_date: '2026-10-28', medical_status: 'DISCHARGED', medical_notes: 'Successfully treated for bleeding ulcer, discharged in stable condition.' },
  { patient_id: 12, person_id: 34, hospital_id: 2, ward_id: 6, attending_doctor_id: 2, admission_date: '2026-11-03', discharge_date: null, medical_status: 'CRITICAL', medical_notes: 'Septic shock with severe coagulopathy. Urgent plasma and whole blood needed.' },
];

const initialCamps = [
  { camp_id: 1, camp_name: 'AIIMS National Youth Blood Drive', organizer: 'Red Cross India & AIIMS', hospital_id: 1, location: 'Auditorium Complex, AIIMS Campus', city: 'New Delhi', start_date: '2026-08-14 09:00:00', end_date: '2026-08-16 18:00:00', capacity: 300, camp_status: 'COMPLETED', contact_phone: '+91-11-26588500' },
  { camp_id: 2, camp_name: 'Apollo LifeStream City Camp', organizer: 'Rotary Club Chennai & Apollo', hospital_id: 2, location: 'Marina Beach Community Hall', city: 'Chennai', start_date: '2026-09-08 08:30:00', end_date: '2026-09-10 17:30:00', capacity: 250, camp_status: 'COMPLETED', contact_phone: '+91-44-28290200' },
  { camp_id: 3, camp_name: 'Fortis Corporate Blood & Organ Drive', organizer: 'DLF Cybercity & Fortis', hospital_id: 3, location: 'Cyber Hub Amphitheatre', city: 'Gurugram', start_date: '2026-11-15 09:00:00', end_date: '2026-11-17 18:00:00', capacity: 400, camp_status: 'SCHEDULED', contact_phone: '+91-124-4921021' },
  { camp_id: 4, camp_name: 'Tata Memorial World Blood Day Drive', organizer: 'Lions Club Mumbai & Tata Memorial', hospital_id: 4, location: 'Shivaji Park Ground', city: 'Mumbai', start_date: '2026-10-01 08:00:00', end_date: '2026-10-03 19:00:00', capacity: 350, camp_status: 'COMPLETED', contact_phone: '+91-22-24177000' },
];

const initialCampRegistrations = [
  { registration_id: 1, camp_id: 1, donor_id: 1, registration_time: '2026-08-10 11:30:00', attended: true, units_donated: 1 },
  { registration_id: 2, camp_id: 1, donor_id: 2, registration_time: '2026-08-11 14:15:00', attended: true, units_donated: 1 },
  { registration_id: 3, camp_id: 1, donor_id: 6, registration_time: '2026-08-12 16:40:00', attended: true, units_donated: 1 },
  { registration_id: 4, camp_id: 2, donor_id: 4, registration_time: '2026-09-05 09:20:00', attended: true, units_donated: 1 },
  { registration_id: 5, camp_id: 2, donor_id: 5, registration_time: '2026-09-06 10:50:00', attended: true, units_donated: 1 },
  { registration_id: 6, camp_id: 2, donor_id: 8, registration_time: '2026-09-07 15:30:00', attended: true, units_donated: 1 },
  { registration_id: 7, camp_id: 3, donor_id: 10, registration_time: '2026-11-01 12:00:00', attended: false, units_donated: 0 },
  { registration_id: 8, camp_id: 3, donor_id: 12, registration_time: '2026-11-02 14:45:00', attended: false, units_donated: 0 },
  { registration_id: 9, camp_id: 4, donor_id: 2, registration_time: '2026-09-28 17:10:00', attended: true, units_donated: 1 },
  { registration_id: 10, camp_id: 4, donor_id: 4, registration_time: '2026-09-29 11:25:00', attended: true, units_donated: 1 },
];

const initialDonations = [
  { donation_id: 1, donor_id: 1, donation_camp_id: 1, hospital_id: 1, recorded_by_staff_id: 7, donation_date: '2026-08-15', quantity_ml: 450, hemoglobin_level: 14.5, screening_status: 'PASSED', remarks: 'Clean collection, universal O- unit' },
  { donation_id: 2, donor_id: 2, donation_camp_id: 1, hospital_id: 1, recorded_by_staff_id: 7, donation_date: '2026-09-10', quantity_ml: 450, hemoglobin_level: 13.8, screening_status: 'PASSED', remarks: 'Good volunteer health' },
  { donation_id: 3, donor_id: 4, donation_camp_id: 2, hospital_id: 2, recorded_by_staff_id: 8, donation_date: '2026-10-02', quantity_ml: 450, hemoglobin_level: 15.0, screening_status: 'PASSED', remarks: 'Component separated into platelets and plasma' },
  { donation_id: 4, donor_id: 5, donation_camp_id: 2, hospital_id: 2, recorded_by_staff_id: 8, donation_date: '2026-07-20', quantity_ml: 450, hemoglobin_level: 14.2, screening_status: 'PASSED', remarks: 'Whole blood unit collected' },
  { donation_id: 5, donor_id: 6, donation_camp_id: 1, hospital_id: 1, recorded_by_staff_id: 7, donation_date: '2026-08-28', quantity_ml: 400, hemoglobin_level: 13.0, screening_status: 'PASSED', remarks: 'Rare A- blood safely harvested' },
  { donation_id: 6, donor_id: 8, donation_camp_id: 2, hospital_id: 2, recorded_by_staff_id: 8, donation_date: '2026-09-25', quantity_ml: 450, hemoglobin_level: 14.8, screening_status: 'PASSED', remarks: 'AB- unit safely stored' },
  { donation_id: 7, donor_id: 10, donation_camp_id: 4, hospital_id: 4, recorded_by_staff_id: 10, donation_date: '2026-10-14', quantity_ml: 450, hemoglobin_level: 13.5, screening_status: 'PASSED', remarks: 'Processed at Tata Memorial blood bank' },
  { donation_id: 8, donor_id: 12, donation_camp_id: 1, hospital_id: 1, recorded_by_staff_id: 7, donation_date: '2026-09-01', quantity_ml: 450, hemoglobin_level: 14.0, screening_status: 'PASSED', remarks: 'Universal O- whole blood unit' },
  { donation_id: 9, donor_id: 2, donation_camp_id: null, hospital_id: 1, recorded_by_staff_id: 7, donation_date: '2026-10-18', quantity_ml: 450, hemoglobin_level: 14.1, screening_status: 'PASSED', remarks: 'In-hospital voluntary donation' },
  { donation_id: 10, donor_id: 4, donation_camp_id: null, hospital_id: 3, recorded_by_staff_id: 9, donation_date: '2026-10-24', quantity_ml: 450, hemoglobin_level: 15.2, screening_status: 'PASSED', remarks: 'In-hospital emergency replacement donation' },
  { donation_id: 11, donor_id: 5, donation_camp_id: null, hospital_id: 5, recorded_by_staff_id: 5, donation_date: '2026-10-27', quantity_ml: 450, hemoglobin_level: 14.6, screening_status: 'PASSED', remarks: 'Routine replacement donation at Manipal' },
];

const initialBloodUnits = [
  { unit_id: 1, donation_id: 1, donor_id: 1, hospital_id: 1, blood_group: 'O-', component_type: 'RBC', donation_date: '2026-10-10', expiry_date: '2026-11-21', storage_status: 'AVAILABLE', storage_location: 'AIIMS Cold Room 1 - Rack A1' },
  { unit_id: 2, donation_id: 1, donor_id: 1, hospital_id: 1, blood_group: 'O-', component_type: 'PLASMA', donation_date: '2026-10-10', expiry_date: '2027-10-10', storage_status: 'AVAILABLE', storage_location: 'AIIMS Ultra-Freezer - Rack P1' },
  { unit_id: 3, donation_id: 2, donor_id: 2, hospital_id: 1, blood_group: 'A+', component_type: 'RBC', donation_date: '2026-10-15', expiry_date: '2026-11-09', storage_status: 'AVAILABLE', storage_location: 'AIIMS Cold Room 1 - Rack A2' },
  { unit_id: 4, donation_id: 2, donor_id: 2, hospital_id: 1, blood_group: 'A+', component_type: 'PLATELETS', donation_date: '2026-11-02', expiry_date: '2026-11-07', storage_status: 'AVAILABLE', storage_location: 'AIIMS Agitator 1' },
  { unit_id: 5, donation_id: 5, donor_id: 6, hospital_id: 1, blood_group: 'A-', component_type: 'WHOLE_BLOOD', donation_date: '2026-10-18', expiry_date: '2026-11-12', storage_status: 'AVAILABLE', storage_location: 'AIIMS Cold Room 2 - Rack B1' },
  { unit_id: 6, donation_id: 8, donor_id: 12, hospital_id: 1, blood_group: 'O-', component_type: 'WHOLE_BLOOD', donation_date: '2026-10-01', expiry_date: '2026-11-04', storage_status: 'EXPIRED', storage_location: 'AIIMS Quarantine Bin' },
  { unit_id: 7, donation_id: 9, donor_id: 2, hospital_id: 1, blood_group: 'A+', component_type: 'WHOLE_BLOOD', donation_date: '2026-10-18', expiry_date: '2026-11-22', storage_status: 'AVAILABLE', storage_location: 'AIIMS Cold Room 1 - Rack A3' },

  { unit_id: 8, donation_id: 3, donor_id: 4, hospital_id: 2, blood_group: 'AB+', component_type: 'PLATELETS', donation_date: '2026-11-01', expiry_date: '2026-11-06', storage_status: 'AVAILABLE', storage_location: 'Apollo Platelet Shaker A' },
  { unit_id: 9, donation_id: 3, donor_id: 4, hospital_id: 2, blood_group: 'AB+', component_type: 'PLASMA', donation_date: '2026-10-02', expiry_date: '2027-10-02', storage_status: 'AVAILABLE', storage_location: 'Apollo Deep Freeze 2' },
  { unit_id: 10, donation_id: 4, donor_id: 5, hospital_id: 2, blood_group: 'O+', component_type: 'RBC', donation_date: '2026-10-20', expiry_date: '2026-12-01', storage_status: 'AVAILABLE', storage_location: 'Apollo Cold Storage 1 - Bay 4' },
  { unit_id: 11, donation_id: 4, donor_id: 5, hospital_id: 2, blood_group: 'O+', component_type: 'WHOLE_BLOOD', donation_date: '2026-10-05', expiry_date: '2026-11-09', storage_status: 'AVAILABLE', storage_location: 'Apollo Cold Storage 1 - Bay 5' },
  { unit_id: 12, donation_id: 6, donor_id: 8, hospital_id: 2, blood_group: 'AB-', component_type: 'RBC', donation_date: '2026-10-12', expiry_date: '2026-11-23', storage_status: 'AVAILABLE', storage_location: 'Apollo Rare Blood Vault - R1' },

  { unit_id: 13, donation_id: 10, donor_id: 4, hospital_id: 3, blood_group: 'AB+', component_type: 'WHOLE_BLOOD', donation_date: '2026-10-24', expiry_date: '2026-11-28', storage_status: 'AVAILABLE', storage_location: 'Fortis Blood Bank Main Bay' },
  { unit_id: 14, donation_id: 10, donor_id: 4, hospital_id: 3, blood_group: 'AB+', component_type: 'PLATELETS', donation_date: '2026-11-02', expiry_date: '2026-11-07', storage_status: 'AVAILABLE', storage_location: 'Fortis Agitator Bay 2' },
  { unit_id: 15, donation_id: 1, donor_id: 1, hospital_id: 3, blood_group: 'O-', component_type: 'RBC', donation_date: '2026-10-14', expiry_date: '2026-11-25', storage_status: 'ALLOCATED', storage_location: 'Fortis Reserve Unit 1' },

  { unit_id: 16, donation_id: 7, donor_id: 10, hospital_id: 4, blood_group: 'A+', component_type: 'PLATELETS', donation_date: '2026-11-03', expiry_date: '2026-11-08', storage_status: 'AVAILABLE', storage_location: 'Tata Platelet Vault A' },
  { unit_id: 17, donation_id: 7, donor_id: 10, hospital_id: 4, blood_group: 'A+', component_type: 'RBC', donation_date: '2026-10-14', expiry_date: '2026-11-25', storage_status: 'AVAILABLE', storage_location: 'Tata Cold Storage Bay 2' },
  { unit_id: 18, donation_id: 7, donor_id: 10, hospital_id: 4, blood_group: 'A+', component_type: 'CRYO', donation_date: '2026-10-14', expiry_date: '2027-10-14', storage_status: 'AVAILABLE', storage_location: 'Tata Cryo Vault C1' },

  { unit_id: 19, donation_id: 11, donor_id: 5, hospital_id: 5, blood_group: 'O+', component_type: 'RBC', donation_date: '2026-10-27', expiry_date: '2026-12-08', storage_status: 'AVAILABLE', storage_location: 'Manipal Bay 101' },
  { unit_id: 20, donation_id: 11, donor_id: 5, hospital_id: 5, blood_group: 'O+', component_type: 'WHOLE_BLOOD', donation_date: '2026-10-27', expiry_date: '2026-12-01', storage_status: 'AVAILABLE', storage_location: 'Manipal Bay 102' },
  { unit_id: 21, donation_id: 5, donor_id: 6, hospital_id: 5, blood_group: 'A-', component_type: 'RBC', donation_date: '2026-09-15', expiry_date: '2026-10-27', storage_status: 'EXPIRED', storage_location: 'Manipal Disposal Rack' },
];

const initialBloodRequests = [
  { request_id: 1, patient_id: 1, hospital_id: 1, blood_group: 'O+', component_type: 'RBC', units_required: 2, urgency_level: 'CRITICAL', request_date: '2026-11-05 06:30:00', required_by_date: '2026-11-05 12:00:00', request_status: 'PENDING', clinical_indication: 'Active cardiac surgery arterial bleeding' },
  { request_id: 2, patient_id: 6, hospital_id: 1, blood_group: 'A-', component_type: 'WHOLE_BLOOD', units_required: 2, urgency_level: 'CRITICAL', request_date: '2026-11-05 07:15:00', required_by_date: '2026-11-05 13:00:00', request_status: 'PENDING', clinical_indication: 'Emergency ruptured aortic aneurysm repair' },
  { request_id: 3, patient_id: 10, hospital_id: 1, blood_group: 'A+', component_type: 'RBC', units_required: 1, urgency_level: 'ROUTINE', request_date: '2026-11-04 10:00:00', required_by_date: '2026-11-08 18:00:00', request_status: 'PENDING', clinical_indication: 'Elective cholecystectomy standby' },
  { request_id: 4, patient_id: 2, hospital_id: 2, blood_group: 'A+', component_type: 'WHOLE_BLOOD', units_required: 3, urgency_level: 'CRITICAL', request_date: '2026-11-05 05:45:00', required_by_date: '2026-11-05 10:00:00', request_status: 'PARTIALLY_FULFILLED', clinical_indication: 'Acute post-partum hemorrhage' },
  { request_id: 5, patient_id: 8, hospital_id: 2, blood_group: 'AB-', component_type: 'RBC', units_required: 1, urgency_level: 'HIGH', request_date: '2026-11-04 14:20:00', required_by_date: '2026-11-06 18:00:00', request_status: 'PENDING', clinical_indication: 'Cirrhosis gastrointestinal bleeding episode' },
  { request_id: 6, patient_id: 3, hospital_id: 3, blood_group: 'B-', component_type: 'RBC', units_required: 2, urgency_level: 'HIGH', request_date: '2026-11-03 16:00:00', required_by_date: '2026-11-07 12:00:00', request_status: 'PENDING', clinical_indication: 'Renal pre-transplant anemia management' },
  { request_id: 7, patient_id: 9, hospital_id: 3, blood_group: 'B+', component_type: 'WHOLE_BLOOD', units_required: 1, urgency_level: 'MEDIUM', request_date: '2026-11-04 11:30:00', required_by_date: '2026-11-09 17:00:00', request_status: 'PENDING', clinical_indication: 'Complex joint reconstruction surgery' },
  { request_id: 8, patient_id: 4, hospital_id: 4, blood_group: 'AB+', component_type: 'PLATELETS', units_required: 2, urgency_level: 'CRITICAL', request_date: '2026-11-05 08:00:00', required_by_date: '2026-11-05 14:00:00', request_status: 'PENDING', clinical_indication: 'Leukemia severe thrombocytopenia (< 15,000 count)' },
  { request_id: 9, patient_id: 7, hospital_id: 4, blood_group: 'B+', component_type: 'RBC', units_required: 1, urgency_level: 'ROUTINE', request_date: '2026-11-02 09:00:00', required_by_date: '2026-11-10 12:00:00', request_status: 'FULFILLED', clinical_indication: 'Scheduled aplastic anemia maintenance transfusion' },
  { request_id: 10, patient_id: 5, hospital_id: 5, blood_group: 'O-', component_type: 'RBC', units_required: 3, urgency_level: 'CRITICAL', request_date: '2026-11-05 04:30:00', required_by_date: '2026-11-05 09:30:00', request_status: 'PENDING', clinical_indication: 'Emergency poly-trauma hemorrhagic shock' },
];

const initialBloodAllocations = [
  { allocation_id: 1, request_id: 4, unit_id: 11, allocated_by_staff_id: 8, allocated_date: '2026-11-05 07:00:00', allocation_status: 'ALLOCATED', notes: 'Unit 11 allocated for acute PPH patient 2 at Apollo.' },
  { allocation_id: 2, request_id: 6, unit_id: 15, allocated_by_staff_id: 9, allocated_date: '2026-11-04 18:00:00', allocation_status: 'ALLOCATED', notes: 'Universal O- RBC unit 15 allocated to B- patient 3 at Fortis.' },
];

const initialOrganDonations = [
  { organ_donation_id: 1, donor_id: 1, organ_type: 'KIDNEY', donation_status: 'PLEDGED', registration_date: '2022-01-15', hla_type: 'HLA-A2, B7, DR4', medical_clearance: true, clinical_notes: 'Live related donor candidate. Normal renal function, creatinine 0.8 mg/dL.' },
  { organ_donation_id: 2, donor_id: 3, organ_type: 'LIVER', donation_status: 'PLEDGED', registration_date: '2023-05-20', hla_type: 'HLA-A1, B8, DR3', medical_clearance: true, clinical_notes: 'Pledged deceased donor donation. Liver ultrasound normal.' },
  { organ_donation_id: 3, donor_id: 4, organ_type: 'CORNEA', donation_status: 'PLEDGED', registration_date: '2022-07-12', hla_type: 'HLA-NONSPEC', medical_clearance: true, clinical_notes: 'Bilateral cornea donation pledged upon demise.' },
  { organ_donation_id: 4, donor_id: 7, organ_type: 'HEART', donation_status: 'MATCH_PENDING', registration_date: '2021-10-02', hla_type: 'HLA-A3, B14, DR2', medical_clearance: true, clinical_notes: 'Registered brain-dead organ donation protocol candidate.' },
  { organ_donation_id: 5, donor_id: 7, organ_type: 'KIDNEY', donation_status: 'MATCH_PENDING', registration_date: '2021-10-02', hla_type: 'HLA-A3, B14, DR2', medical_clearance: true, clinical_notes: 'Registered dual kidney donor candidate.' },
  { organ_donation_id: 6, donor_id: 11, organ_type: 'LUNG', donation_status: 'PLEDGED', registration_date: '2022-12-10', hla_type: 'HLA-A11, B35, DR7', medical_clearance: true, clinical_notes: 'Living lobar lung donation candidate, non-smoker.' },
  { organ_donation_id: 7, donor_id: 12, organ_type: 'KIDNEY', donation_status: 'PLEDGED', registration_date: '2024-04-20', hla_type: 'HLA-A24, B51, DR1', medical_clearance: true, clinical_notes: 'Pledged universal donor kidney.' },
];

const initialOrganRequests = [
  { organ_request_id: 1, patient_id: 3, hospital_id: 3, organ_type: 'KIDNEY', recipient_blood_group: 'B-', urgency_level: 'CRITICAL', request_date: '2026-05-10', request_status: 'WAITING', hla_type: 'HLA-A2, B7, DR4', medical_urgency_score: 92 },
  { organ_request_id: 2, patient_id: 8, hospital_id: 2, organ_type: 'LIVER', recipient_blood_group: 'AB-', urgency_level: 'CRITICAL', request_date: '2026-06-15', request_status: 'WAITING', hla_type: 'HLA-A1, B8, DR3', medical_urgency_score: 95 },
  { organ_request_id: 3, patient_id: 1, hospital_id: 1, organ_type: 'HEART', recipient_blood_group: 'O+', urgency_level: 'HIGH', request_date: '2026-08-01', request_status: 'WAITING', hla_type: 'HLA-A3, B14, DR2', medical_urgency_score: 88 },
  { organ_request_id: 4, patient_id: 5, hospital_id: 5, organ_type: 'KIDNEY', recipient_blood_group: 'O-', urgency_level: 'CRITICAL', request_date: '2026-09-12', request_status: 'WAITING', hla_type: 'HLA-A24, B51, DR1', medical_urgency_score: 89 },
  { organ_request_id: 5, patient_id: 12, hospital_id: 2, organ_type: 'LIVER', recipient_blood_group: 'O-', urgency_level: 'HIGH', request_date: '2026-10-05', request_status: 'WAITING', hla_type: 'HLA-A1, B57, DR15', medical_urgency_score: 78 },
];

const initialOrganMatches = [
  { match_id: 1, organ_donation_id: 1, organ_request_id: 1, match_date: '2026-10-28 14:00:00', compatibility_status: 'HIGH_COMPATIBILITY', verification_status: 'PENDING_VERIFICATION', match_score: 94.50, medical_notes: 'Illustrative Match: 5/6 HLA match. Negative cross-match. Subject to clinical ethics committee verification.', verified_by_staff_id: null, verification_date: null },
  { match_id: 2, organ_donation_id: 2, organ_request_id: 2, match_date: '2026-10-29 11:30:00', compatibility_status: 'HIGH_COMPATIBILITY', verification_status: 'VERIFIED_BY_COMMITTEE', match_score: 91.00, medical_notes: 'Approved by Medical Board for clinical workup. Crossmatch completed.', verified_by_staff_id: 3, verification_date: '2026-11-01 16:30:00' },
  { match_id: 3, organ_donation_id: 4, organ_request_id: 3, match_date: '2026-11-02 09:15:00', compatibility_status: 'POTENTIAL_MATCH', verification_status: 'PENDING_VERIFICATION', match_score: 86.00, medical_notes: 'Potential cardiac match identified. Donor brain-stem reflex tests underway.', verified_by_staff_id: null, verification_date: null },
  { match_id: 4, organ_donation_id: 7, organ_request_id: 4, match_date: '2026-11-03 15:45:00', compatibility_status: 'HIGH_COMPATIBILITY', verification_status: 'PENDING_VERIFICATION', match_score: 96.00, medical_notes: 'Universal donor match with identical HLA locus markers. Highest priority candidate.', verified_by_staff_id: null, verification_date: null },
];

const initialUsers = [
  { user_id: 1, person_id: 1, username: 'admin', email: 'vikram.sharma@aiims.edu', role: 'ADMIN', is_active: true },
  { user_id: 2, person_id: 2, username: 'staff_priya', email: 'priya.sundaram@apollo.org', role: 'STAFF', is_active: true },
  { user_id: 3, person_id: 7, username: 'staff_arun', email: 'arun.verma@aiims.edu', role: 'STAFF', is_active: true },
  { user_id: 4, person_id: 11, username: 'donor_rahul', email: 'rahul.deshmukh@gmail.com', role: 'DONOR', is_active: true },
  { user_id: 5, person_id: 12, username: 'donor_ananya', email: 'ananya.iyer@gmail.com', role: 'DONOR', is_active: true },
  { user_id: 6, person_id: 23, username: 'patient_aditya', email: 'aditya.mehta@outlook.com', role: 'PATIENT', is_active: true },
  { user_id: 7, person_id: 24, username: 'patient_lakshmi', email: 'lakshmi.n@outlook.com', role: 'PATIENT', is_active: true },
];

module.exports = {
  initialCompatibility,
  initialHospitals,
  initialWards,
  initialPersons,
  initialStaff,
  initialDonors,
  initialPatients,
  initialCamps,
  initialCampRegistrations,
  initialDonations,
  initialBloodUnits,
  initialBloodRequests,
  initialBloodAllocations,
  initialOrganDonations,
  initialOrganRequests,
  initialOrganMatches,
  initialUsers,
};

