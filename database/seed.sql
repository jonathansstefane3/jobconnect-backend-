USE jobconnect;

-- All seeded users use the bcrypt hash for password123.
-- In a real system, each user chooses their own password during registration.
INSERT INTO users (id, name, email, password, role, status) VALUES
(1, 'Admin User', 'admin@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'admin', 'active'),
(2, 'Amina Tech', 'employer1@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'employer', 'active'),
(3, 'Daniel Works', 'employer2@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'employer', 'active'),
(4, 'Sarah Namatovu', 'seeker1@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(5, 'Brian Okello', 'seeker2@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(6, 'Grace Atim', 'seeker3@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(7, 'Peter Kato', 'seeker4@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(8, 'Joan Akello', 'seeker5@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active');

-- Two sample employers with company profile data.
INSERT INTO employer_profiles (user_id, company_name, company_description, industry, location, phone, website) VALUES
(2, 'BluePeak Software', 'A product engineering company building web platforms for growing businesses.', 'Technology', 'Kampala, Uganda', '+256700111222', 'https://bluepeak.example.com'),
(3, 'GreenHarvest Logistics', 'A regional logistics and supply chain company serving food and retail partners.', 'Logistics', 'Entebbe, Uganda', '+256700333444', 'https://greenharvest.example.com');

-- Five sample job seekers. The CV filenames are examples that match the upload filename pattern.
INSERT INTO job_seeker_profiles (user_id, phone, location, skills, education, experience_level, cv_file) VALUES
(4, '+256701000001', 'Kampala, Uganda', 'React, JavaScript, Bootstrap, REST APIs', 'BSc Computer Science', 'Mid level', 'sample-sarah-cv.pdf'),
(5, '+256701000002', 'Jinja, Uganda', 'Node.js, Express, MySQL, API testing', 'Diploma in Software Engineering', 'Junior', 'sample-brian-cv.pdf'),
(6, '+256701000003', 'Mbarara, Uganda', 'Customer support, CRM, reporting', 'BA Business Administration', 'Entry level', 'sample-grace-cv.pdf'),
(7, '+256701000004', 'Kampala, Uganda', 'Operations, inventory, dispatch coordination', 'Diploma in Procurement', 'Mid level', 'sample-peter-cv.pdf'),
(8, '+256701000005', 'Gulu, Uganda', 'Digital marketing, content writing, SEO', 'BA Mass Communication', 'Junior', 'sample-joan-cv.pdf');

-- Eight sample jobs across both employers. Open jobs appear in public browsing.
INSERT INTO jobs (id, employer_id, title, description, requirements, responsibilities, location, job_type, salary_range, deadline, status) VALUES
(1, 2, 'Frontend Developer', 'Build responsive user interfaces for customer-facing web applications.', 'React, JavaScript, HTML, CSS, REST API experience.', 'Develop UI components, integrate APIs, collaborate with designers, fix frontend defects.', 'Kampala, Uganda', 'Full-time', 'UGX 2.5M - 4M', '2026-08-30', 'open'),
(2, 2, 'Backend Developer', 'Create secure APIs and database-backed services for JobConnect-style platforms.', 'Node.js, Express, MySQL, authentication, Git.', 'Design endpoints, write SQL queries, improve performance, document APIs.', 'Remote', 'Remote', 'UGX 3M - 5M', '2026-09-15', 'open'),
(3, 2, 'QA Analyst', 'Test web workflows and ensure releases meet acceptance criteria.', 'Manual testing, test cases, bug reports, API testing tools.', 'Write test plans, validate fixes, document issues, support release checks.', 'Kampala, Uganda', 'Contract', 'UGX 1.5M - 2.2M', '2026-07-25', 'open'),
(4, 2, 'UI Design Intern', 'Support product design work across dashboards and public pages.', 'Figma basics, design systems, communication skills.', 'Create wireframes, prepare assets, review usability, support user research.', 'Kampala, Uganda', 'Internship', 'UGX 600K - 900K', '2026-08-10', 'open'),
(5, 3, 'Operations Coordinator', 'Coordinate daily dispatch and customer delivery updates.', 'Operations experience, spreadsheets, strong communication.', 'Track deliveries, update partners, escalate risks, prepare daily reports.', 'Entebbe, Uganda', 'Full-time', 'UGX 1.8M - 2.6M', '2026-08-20', 'open'),
(6, 3, 'Logistics Analyst', 'Analyze delivery performance and recommend route improvements.', 'Data analysis, Excel, logistics knowledge, reporting.', 'Build reports, monitor KPIs, identify delays, present recommendations.', 'Kampala, Uganda', 'Full-time', 'UGX 2M - 3.2M', '2026-09-05', 'open'),
(7, 3, 'Customer Support Officer', 'Support business customers with shipment status and service requests.', 'Customer support, CRM tools, clear writing.', 'Respond to tickets, update shipment records, resolve complaints, share feedback.', 'Jinja, Uganda', 'Part-time', 'UGX 900K - 1.4M', '2026-07-31', 'open'),
(8, 3, 'Warehouse Assistant', 'Assist with inventory handling, packing, and stock records.', 'Attention to detail, physical stamina, basic inventory records.', 'Pack orders, update stock logs, maintain warehouse standards, report discrepancies.', 'Entebbe, Uganda', 'Contract', 'UGX 800K - 1.2M', '2026-07-20', 'closed');

-- Sample applications demonstrate the four status values used by employers.
INSERT INTO applications (job_id, job_seeker_id, cover_letter, cv_file, status) VALUES
(1, 4, 'I have built several React interfaces and would like to contribute to your product team.', 'sample-sarah-cv.pdf', 'Shortlisted'),
(2, 5, 'My backend training focused on Express APIs and MySQL schemas, which fits this role.', 'sample-brian-cv.pdf', 'Pending'),
(5, 7, 'My operations background includes dispatch coordination and daily reporting.', 'sample-peter-cv.pdf', 'Pending'),
(7, 6, 'I have customer service experience and strong reporting discipline.', 'sample-grace-cv.pdf', 'Hired'),
(3, 8, 'I am detail oriented and interested in software quality assurance.', 'sample-joan-cv.pdf', 'Rejected');
