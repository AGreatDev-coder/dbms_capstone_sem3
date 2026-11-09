/**
 * LIFE-LINK Blood Bank & Organ Donor Network Management System
 * Central Express.js Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const donorRoutes = require('./routes/donor.routes');
const patientRoutes = require('./routes/patient.routes');
const bloodBankRoutes = require('./routes/bloodBank.routes');
const bloodRequestRoutes = require('./routes/bloodRequest.routes');
const organRoutes = require('./routes/organ.routes');
const campRoutes = require('./routes/camp.routes');
const sqlLabRoutes = require('./routes/sqlLab.routes');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Serve database artifacts (EER Diagram & Schema)
app.use('/database-artifacts', express.static(path.join(__dirname, '..', 'database')));
app.use('/api/database-artifacts', express.static(path.join(__dirname, '..', 'database')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/blood-bank', bloodBankRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/organ', organRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/sql-lab', sqlLabRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'LIFE-LINK DBMS Capstone Platform',
    version: '1.0.0',
    mysql_connected: db.isMySQLConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log('==================================================');
    console.log(` LIFE-LINK Backend API Server running on port ${PORT}`);
    console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
    console.log('==================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('\n==================================================');
      console.error(` [Server Error]: Port ${PORT} is already in use!`);
      console.error(' Reason (macOS): Apple AirPlay Receiver uses port 5000.');
      console.error(' Quick Fix:');
      console.error('   1. Open Mac System Settings');
      console.error('   2. Go to General > AirDrop & AirPlay');
      console.error('   3. Turn OFF "AirPlay Receiver"');
      console.error('==================================================\n');
      process.exit(1);
    }
  });
}

module.exports = app;

