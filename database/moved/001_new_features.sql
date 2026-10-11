-- JobConnect new features: saved jobs, job alerts, applicant notes.
-- SAFE to run more than once (uses IF NOT EXISTS). It does NOT drop anything.
-- Run AFTER schema.sql and seed.sql:
--   mysql -u root -p jobconnect < database/migrations/001_new_features.sql
USE jobconnect;

-- Feature 1: a job seeker bookmarks jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_seeker_id INT NOT NULL,
  job_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_seeker FOREIGN KEY (job_seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT unique_saved_job UNIQUE (job_seeker_id, job_id)
);

-- Feature 2: a job seeker saves search preferences (an "alert")
CREATE TABLE IF NOT EXISTS job_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_seeker_id INT NOT NULL,
  keyword VARCHAR(100) NOT NULL DEFAULT '',
  location VARCHAR(100) NOT NULL DEFAULT '',
  job_type ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_seeker FOREIGN KEY (job_seeker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feature 3: private employer notes about an applicant
CREATE TABLE IF NOT EXISTS application_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  author_id INT NOT NULL,
  note VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_note_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
