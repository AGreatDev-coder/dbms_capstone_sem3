-- ============================================================================
-- LIFE-LINK DBMS Learning Lab: Isolated College Record Management Demo Schema
-- Used for pure SQL operations (INSERT, UPDATE, DELETE) and Faculty Self-Join
-- Completely isolated from clinical LIFE-LINK healthcare tables
-- ============================================================================

USE lifelink_db;

DROP TABLE IF EXISTS demo_college_exam;
DROP TABLE IF EXISTS demo_college_faculty;
DROP TABLE IF EXISTS demo_college_student;
DROP TABLE IF EXISTS demo_college_course;

-- 1. Student Table
CREATE TABLE demo_college_student (
    student_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year INT NOT NULL CHECK (year >= 1 AND year <= 5)
) ENGINE=InnoDB;

-- 2. Course Table
CREATE TABLE demo_college_course (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    department VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- 3. Faculty Table (Supports Recursive Self-Join)
CREATE TABLE demo_college_faculty (
    faculty_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    supervisor_id INT NULL,
    CONSTRAINT fk_demo_faculty_supervisor FOREIGN KEY (supervisor_id) 
        REFERENCES demo_college_faculty(faculty_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Exam Table
CREATE TABLE demo_college_exam (
    exam_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    marks INT NOT NULL CHECK (marks >= 0 AND marks <= 100),
    exam_date DATE NOT NULL,
    CONSTRAINT fk_demo_exam_student FOREIGN KEY (student_id) 
        REFERENCES demo_college_student(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_demo_exam_course FOREIGN KEY (course_id) 
        REFERENCES demo_college_course(course_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Initial Seed Data
-- ----------------------------------------------------------------------------

INSERT INTO demo_college_student (student_id, name, department, year) VALUES
(101, 'Meera Sen', 'Computer Science', 3),
(102, 'Ria Sharma', 'Information Technology', 2),
(103, 'Kabir Verma', 'Computer Science', 3),
(106, 'Aman Gupta', 'Computer Science', 2),
(108, 'Rohan Mehta', 'Computer Science', 2);

INSERT INTO demo_college_course (course_id, course_name, credits, department) VALUES
(201, 'Data Structures & Algorithms', 4, 'Computer Science'),
(202, 'Operating Systems', 4, 'Computer Science'),
(203, 'Computer Networks', 3, 'Computer Science'),
(204, 'Database Management Systems', 4, 'Computer Science');

INSERT INTO demo_college_faculty (faculty_id, name, department, designation, supervisor_id) VALUES
(501, 'Dr. Rajesh Khanna', 'Computer Science', 'Dean of Engineering', NULL),
(502, 'Dr. Sunita Rao', 'Computer Science', 'Head of Department (HOD)', 501),
(503, 'Prof. Arvind Menon', 'Computer Science', 'Associate Professor', 502),
(504, 'Prof. Kavita Desai', 'Computer Science', 'Assistant Professor', 502),
(505, 'Dr. Suresh Nair', 'Information Technology', 'Head of IT Department', 501);

INSERT INTO demo_college_exam (exam_id, student_id, course_id, marks, exam_date) VALUES
(301, 101, 201, 88, '2026-05-10'),
(302, 102, 201, 79, '2026-05-10'),
(303, 103, 201, 92, '2026-05-10'),
(304, 103, 203, 62, '2026-05-15'),
(307, 101, 202, 45, '2026-05-12');
