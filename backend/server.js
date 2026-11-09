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
  const startServer = (port) => {
    const server = app
      .listen(port, () => {
        console.log('==================================================');
        console.log(` LIFE-LINK Backend API Server running on port ${port}`);
        console.log(` Healthcheck: http://localhost:${port}/api/health`);
        console.log('==================================================');
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE' && Number(port) === 5000) {
          console.warn('\n[Server Notice]: Port 5000 is occupied by macOS AirPlay.');
          console.warn('Automatically switching to port 5001...\n');
          startServer(5001);
        } else {
          console.error(`\n[Server Error]: Port ${port} is unavailable (${err.message}).\n`);
          process.exit(1);
        }
      });
  };

  startServer(PORT || 5001);
}

module.exports = app;

