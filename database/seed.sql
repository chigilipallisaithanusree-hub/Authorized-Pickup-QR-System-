-- Seed Data for FirstCry Intelliots Portal
-- Target Engine: MySQL 8.0 / SQLite
-- Contains exactly: 1 Admin, 2 Teachers, 3 Parents, 10 Students, 10 Guardians, 10 QR Tokens, 20 Pickup Logs
-- Password hash corresponds to 'Password123!'

-- 1. Seed Users (1 Admin, 2 Teachers, 3 Parents)
INSERT INTO users (id, firebase_uid, email, role, full_name, is_active) VALUES
(1, 'uid_admin_sarah', 'chigilipallisaithanusree@gmail.com', 'admin', 'Sai Thanusree Chigilipalli', 1),
(2, 'uid_teacher_davis', 'davis@school.edu', 'teacher', 'Mr. Robert Davis', 1),
(3, 'uid_teacher_clark', 'clark@school.edu', 'teacher', 'Mrs. Helen Clark', 1),
(4, 'uid_parent_watson', 'parent@family.com', 'parent', 'Mrs. Emily Watson', 1),
(5, 'uid_parent_doe', 'john.doe@family.com', 'parent', 'Mr. John Doe', 1),
(6, 'uid_parent_smith', 'jane.smith@family.com', 'parent', 'Mrs. Jane Smith', 1);

-- 2. Seed Students (10 Students)
INSERT INTO students (id, first_name, last_name, grade_class, parent_user_id, is_deleted) VALUES
(1, 'Leo', 'Watson', 'Kindergarten-A', 4, 0),
(2, 'Mia', 'Watson', 'Grade 2-B', 4, 0),
(3, 'Toby', 'Watson', 'Grade 1-A', 4, 0),
(4, 'Lily', 'Watson', 'Kindergarten-A', 4, 0),
(5, 'Lucas', 'Doe', 'Grade 1-A', 5, 0),
(6, 'Grace', 'Doe', 'Grade 3-B', 5, 0),
(7, 'Ethan', 'Doe', 'Grade 2-A', 5, 0),
(8, 'Sophia', 'Smith', 'Kindergarten-B', 6, 0),
(9, 'Oliver', 'Smith', 'Grade 3-C', 6, 0),
(10, 'Emma', 'Smith', 'Grade 4-B', 6, 0);

-- 3. Seed Guardians (10 Guardians)
INSERT INTO guardians (id, full_name, relationship, phone_number, email) VALUES
(1, 'John Watson', 'Uncle', '+1-555-0101', 'john.watson@gmail.com'),
(2, 'Ruth Watson', 'Grandmother', '+1-555-0102', 'ruth.watson@gmail.com'),
(3, 'Sarah Doe', 'Aunt', '+1-555-0201', 'sarah.doe@gmail.com'),
(4, 'Arthur Doe', 'Grandfather', '+1-555-0202', 'arthur.doe@gmail.com'),
(5, 'David Miller', 'Grandfather', '+1-555-0301', 'david.miller@gmail.com'),
(6, 'Emma Davis', 'Nanny', '+1-555-0302', 'emma.davis@gmail.com'),
(7, 'Frank Smith', 'Uncle', '+1-555-0401', 'frank.smith@gmail.com'),
(8, 'Alice Smith', 'Aunt', '+1-555-0402', 'alice.smith@gmail.com'),
(9, 'Thomas Johnson', 'Stepfather', '+1-555-0501', 'thomas.johnson@gmail.com'),
(10, 'Megan Watson', 'Cousin', '+1-555-0103', 'megan.watson@gmail.com');

-- Seed student-guardian associations
INSERT INTO student_guardians (student_id, guardian_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 10),
(3, 2),
(4, 2),
(5, 3), (5, 4),
(6, 4),
(7, 4),
(8, 5), (8, 6),
(9, 6), (9, 7),
(10, 8), (10, 9);

-- 4. Seed QR Tokens (10 Tokens)
-- Seeded with dates relative to 2026-06-15
INSERT INTO qr_tokens (id, token_hash, student_id, guardian_id, expires_at, status, created_at, used_at) VALUES
(1, 'token-hash-active-1', 1, 1, '2026-06-15 18:00:00', 'Active', '2026-06-15 16:00:00', NULL),
(2, 'token-hash-active-2', 5, 3, '2026-06-15 20:00:00', 'Active', '2026-06-15 16:00:00', NULL),
(3, 'token-hash-active-3', 8, 5, '2026-06-15 19:00:00', 'Active', '2026-06-15 16:00:00', NULL),
(4, 'token-hash-expired-1', 2, 1, '2026-06-15 15:00:00', 'Expired', '2026-06-15 13:00:00', NULL),
(5, 'token-hash-expired-2', 6, 4, '2026-06-15 14:00:00', 'Expired', '2026-06-15 12:00:00', NULL),
(6, 'token-hash-used-1', 1, 2, '2026-06-14 18:00:00', 'Used', '2026-06-14 16:00:00', '2026-06-14 17:00:00'),
(7, 'token-hash-used-2', 5, 4, '2026-06-13 18:00:00', 'Used', '2026-06-13 16:00:00', '2026-06-13 17:00:00'),
(8, 'token-hash-used-3', 8, 6, '2026-06-12 18:00:00', 'Used', '2026-06-12 16:00:00', '2026-06-12 17:00:00'),
(9, 'token-hash-used-4', 9, 7, '2026-06-11 18:00:00', 'Used', '2026-06-11 16:00:00', '2026-06-11 17:00:00'),
(10, 'token-hash-used-5', 10, 9, '2026-06-10 18:00:00', 'Used', '2026-06-10 16:00:00', '2026-06-10 17:00:00');

-- 5. Seed Pickup Logs (20 logs)
INSERT INTO pickup_logs (id, student_id, guardian_id, teacher_user_id, status, created_at, rejection_reason, ip_address) VALUES
-- Today
(1, 1, 1, 2, 'APPROVED', '2026-06-15 15:45:00', NULL, '192.168.1.10'),
(2, 2, 1, 2, 'APPROVED', '2026-06-15 15:10:00', NULL, '192.168.1.10'),
(3, 5, 3, 3, 'APPROVED', '2026-06-15 14:50:00', NULL, '192.168.1.11'),
(4, 8, 5, 3, 'APPROVED', '2026-06-15 13:50:00', NULL, '192.168.1.11'),
(5, 9, 6, 2, 'APPROVED', '2026-06-15 12:50:00', NULL, '192.168.1.10'),
(6, 3, 2, 2, 'REJECTED', '2026-06-15 11:50:00', 'Token Expired', '192.168.1.10'),
-- Yesterday
(7, 1, 2, 2, 'APPROVED', '2026-06-14 14:50:00', NULL, '192.168.1.10'),
(8, 4, 2, 3, 'APPROVED', '2026-06-14 13:50:00', NULL, '192.168.1.12'),
(9, 6, 4, 3, 'APPROVED', '2026-06-14 12:50:00', NULL, '192.168.1.12'),
(10, 10, 8, 2, 'APPROVED', '2026-06-14 11:50:00', NULL, '192.168.1.10'),
-- 2 Days Ago
(11, 5, 4, 3, 'APPROVED', '2026-06-13 13:50:00', NULL, '192.168.1.11'),
(12, 7, 4, 3, 'APPROVED', '2026-06-13 12:50:00', NULL, '192.168.1.11'),
(13, 8, 6, 2, 'APPROVED', '2026-06-13 11:50:00', NULL, '192.168.1.10'),
(14, 1, 1, 2, 'REJECTED', '2026-06-13 10:50:00', 'Unauthorized Guardian', '192.168.1.14'),
-- 3 Days Ago
(15, 9, 7, 2, 'APPROVED', '2026-06-12 12:50:00', NULL, '192.168.1.10'),
(16, 10, 9, 3, 'APPROVED', '2026-06-12 11:50:00', NULL, '192.168.1.15'),
-- 4 Days Ago
(17, 2, 10, 2, 'APPROVED', '2026-06-11 13:50:00', NULL, '192.168.1.10'),
(18, 3, 2, 3, 'APPROVED', '2026-06-11 12:50:00', NULL, '192.168.1.16'),
(19, 4, 1, 2, 'REJECTED', '2026-06-11 11:50:00', 'QR Already Used', '192.168.1.10'),
-- 5 Days Ago
(20, 5, 3, 2, 'APPROVED', '2026-06-10 10:50:00', NULL, '192.168.1.10');
