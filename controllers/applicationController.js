const pool = require('../config/db');

// Shared SELECT fragment for application views.
// It joins jobs, employer profiles, users, and seeker profiles so the UI can show useful context.
const applicationSelect = `
  SELECT applications.*, jobs.title AS job_title, jobs.location AS job_location,
         jobs.job_type, jobs.employer_id, employer_profiles.company_name,
         users.name AS job_seeker_name, users.email AS job_seeker_email,
         job_seeker_profiles.phone, job_seeker_profiles.location AS seeker_location,
         job_seeker_profiles.skills, job_seeker_profiles.education,
         job_seeker_profiles.experience_level
  FROM applications
  JOIN jobs ON jobs.id = applications.job_id
  LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
  JOIN users ON users.id = applications.job_seeker_id
  LEFT JOIN job_seeker_profiles ON job_seeker_profiles.user_id = applications.job_seeker_id
`;

const applyForJob = async (req, res) => {
  const { cover_letter } = req.body;
  const jobId = req.params.jobId;

  if (!cover_letter) {
    return res.status(400).json({ message: 'Cover letter is required' });
  }

  try {
    // Job seekers can apply only to jobs that exist and are currently open.
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [jobId]);
    if (!jobs.length || jobs[0].status !== 'open') {
      return res.status(404).json({ message: 'Open job not found' });
    }

    // The database also has a UNIQUE constraint, but this gives a friendlier API message.
    const [duplicate] = await pool.query(
      'SELECT id FROM applications WHERE job_id = ? AND job_seeker_id = ? LIMIT 1',
      [jobId, req.user.id]
    );
    if (duplicate.length) {
      return res.status(409).json({ message: 'You have already applied for this job' });
    }

    // Use the uploaded application CV if provided; otherwise use the profile CV.
    const [profiles] = await pool.query('SELECT cv_file FROM job_seeker_profiles WHERE user_id = ? LIMIT 1', [
      req.user.id
    ]);
    const cvFile = req.file ? req.file.filename : profiles[0] && profiles[0].cv_file;
    if (!cvFile) {
      return res.status(400).json({ message: 'Please upload a CV before applying' });
    }

    // New applications always start as Pending.
    const [result] = await pool.query(
      'INSERT INTO applications (job_id, job_seeker_id, cover_letter, cv_file, status) VALUES (?, ?, ?, ?, ?)',
      [jobId, req.user.id, cover_letter, cvFile, 'Pending']
    );

    const [rows] = await pool.query(`${applicationSelect} WHERE applications.id = ? LIMIT 1`, [
      result.insertId
    ]);
    res.status(201).json({ message: 'Application submitted', application: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not submit application', error: error.message });
  }
};

const myApplications = async (req, res) => {
  try {
    // The job_seeker_id filter enforces "my private records only."
    const [rows] = await pool.query(
      `${applicationSelect} WHERE applications.job_seeker_id = ? ORDER BY applications.applied_at DESC`,
      [req.user.id]
    );
    res.json({ applications: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load applications', error: error.message });
  }
};

const jobApplications = async (req, res) => {
  try {
    // First load the job owner so we can enforce employer ownership.
    const [jobs] = await pool.query('SELECT employer_id FROM jobs WHERE id = ? LIMIT 1', [req.params.jobId]);
    if (!jobs.length) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (req.user.role !== 'admin' && jobs[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only view applicants for your own jobs' });
    }

    const [rows] = await pool.query(
      `${applicationSelect} WHERE applications.job_id = ? ORDER BY applications.applied_at DESC`,
      [req.params.jobId]
    );
    res.json({ applications: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load job applications', error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Shortlisted', 'Rejected', 'Hired'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid application status' });
  }

  try {
    // Load joined application data so we can check the employer_id of the job.
    const [rows] = await pool.query(`${applicationSelect} WHERE applications.id = ? LIMIT 1`, [
      req.params.id
    ]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Application not found' });
    }
    // Employers can update only applications for jobs they posted; admins can update any.
    if (req.user.role !== 'admin' && rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update applicants for your own jobs' });
    }

    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await pool.query(`${applicationSelect} WHERE applications.id = ? LIMIT 1`, [
      req.params.id
    ]);
    res.json({ message: 'Application status updated', application: updated[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not update application status', error: error.message });
  }
};

module.exports = { applyForJob, myApplications, jobApplications, updateApplicationStatus };
