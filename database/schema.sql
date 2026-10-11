-- Create the project database if it does not already exist.
CREATE DATABASE IF NOT EXISTS jobconnect;
USE jobconnect;

-- Drop child tables first because they contain foreign keys to parent tables.
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS job_seeker_profiles;
DROP TABLE IF EXISTS employer_profiles;
DROP TABLE IF EXISTS users;

-- users stores login credentials and the role used by the API for access control.
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employer', 'job_seeker') NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- employer_profiles stores company information for users whose role is employer.
-- user_id is UNIQUE because each employer should have only one company profile.
CREATE TABLE employer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(160) NOT NULL,
  company_description TEXT,
  industry VARCHAR(120),
  location VARCHAR(160),
  phone VARCHAR(40),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- job_seeker_profiles stores candidate information and the default CV filename.
-- CV files are stored on disk in backend/uploads; only the filename is stored here.
CREATE TABLE job_seeker_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(40),
  location VARCHAR(160),
  skills TEXT,
  education TEXT,
  experience_level VARCHAR(80),
  cv_file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_seeker_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- jobs are owned by employer users. Deleting an employer deletes their jobs through ON DELETE CASCADE.
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employer_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  location VARCHAR(160) NOT NULL,
  job_type ENUM('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote') NOT NULL,
  salary_range VARCHAR(100),
  deadline DATE NOT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- applications connect a job seeker to a job.
-- unique_job_application prevents the same job seeker from applying to the same job twice.
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  job_seeker_id INT NOT NULL,
  cover_letter TEXT NOT NULL,
  cv_file VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Shortlisted', 'Rejected', 'Hired') NOT NULL DEFAULT 'Pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_seeker FOREIGN KEY (job_seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_job_application UNIQUE (job_id, job_seeker_id)
);

-- Indexes help common search/filter operations run faster as the database grows.
CREATE INDEX idx_jobs_search ON jobs (title, location, job_type, status);
CREATE INDEX idx_applications_status ON applications (status);
