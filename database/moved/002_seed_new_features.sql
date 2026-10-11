-- Sample data for the new features (run after 001). Assumes the original seed.sql was loaded.
USE jobconnect;
INSERT IGNORE INTO saved_jobs (job_seeker_id, job_id) VALUES (4, 2), (4, 6);
INSERT INTO job_alerts (job_seeker_id, keyword, location, job_type) VALUES
  (4, 'developer', 'Kampala', NULL),
  (5, '', '', 'Remote');
INSERT INTO application_notes (application_id, author_id, note) VALUES
  (1, 2, 'Strong React portfolio. Schedule a technical interview.');
