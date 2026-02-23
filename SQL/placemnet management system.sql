CREATE DATABASE PLACEMENT;
USE PLACEMENT;


CREATE TABLE student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    branch VARCHAR(50),
    cgpa DECIMAL(3,2) CHECK (cgpa BETWEEN 0 AND 10),
    graduation_year INT,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO student
(roll_no, name, email, phone, branch, cgpa, graduation_year, password_hash)
VALUES
('CS101', 'Rahul Sharma', 'rahul@college.edu', '9876543210', 'CSE', 8.5, 2026, 'hash1'),
('CS102', 'Ananya Verma', 'ananya@college.edu', '9876543211', 'CSE', 9.1, 2026, 'hash2'),
('EC201', 'Amit Patel', 'amit@college.edu', '9876543212', 'ECE', 7.8, 2026, 'hash3'),
('ME301', 'Sneha Iyer', 'sneha@college.edu', '9876543213', 'MECH', 8.0, 2026, 'hash4');
SELECT * FROM student;


CREATE TABLE company (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100),
    location VARCHAR(100),
    website VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO company (name, email, location, website) VALUES
('Google', 'hr@google.com', 'Bangalore', 'https://careers.google.com'),
('Amazon', 'hr@amazon.com', 'Hyderabad', 'https://amazon.jobs'),
('Infosys', 'hr@infosys.com', 'Pune', 'https://careers.infosys.com');

SELECT * FROM company;


CREATE TABLE job (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    role VARCHAR(100),
    package_lpa DECIMAL(5,2),
    min_cgpa DECIMAL(3,2),
    eligible_branch VARCHAR(100),
    last_date DATE,
    FOREIGN KEY (company_id) REFERENCES company(company_id)
        ON DELETE CASCADE
);
INSERT INTO job
(company_id, role, package_lpa, min_cgpa, eligible_branch, last_date)
VALUES
(1, 'Software Engineer', 18.00, 8.0, 'CSE,ECE', '2026-02-10'),
(2, 'Backend Developer', 16.00, 7.5, 'CSE', '2026-02-15'),
(3, 'System Engineer', 8.00, 7.0, 'CSE,ECE,MECH', '2026-02-20');
SELECT * FROM job;

CREATE TABLE application (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    job_id INT NOT NULL,
    status ENUM('APPLIED','SHORTLISTED','INTERVIEW','SELECTED','REJECTED')
           DEFAULT 'APPLIED',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, job_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job(job_id)
        ON DELETE CASCADE
);
INSERT INTO application
(student_id, job_id, status)
VALUES
(1, 1, 'APPLIED'),
(2, 1, 'SHORTLISTED'),
(3, 1, 'REJECTED'),
(1, 2, 'SHORTLISTED'),
(2, 2, 'SELECTED'),
(4, 3, 'INTERVIEW');

SELECT * FROM application;

CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);

INSERT INTO admin (name, email, password_hash) VALUES
('Placement Officer', 'placement@college.edu', 'hash_admin_123');


SELECT * FROM admin;

CREATE TABLE interview (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    round_no INT,
    interview_date DATE,
    mode ENUM('ONLINE','OFFLINE'),
    result ENUM('PASS','FAIL','PENDING') DEFAULT 'PENDING',
    FOREIGN KEY (application_id) REFERENCES application(application_id)
        ON DELETE CASCADE
);

INSERT INTO interview
(application_id, round_no, interview_date, mode, result)
VALUES
(2, 1, '2026-02-18', 'ONLINE', 'PASS'),
(2, 2, '2026-02-20', 'OFFLINE', 'PENDING'),
(6, 1, '2026-02-22', 'ONLINE', 'PENDING');

SELECT * FROM interview;

CREATE INDEX idx_student_email ON student(email);
CREATE INDEX idx_job_company ON job(company_id);
CREATE INDEX idx_application_status ON application(status);



/*
   AGGREGATE QUERIES
*/

-- Total students
SELECT COUNT(*) FROM student;

-- Average CGPA branch-wise
SELECT branch, AVG(cgpa) FROM student GROUP BY branch;

-- Highest & lowest package
SELECT MAX(package_lpa), MIN(package_lpa) FROM job;

-- Jobs per company
SELECT c.name, COUNT(j.job_id)
FROM company c
LEFT JOIN job j ON c.company_id = j.company_id
GROUP BY c.company_id;

-- Applications per job
SELECT j.role, COUNT(a.application_id)
FROM job j
LEFT JOIN application a ON j.job_id = a.job_id
GROUP BY j.job_id;

-- Status-wise application count
SELECT status, COUNT(*) FROM application GROUP BY status;

-- Selected students per company
SELECT c.name, COUNT(*)
FROM application a
JOIN job j ON a.job_id = j.job_id
JOIN company c ON j.company_id = c.company_id
WHERE a.status = 'SELECTED'
GROUP BY c.company_id;

-- Students per graduation year
SELECT graduation_year, COUNT(*) FROM student GROUP BY graduation_year;


/*
   JOIN QUERIES
*/

-- Student + Job + Status
SELECT s.name, j.role, a.status
FROM student s
JOIN application a ON s.student_id = a.student_id
JOIN job j ON a.job_id = j.job_id;

-- All students even without applications
SELECT s.name, j.role
FROM student s
LEFT JOIN application a ON s.student_id = a.student_id
LEFT JOIN job j ON a.job_id = j.job_id;

-- All jobs even without applicants
SELECT j.role, s.name
FROM job j
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN student s ON a.student_id = s.student_id;

-- CSE students with applied jobs
SELECT s.name, j.role
FROM student s
JOIN application a ON s.student_id = a.student_id
JOIN job j ON a.job_id = j.job_id
WHERE s.branch = 'CSE';

-- Student + Company + Job + Status
SELECT s.name, c.name, j.role, a.status
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN job j ON a.job_id = j.job_id
JOIN company c ON j.company_id = c.company_id;

-- Average CGPA of selected students per company
SELECT c.name, AVG(s.cgpa)
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN job j ON a.job_id = j.job_id
JOIN company c ON j.company_id = c.company_id
WHERE a.status = 'SELECTED'
GROUP BY c.company_id;


/* 
   VIEWS
*/

-- Student applications view
CREATE VIEW vw_student_applications AS
SELECT s.name, j.role, c.name AS company, a.status
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN job j ON a.job_id = j.job_id
JOIN company c ON j.company_id = c.company_id;

-- Selected students view
CREATE VIEW vw_selected_students AS
SELECT s.name, s.branch, s.cgpa, c.name, j.role, j.package_lpa
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN job j ON a.job_id = j.job_id
JOIN company c ON j.company_id = c.company_id
WHERE a.status = 'SELECTED';

-- Company job summary view
CREATE VIEW vw_company_jobs AS
SELECT c.name, COUNT(j.job_id), MAX(j.package_lpa)
FROM company c
LEFT JOIN job j ON c.company_id = j.company_id
GROUP BY c.company_id;

-- Interview schedule view
CREATE VIEW vw_interview_schedule AS
SELECT s.name, c.name, j.role, i.round_no, i.interview_date, i.mode, i.result
FROM interview i
JOIN application a ON i.application_id = a.application_id
JOIN student s ON a.student_id = s.student_id
JOIN job j ON a.job_id = j.job_id
JOIN company c ON j.company_id = c.company_id;

/*
   INNER JOIN
*/

SELECT s.name AS student, j.role, c.name AS company, a.status
FROM application a
INNER JOIN student s ON a.student_id = s.student_id
INNER JOIN job j ON a.job_id = j.job_id
INNER JOIN company c ON j.company_id = c.company_id;


SELECT s.name AS student, a.status
FROM application a
INNER JOIN student s ON a.student_id = s.student_id;

/*
   LEFT OUTER JOIN
   */

SELECT s.name AS student, j.role, a.status
FROM student s
LEFT JOIN application a ON s.student_id = a.student_id
LEFT JOIN job j ON a.job_id = j.job_id;


SELECT s.name AS student, a.status
FROM student s
LEFT JOIN application a ON s.student_id = a.student_id;


/*
   RIGHT OUTER JOIN
   */

SELECT j.role, s.name AS student, a.status
FROM application a
RIGHT JOIN job j ON a.job_id = j.job_id
LEFT JOIN student s ON a.student_id = s.student_id;



SELECT j.role, a.status
FROM application a
RIGHT JOIN job j ON a.job_id = j.job_id;


/*
   FULL OUTER JOIN
*/

SELECT s.name AS student, j.role
FROM student s
LEFT JOIN application a ON s.student_id = a.student_id
LEFT JOIN job j ON a.job_id = j.job_id

UNION

SELECT s.name AS student, j.role
FROM job j
LEFT JOIN application a ON j.job_id = a.job_id
LEFT JOIN student s ON a.student_id = s.student_id;



/* 
   TRIGGER 
   */

DELIMITER $$

CREATE TRIGGER trg_check_cgpa_before_apply
BEFORE INSERT ON application
FOR EACH ROW
BEGIN
    DECLARE student_cgpa DECIMAL(3,2);
    DECLARE job_min_cgpa DECIMAL(3,2);

    SELECT cgpa INTO student_cgpa
    FROM student
    WHERE student_id = NEW.student_id;

    SELECT min_cgpa INTO job_min_cgpa
    FROM job
    WHERE job_id = NEW.job_id;

    IF student_cgpa < job_min_cgpa THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CGPA not eligible for this job';
    END IF;
END$$
DELIMITER ;



