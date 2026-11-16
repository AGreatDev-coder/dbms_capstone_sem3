const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: 'lifelink_db',
      multipleStatements: true,
    });
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'college_demo_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(sql);
    console.log('College demo schema executed successfully.');
    const [students] = await conn.query('SELECT * FROM demo_college_student');
    console.log(`College students loaded: ${students.length}`);
    const [exams] = await conn.query('SELECT * FROM demo_college_exam');
    console.log(`College exams loaded: ${exams.length}`);
    await conn.end();
  } catch (err) {
    console.error('Error executing college schema:', err);
  }
})();
