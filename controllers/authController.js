const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Public registration intentionally allows only normal users.
// Admin users should be created by seed data or a trusted database/admin process.
const allowedRoles = new Set(['employer', 'job_seeker']);

// JWTs store the minimum identity needed by the API: user id and role.
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// Never return the password hash to the frontend.
const publicUserFields = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at,
  updated_at: user.updated_at
});

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Basic backend validation protects the API even if a user bypasses the React form.
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ message: 'Registration role must be employer or job_seeker' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Transactions keep user creation and profile creation together.
  // If one insert fails, the whole registration is rolled back.
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Email must be unique because it is used for login.
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // bcrypt hashes the password with a salt so plain text passwords are never stored.
    const hash = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, role, 'active']
    );

    // Create an empty role-specific profile so dashboards have a record to edit immediately.
    if (role === 'employer') {
      await connection.query(
        'INSERT INTO employer_profiles (user_id, company_name, company_description, industry, location, phone, website) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, `${name}'s Company`, '', '', '', '', '']
      );
    } else {
      await connection.query(
        'INSERT INTO job_seeker_profiles (user_id, phone, location, skills, education, experience_level, cv_file) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, '', '', '', '', '', null]
      );
    }

    // Log the user in immediately after successful registration.
    const [users] = await connection.query(
      'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    await connection.commit();
    res.status(201).json({ user: publicUserFields(users[0]), token: signToken(users[0]) });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Registration failed', error: error.message });
  } finally {
    connection.release();
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // The password column is needed here only so bcrypt can compare the submitted password.
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Inactive accounts cannot start a new session.
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    res.json({ user: publicUserFields(user), token: signToken(user) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const me = async (req, res) => {
  // req.user was loaded by the protect middleware.
  res.json({ user: req.user });
};

module.exports = { register, login, me };
