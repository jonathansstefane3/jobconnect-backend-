const pool = require('../config/db');

// Shared SELECT fragment so job list and detail endpoints return consistent fields.
const jobSelect = `
  SELECT jobs.*, users.name AS employer_name, employer_profiles.company_name,
         employer_profiles.industry, employer_profiles.website
  FROM jobs
  JOIN users ON users.id = jobs.employer_id
  LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
`;

const listJobs = async (req, res) => {
  const { search, title, company, location, job_type, status } = req.query;
  const filters = [];
  const params = [];

  if (req.user && req.user.role === 'admin' && status) {
    // Admins can filter by status when using this controller through authenticated clients.
    filters.push('jobs.status = ?');
    params.push(status);
  } else {
    // Public browsing should show only open jobs.
    filters.push("jobs.status = 'open'");
  }

  if (search) {
    // A broad keyword search checks common fields job seekers expect.
    filters.push(`(
      jobs.title LIKE ? OR employer_profiles.company_name LIKE ? OR jobs.location LIKE ?
      OR jobs.job_type LIKE ? OR jobs.description LIKE ? OR jobs.requirements LIKE ?
    )`);
    const q = `%${search}%`;
    params.push(q, q, q, q, q, q);
  }

  if (title) {
    filters.push('jobs.title LIKE ?');
    params.push(`%${title}%`);
  }
  if (company) {
    filters.push('employer_profiles.company_name LIKE ?');
    params.push(`%${company}%`);
  }
  if (location) {
    filters.push('jobs.location LIKE ?');
    params.push(`%${location}%`);
  }
  if (job_type) {
    filters.push('jobs.job_type = ?');
    params.push(job_type);
  }

  try {
    const [rows] = await pool.query(
      `${jobSelect} WHERE ${filters.join(' AND ')} ORDER BY jobs.created_at DESC`,
      params
    );
    res.json({ jobs: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load jobs', error: error.message });
  }
};

const getJob = async (req, res) => {
  try {
    const [rows] = await pool.query(`${jobSelect} WHERE jobs.id = ? LIMIT 1`, [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ job: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not load job', error: error.message });
  }
};

const createJob = async (req, res) => {
  const {
    title,
    description,
    requirements,
    responsibilities,
    location,
    job_type,
    salary_range,
    deadline
  } = req.body;

  if (!title || !description || !location || !job_type || !deadline) {
    return res.status(400).json({
      message: 'Title, description, location, job type, and deadline are required'
    });
  }

  try {
    // employer_id comes from the JWT user, not from the request body.
    // That prevents one employer from posting as another employer.
    const [result] = await pool.query(
      `INSERT INTO jobs
        (employer_id, title, description, requirements, responsibilities, location, job_type, salary_range, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        req.user.id,
        title,
        description,
        requirements || '',
        responsibilities || '',
        location,
        job_type,
        salary_range || '',
        deadline
      ]
    );
    const [rows] = await pool.query(`${jobSelect} WHERE jobs.id = ? LIMIT 1`, [result.insertId]);
    res.status(201).json({ message: 'Job posted', job: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not create job', error: error.message });
  }
};

const employerJobs = async (req, res) => {
  try {
    // Employers can list only jobs where they are the owner.
    const [rows] = await pool.query(
      `${jobSelect} WHERE jobs.employer_id = ? ORDER BY jobs.created_at DESC`,
      [req.user.id]
    );
    res.json({ jobs: rows });
  } catch (error) {
    res.status(500).json({ message: 'Could not load employer jobs', error: error.message });
  }
};

const updateJob = async (req, res) => {
  const id = req.params.id;
  const fields = [
    'title',
    'description',
    'requirements',
    'responsibilities',
    'location',
    'job_type',
    'salary_range',
    'deadline',
    'status'
  ];
  const payload = {};
  fields.forEach((field) => {
    // Only fields in the allow-list can be updated.
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  });

  if (!Object.keys(payload).length) {
    return res.status(400).json({ message: 'No job fields provided' });
  }

  if (payload.status && !['open', 'closed'].includes(payload.status)) {
    return res.status(400).json({ message: 'Job status must be open or closed' });
  }

  try {
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (!jobs.length) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // Admins can moderate any job; employers can edit only their own jobs.
    if (req.user.role !== 'admin' && jobs[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own jobs' });
    }

    // Build the SET clause from the validated allow-list above.
    const assignments = Object.keys(payload).map((field) => `${field} = ?`);
    await pool.query(`UPDATE jobs SET ${assignments.join(', ')} WHERE id = ?`, [
      ...Object.values(payload),
      id
    ]);

    const [rows] = await pool.query(`${jobSelect} WHERE jobs.id = ? LIMIT 1`, [id]);
    res.json({ message: 'Job updated', job: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not update job', error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [req.params.id]);
    if (!jobs.length) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // Ownership check mirrors updateJob.
    if (req.user.role !== 'admin' && jobs[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own jobs' });
    }

    await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete job', error: error.message });
  }
};

module.exports = { listJobs, getJob, createJob, employerJobs, updateJob, deleteJob };
