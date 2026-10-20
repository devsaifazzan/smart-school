# Database Inventory

## Overview
This document contains the reconstructed database schema inventory for the **Smart School Management System (SSMS)** based on the extracted metadata from the existing PostgreSQL database (`ssms_db.csv`).

The database consists of **22 tables** within the `public` schema.

---

## Table Summary Catalog

| # | Table Name | Business Purpose | Classification | Record Count / Cardinality |
|---|------------|------------------|----------------|----------------------------|
| 1 | `academic_years` | School academic year management & activation state | Core Reference / Operational | Master entity |
| 2 | `ai_student_notes` | AI-generated student advisory insights & flags | Intelligent Analytics | Dependent on Student |
| 3 | `attendance` | Daily / timetable-based student attendance records | Daily Core Operations | High volume transactional |
| 4 | `class_levels` | Grades/Classes (e.g. Grade 1, Grade 10) | Academic Structure | Master entity |
| 5 | `enrollments` | Student-section-academic year cohort association | Academic Structure | Many-to-Many junction |
| 6 | `exam_types` | Assessment categories and weight percentages | Academic Grading | Reference entity |
| 7 | `fee_structures` | Fee pricing matrix by class level & academic year | Financial Management | Operational matrix |
| 8 | `fee_types` | Categories of school fees (tuition, transport, etc.) | Financial Management | Master lookup |
| 9 | `marks` | Student exam marks, scores, and evaluations | Academic Grading | High volume transactional |
| 10 | `parent_profiles` | Guardian demographic & contact data | User Identity & Directory | Extension of User account |
| 11 | `payments` | Monetary transactions settling student invoices | Financial Management | Audit & Financial ledger |
| 12 | `role_permissions` | Granular CRUD permission rules per role & resource | Security & Access Control | Configuration matrix |
| 13 | `roles` | System roles (Admin, Teacher, Student, Parent, etc.) | Security & Access Control | Master lookup |
| 14 | `sections` | Physical classes / divisions within a class level | Academic Structure | Child of class_levels |
| 15 | `student_invoices` | Billing invoices issued to students | Financial Management | Operational billing |
| 16 | `student_parent` | Junction linking students with parents/guardians | Family Relationships | Many-to-Many junction |
| 17 | `student_profiles` | Student demographics, medical, and admission data | Core Student Information | Extension of User account |
| 18 | `subjects` | Curricular courses / subjects taught | Academic Structure | Master lookup |
| 19 | `teacher_profiles` | Staff/Faculty demographic & employment data | Staff Information | Extension of User account |
| 20 | `terms` | Semesters/terms within an academic year | Academic Structure | Child of academic_years |
| 21 | `timetables` | Class schedules linking teacher, subject, section, room | Timetable & Scheduling | Operational schedule |
| 22 | `users` | Core credentials, authentication, and role assignment | Authentication & Security | Core Security entity |

---

## Detailed Schema Specification

### 1. `academic_years`
* **Schema**: `public`
* **Purpose**: Represents academic calendar cycles (e.g., "2024-2025", "2025-2026").
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('academic_years_id_seq'::regclass)`)
  * `name`: `character varying`, NOT NULL (e.g., "2024-2025")
  * `start_date`: `date`, NOT NULL
  * `end_date`: `date`, NOT NULL
  * `is_active`: `boolean`, NOT NULL (flags the current operational year)
* **Status**: Existing Core Table

### 2. `ai_student_notes`
* **Schema**: `public`
* **Purpose**: Stores intelligent, rule-based or AI-assisted performance observations, diagnostic summaries, and intervention flags.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('ai_student_notes_id_seq'::regclass)`)
  * `student_id`: `integer`, NOT NULL, FK -> `student_profiles.id`
  * `generated_at`: `timestamp without time zone`, NOT NULL, DEFAULT `now()`
  * `note_content`: `text`, NOT NULL
  * `insights_json`: `json`, NULLABLE
  * `requires_intervention`: `boolean`, NOT NULL
* **Status**: Existing Smart Analytics Table

### 3. `attendance`
* **Schema**: `public`
* **Purpose**: Records individual attendance sessions per student per timetable slot.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('attendance_id_seq'::regclass)`)
  * `student_id`: `integer`, NOT NULL, FK -> `student_profiles.id`
  * `timetable_id`: `integer`, NOT NULL, FK -> `timetables.id`
  * `date`: `date`, NOT NULL
  * `status`: `USER-DEFINED` (PostgreSQL custom enum or type: e.g., 'Present', 'Absent', 'Late', 'Excused')
  * `remarks`: `text`, NULLABLE
* **Status**: Existing Operational Table

### 4. `class_levels`
* **Schema**: `public`
* **Purpose**: Defines grade tiers (e.g., "Grade 1", "Grade 7", "Kindergarten").
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('class_levels_id_seq'::regclass)`)
  * `name`: `character varying`, NOT NULL
* **Status**: Existing Master Lookup

### 5. `enrollments`
* **Schema**: `public`
* **Purpose**: Cohort binding mapping a student to an academic year and specific section.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('enrollments_id_seq'::regclass)`)
  * `student_id`: `integer`, NOT NULL, FK -> `student_profiles.id`
  * `section_id`: `integer`, NOT NULL, FK -> `sections.id`
  * `academic_year_id`: `integer`, NOT NULL, FK -> `academic_years.id`
* **Status**: Existing Academic Junction

### 6. `exam_types`
* **Schema**: `public`
* **Purpose**: Defines grading evaluation categories and their percentage weights.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('exam_types_id_seq'::regclass)`)
  * `name`: `character varying`, NOT NULL (e.g., "Midterm", "Final Exam", "Quiz", "Homework")
  * `weight_percentage`: `double precision`, NOT NULL
* **Status**: Existing Grading Configuration Table

### 7. `fee_structures`
* **Schema**: `public`
* **Purpose**: Defines standard fee amounts charged per class level and academic year.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('fee_structures_id_seq'::regclass)`)
  * `fee_type_id`: `integer`, NOT NULL, FK -> `fee_types.id`
  * `class_level_id`: `integer`, NOT NULL, FK -> `class_levels.id`
  * `academic_year_id`: `integer`, NOT NULL, FK -> `academic_years.id`
  * `amount`: `double precision`, NOT NULL
* **Status**: Existing Financial Table

### 8. `fee_types`
* **Schema**: `public`
* **Purpose**: Lookup of school fee categories.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('fee_types_id_seq'::regclass)`)
  * `name`: `character varying`, NOT NULL
  * `description`: `text`, NULLABLE
* **Status**: Existing Financial Lookup

### 9. `marks`
* **Schema**: `public`
* **Purpose**: Stores assessment results per student, subject, exam type, and term.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('marks_id_seq'::regclass)`)
  * `student_id`: `integer`, NOT NULL, FK -> `student_profiles.id`
  * `subject_id`: `integer`, NOT NULL, FK -> `subjects.id`
  * `exam_type_id`: `integer`, NOT NULL, FK -> `exam_types.id`
  * `term_id`: `integer`, NOT NULL, FK -> `terms.id`
  * `score`: `double precision`, NOT NULL
  * `max_score`: `double precision`, NOT NULL
* **Status**: Existing Grading Table

### 10. `parent_profiles`
* **Schema**: `public`
* **Purpose**: Personal and contact details for parent/guardian user accounts.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('parent_profiles_id_seq'::regclass)`)
  * `user_id`: `integer`, NOT NULL, FK -> `users.id`
  * `first_name`: `character varying`, NOT NULL
  * `last_name`: `character varying`, NOT NULL
  * `phone_number`: `character varying`, NULLABLE
* **Status**: Existing User Profile Table

### 11. `payments`
* **Schema**: `public`
* **Purpose**: Ledger of payments received towards student invoices.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('payments_id_seq'::regclass)`)
  * `invoice_id`: `integer`, NOT NULL, FK -> `student_invoices.id`
  * `amount_paid`: `double precision`, NOT NULL
  * `payment_date`: `timestamp without time zone`, NOT NULL, DEFAULT `now()`
  * `payment_method`: `character varying`, NULLABLE (e.g., 'Cash', 'Credit Card', 'Bank Transfer')
  * `transaction_id`: `character varying`, NULLABLE
* **Status**: Existing Financial Ledger Table

### 12. `role_permissions`
* **Schema**: `public`
* **Purpose**: Granular CRUD permissions per system role and application resource.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('role_permissions_id_seq'::regclass)`)
  * `role_id`: `integer`, NOT NULL, FK -> `roles.id`
  * `resource_name`: `character varying`, NOT NULL
  * `can_create`: `boolean`, NOT NULL
  * `can_read`: `boolean`, NOT NULL
  * `can_update`: `boolean`, NOT NULL
  * `can_delete`: `boolean`, NOT NULL
* **Status**: Existing Access Control Table

### 13. `roles`
* **Schema**: `public`
* **Purpose**: System security roles.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('roles_id_seq'::regclass)`)
  * `name`: `character varying`, NOT NULL
  * `description`: `text`, NULLABLE
* **Status**: Existing Security Table

### 14. `sections`
* **Schema**: `public`
* **Purpose**: Subdivisions/classrooms within a class level.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('sections_id_seq'::regclass)`)
  * `class_level_id`: `integer`, NOT NULL, FK -> `class_levels.id`
  * `name`: `character varying`, NOT NULL (e.g. "Section A", "Section 1")
  * `capacity`: `integer`, NOT NULL
* **Status**: Existing Academic Table

### 15. `student_invoices`
* **Schema**: `public`
* **Purpose**: Billable fee notices issued to individual students.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('student_invoices_id_seq'::regclass)`)
  * `student_id`: `integer`, NOT NULL, FK -> `student_profiles.id`
  * `fee_structure_id`: `integer`, NOT NULL, FK -> `fee_structures.id`
  * `issue_date`: `date`, NOT NULL
  * `due_date`: `date`, NOT NULL
  * `amount_due`: `double precision`, NOT NULL
  * `status`: `character varying`, NOT NULL (e.g., 'PAID', 'UNPAID', 'PARTIAL', 'OVERDUE')
* **Status**: Existing Billing Table

### 16. `student_parent`
* **Schema**: `public`
* **Purpose**: Junction table establishing M:N relationship between students and parents/guardians.
* **Columns**:
  * `student_id`: `integer`, NOT NULL, FK -> `student_profiles.id`
  * `parent_id`: `integer`, NOT NULL, FK -> `parent_profiles.id`
* **Status**: Existing Family Relationship Junction Table

### 17. `student_profiles`
* **Schema**: `public`
* **Purpose**: Detailed student biodata, emergency contacts, and medical indicators.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('student_profiles_id_seq'::regclass)`)
  * `user_id`: `integer`, NOT NULL, FK -> `users.id`
  * `first_name`: `character varying`, NOT NULL
  * `last_name`: `character varying`, NOT NULL
  * `date_of_birth`: `date`, NULLABLE
  * `enrollment_date`: `date`, NOT NULL, DEFAULT `CURRENT_DATE`
  * `gender`: `character varying`, NULLABLE
  * `blood_type`: `character varying`, NULLABLE
  * `national_id`: `character varying`, NULLABLE
  * `address`: `text`, NULLABLE
  * `phone_number`: `character varying`, NULLABLE
  * `medical_conditions`: `text`, NULLABLE
* **Status**: Existing Core Entity Table

### 18. `subjects`
* **Schema**: `public`
* **Purpose**: Academic subjects and codes (e.g., Math, Science, Arabic, English).
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('subjects_id_seq'::regclass)`)
  * `name`: `character varying`, NOT NULL
  * `code`: `character varying`, NOT NULL
* **Status**: Existing Academic Table

### 19. `teacher_profiles`
* **Schema**: `public`
* **Purpose**: Faculty and staff profiles.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('teacher_profiles_id_seq'::regclass)`)
  * `user_id`: `integer`, NOT NULL, FK -> `users.id`
  * `first_name`: `character varying`, NOT NULL
  * `last_name`: `character varying`, NOT NULL
  * `hire_date`: `date`, NOT NULL, DEFAULT `CURRENT_DATE`
* **Status**: Existing Faculty Table

### 20. `terms`
* **Schema**: `public`
* **Purpose**: Academic periods (terms / semesters) within an academic year.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('terms_id_seq'::regclass)`)
  * `academic_year_id`: `integer`, NOT NULL, FK -> `academic_years.id`
  * `name`: `character varying`, NOT NULL
  * `start_date`: `date`, NOT NULL
  * `end_date`: `date`, NOT NULL
* **Status**: Existing Academic Period Table

### 21. `timetables`
* **Schema**: `public`
* **Purpose**: Master schedule linking section, subject, teacher, day of week, and time.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('timetables_id_seq'::regclass)`)
  * `section_id`: `integer`, NOT NULL, FK -> `sections.id`
  * `subject_id`: `integer`, NOT NULL, FK -> `subjects.id`
  * `teacher_id`: `integer`, NOT NULL, FK -> `teacher_profiles.id`
  * `day_of_week`: `character varying`, NOT NULL
  * `start_time`: `time without time zone`, NOT NULL
  * `end_time`: `time without time zone`, NOT NULL
  * `classroom`: `character varying`, NULLABLE
* **Status**: Existing Scheduling Table

### 22. `users`
* **Schema**: `public`
* **Purpose**: Core authentication accounts, security status, and system role binding.
* **Columns**:
  * `id`: `integer`, NOT NULL, PK (`nextval('users_id_seq'::regclass)`)
  * `username`: `character varying`, NOT NULL
  * `email`: `character varying`, NOT NULL
  * `hashed_password`: `character varying`, NOT NULL
  * `role_id`: `integer`, NOT NULL, FK -> `roles.id`
  * `is_active`: `boolean`, NOT NULL
  * `created_at`: `timestamp without time zone`, NOT NULL, DEFAULT `now()`
* **Status**: Existing Core Authentication Table
