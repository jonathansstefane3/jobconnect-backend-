const pool = require('../config/db');

const stats = async (req, res) => {
  try {
    // These separate count queries keep the dashboard simple and easy to read for students.
    const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [[employers]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'employer'");
    const [[seekers]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'job_seeker'");
    const [[jobs]] = await pool.query('SELECT COUNT(*) AS total FROM jobs');
    const [[openJobs]] = await pool.query("SELECT COUNT(*) AS total FROM jobs WHERE status = 'open'");
    const [[applications]] = await pool.query('SELECT COUNT(*) AS total FROM applications');
    res.json({
      stats: {
        users: users.total,
        employers: employers.total,
        job_seekers: seekers.total,
        jobs: jobs.total,
        open_jobs: openJobs.total,
        applications: applications.total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load stats', error: error.message });
  }
};

const users = async (req, res) => {
  try {
    // Admin user lists omit password hashes.
    const [rows] = await pool.query(
      'SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load users', error: error.message });
  }
};

const jobs = async (req, res) => {
  try {
    // Admins see both open and closed jobs for moderation.
    const [rows] = await pool.query(`
      SELECT jobs.*, users.name AS employer_name, employer_profiles.company_name
      FROM jobs
      JOIN users ON users.id = jobs.employer_id
      LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
      ORDER BY jobs.created_at DESC
    `);
    res.json({ jobs: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load jobs', error: error.message });
  }
};

const applications = async (req, res) => {
  try {
    // Joined data gives admins applicant, job, and company context in one request.
    const [rows] = await pool.query(`
      SELECT applications.*, jobs.title AS job_title, employer_profiles.company_name,
             users.name AS job_seeker_name, users.email AS job_seeker_email
      FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
      JOIN users ON users.id = applications.job_seeker_id
      ORDER BY applications.applied_at DESC
    `);
    res.json({ applications: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load applications', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or inactive' });
  }
  if (Number(req.params.id) === req.user.id) {
    // Prevent an admin from locking themselves out by mistake.
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  try {
    const [result] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update user status', error: error.message });
  }
};

module.exports = { stats, users, jobs, applications, updateUserStatus };
