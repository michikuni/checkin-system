const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employees');
const webauthnRoutes = require('./routes/webauthn');
const attendanceRoutes = require('./routes/attendance');
const errorHandler = require('./middleware/errorHandler');
const lanOnly = require('./middleware/lanOnly');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.WEBAUTHN_ORIGIN || 'https://checkin.office.local',
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(lanOnly);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/admin', adminRoutes);
app.use('/employees', employeeRoutes);
app.use('/webauthn', webauthnRoutes);
app.use('/attendance', attendanceRoutes);

app.use(errorHandler);

module.exports = app;
