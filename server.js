const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS allows the React app, which runs on another port during development,
// to call this API from the browser. localhost and 127.0.0.1 are different
// browser origins, so the local defaults allow both.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

// These middleware functions parse JSON and form bodies before routes read req.body.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded CV files are served from /uploads/<filename> so employers can open them.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health checks are useful for confirming both Express and the database are reachable.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'unavailable', error: error.message });
  }
});

// Each group of API endpoints is mounted under a clear route prefix.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Any request that reached this point did not match a defined route.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler. Multer upload errors and normal server errors are returned as JSON.
app.use((error, req, res, next) => {
  if (error.name === 'MulterError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.message && error.message.includes('Only PDF')) {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: 'Server error', error: error.message });
});

// Start the HTTP server after all middleware and routes have been registered.
app.listen(PORT, () => {
  console.log(`JobConnect API running on port ${PORT}`);
});
