const pool = require('../config/db');

const getProfile = async (req, res) => {
  try {
    // The same endpoint returns the correct profile table for the logged-in role.
    if (req.user.role === 'employer') {
      const [rows] = await pool.query('SELECT * FROM employer_profiles WHERE user_id = ? LIMIT 1', [
        req.user.id
      ]);
      return res.json({ profile: rows[0] || null });
    }

    if (req.user.role === 'job_seeker') {
      const [rows] = await pool.query('SELECT * FROM job_seeker_profiles WHERE user_id = ? LIMIT 1', [
        req.user.id
      ]);
      return res.json({ profile: rows[0] || null });
    }

    res.json({ profile: null });
  } catch (error) {
    res.status(500).json({ message: 'Could not load profile', error: error.message });
  }
};

const upsertEmployerProfile = async (req, res) => {
  const { company_name, company_description, industry, location, phone, website } = req.body;

  if (!company_name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    // ON DUPLICATE KEY UPDATE works because employer_profiles.user_id is UNIQUE.
    // It lets one endpoint handle both "create profile" and "update profile".
    await pool.query(
      `INSERT INTO employer_profiles
        (user_id, company_name, company_description, industry, location, phone, website)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        company_description = VALUES(company_description),
        industry = VALUES(industry),
        location = VALUES(location),
        phone = VALUES(phone),
        website = VALUES(website)`,
      [
        req.user.id,
        company_name,
        company_description || '',
        industry || '',
        location || '',
        phone || '',
        website || ''
      ]
    );

    const [rows] = await pool.query('SELECT * FROM employer_profiles WHERE user_id = ? LIMIT 1', [
      req.user.id
    ]);
    res.json({ message: 'Employer profile saved', profile: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not save employer profile', error: error.message });
  }
};

const upsertJobSeekerProfile = async (req, res) => {
  const { phone, location, skills, education, experience_level } = req.body;
  // Multer adds req.file when a new CV was uploaded.
  const cvFile = req.file ? req.file.filename : req.body.existing_cv_file || null;

  try {
    // If the user does not upload a new CV, keep the previous filename.
    const [existing] = await pool.query('SELECT cv_file FROM job_seeker_profiles WHERE user_id = ? LIMIT 1', [
      req.user.id
    ]);
    const nextCvFile = cvFile || (existing[0] && existing[0].cv_file) || null;

    // Same upsert pattern as employer profiles, but with CV support.
    await pool.query(
      `INSERT INTO job_seeker_profiles
        (user_id, phone, location, skills, education, experience_level, cv_file)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        phone = VALUES(phone),
        location = VALUES(location),
        skills = VALUES(skills),
        education = VALUES(education),
        experience_level = VALUES(experience_level),
        cv_file = VALUES(cv_file)`,
      [
        req.user.id,
        phone || '',
        location || '',
        skills || '',
        education || '',
        experience_level || '',
        nextCvFile
      ]
    );

    const [rows] = await pool.query('SELECT * FROM job_seeker_profiles WHERE user_id = ? LIMIT 1', [
      req.user.id
    ]);
    res.json({ message: 'Job seeker profile saved', profile: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not save job seeker profile', error: error.message });
  }
};

module.exports = { getProfile, upsertEmployerProfile, upsertJobSeekerProfile };
