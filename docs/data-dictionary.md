# Data Dictionary

## Overview
This document serves as the comprehensive data dictionary for the PostgreSQL database in the Smart School Management System (SSMS), detailing data types, nullability, default values, validation rules, and constraints for all 22 tables.

---

### 1. `academic_years`
Stores the academic cycle definitions.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('academic_years_id_seq')` | Primary Key. |
| `name` | `character varying(50)` | NO | NULL | Academic year label (e.g., "2024-2025"). Unique. |
| `start_date` | `date` | NO | NULL | Commencement date of academic year. Must be < `end_date`. |
| `end_date` | `date` | NO | NULL | Closing date of academic year. Must be > `start_date`. |
| `is_active` | `boolean` | NO | NULL | Indicates if this year is the currently active operational year. |

---

### 2. `ai_student_notes`
Contains rule-based and AI-generated diagnostic observations and alerts.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('ai_student_notes_id_seq')` | Primary Key. |
| `student_id` | `integer` | NO | NULL | FK -> `student_profiles.id`. Target student. |
| `generated_at`| `timestamp` | NO | `now()` | Generation timestamp. |
| `note_content`| `text` | NO | NULL | Diagnostic narrative text or observation summary. |
| `insights_json`| `json` | YES | NULL | Machine-readable breakdown (attendance rate, trend flags, risks). |
| `requires_intervention` | `boolean` | NO | NULL | Critical flag triggering administrative or academic counselor review. |

---

### 3. `attendance`
Records student session-by-session presence.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('attendance_id_seq')` | Primary Key. |
| `student_id` | `integer` | NO | NULL | FK -> `student_profiles.id`. |
| `timetable_id` | `integer` | NO | NULL | FK -> `timetables.id`. Refers to scheduled lesson. |
| `date` | `date` | NO | NULL | Date of session. |
| `status` | `USER-DEFINED` | NO | NULL | Attendance status ('Present', 'Absent', 'Late', 'Excused'). |
| `remarks` | `text` | YES | NULL | Optional teacher note or reason for absence/tardiness. |

---

### 4. `class_levels`
Academic grade tiers.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('class_levels_id_seq')` | Primary Key. |
| `name` | `character varying(100)` | NO | NULL | Level name (e.g. "Grade 1", "Grade 2", "High School 1"). |

---

### 5. `enrollments`
Binds students to classes per school year.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('enrollments_id_seq')` | Primary Key. |
| `student_id` | `integer` | NO | NULL | FK -> `student_profiles.id`. |
| `section_id` | `integer` | NO | NULL | FK -> `sections.id`. Assigned class section. |
| `academic_year_id` | `integer` | NO | NULL | FK -> `academic_years.id`. Relevant school year. |

---

### 6. `exam_types`
Assessment categories and their weighting in term score.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('exam_types_id_seq')` | Primary Key. |
| `name` | `character varying(100)` | NO | NULL | Type name (e.g. "Midterm", "Final", "Quizzes"). |
| `weight_percentage` | `double precision` | NO | NULL | Contribution weight towards overall score (0.0 to 100.0). |

---

### 7. `fee_structures`
Pricing schedule per grade level and fee type.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('fee_structures_id_seq')` | Primary Key. |
| `fee_type_id` | `integer` | NO | NULL | FK -> `fee_types.id`. |
| `class_level_id` | `integer` | NO | NULL | FK -> `class_levels.id`. |
| `academic_year_id` | `integer` | NO | NULL | FK -> `academic_years.id`. |
| `amount` | `double precision` | NO | NULL | Charge amount in standard monetary unit. Must be >= 0. |

---

### 8. `fee_types`
Categories of financial fees.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('fee_types_id_seq')` | Primary Key. |
| `name` | `character varying(100)` | NO | NULL | Fee category name (e.g. "Tuition", "Transportation", "Lab"). |
| `description` | `text` | YES | NULL | Explanatory description. |

---

### 9. `marks`
Academic grades earned by students.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('marks_id_seq')` | Primary Key. |
| `student_id` | `integer` | NO | NULL | FK -> `student_profiles.id`. |
| `subject_id` | `integer` | NO | NULL | FK -> `subjects.id`. |
| `exam_type_id` | `integer` | NO | NULL | FK -> `exam_types.id`. |
| `term_id` | `integer` | NO | NULL | FK -> `terms.id`. |
| `score` | `double precision` | NO | NULL | Score achieved. Must satisfy 0 <= score <= max_score. |
| `max_score` | `double precision` | NO | NULL | Max possible points for the exam. Must be > 0. |

---

### 10. `parent_profiles`
Guardian identity information.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('parent_profiles_id_seq')` | Primary Key. |
| `user_id` | `integer` | NO | NULL | FK -> `users.id` (Unique). Linked login account. |
| `first_name` | `character varying(100)` | NO | NULL | Guardian first name. |
| `last_name` | `character varying(100)` | NO | NULL | Guardian surname. |
| `phone_number` | `character varying(30)` | YES | NULL | Emergency and notification phone number. |

---

### 11. `payments`
Ledger of student fee receipts.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('payments_id_seq')` | Primary Key. |
| `invoice_id` | `integer` | NO | NULL | FK -> `student_invoices.id`. |
| `amount_paid` | `double precision` | NO | NULL | Paid monetary amount. Must be > 0. |
| `payment_date`| `timestamp` | NO | `now()` | Date and time payment was recorded. |
| `payment_method` | `character varying(50)` | YES | NULL | e.g. "Cash", "Card", "Bank Transfer", "Online". |
| `transaction_id` | `character varying(100)`| YES | NULL | External banking or reference identifier. |

---

### 12. `role_permissions`
System permissions by role and resource.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('role_permissions_id_seq')` | Primary Key. |
| `role_id` | `integer` | NO | NULL | FK -> `roles.id`. |
| `resource_name` | `character varying(100)`| NO | NULL | Target resource (e.g. 'students', 'attendance', 'finance'). |
| `can_create` | `boolean` | NO | NULL | Create capability. |
| `can_read` | `boolean` | NO | NULL | Read capability. |
| `can_update` | `boolean` | NO | NULL | Edit/Update capability. |
| `can_delete` | `boolean` | NO | NULL | Delete/Archival capability. |

---

### 13. `roles`
System access roles.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('roles_id_seq')` | Primary Key. |
| `name` | `character varying(50)` | NO | NULL | Unique role name ('admin', 'teacher', 'student', 'parent', 'accountant'). |
| `description` | `text` | YES | NULL | Role scope description. |

---

### 14. `sections`
Class divisions/cohorts.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('sections_id_seq')` | Primary Key. |
| `class_level_id`| `integer` | NO | NULL | FK -> `class_levels.id`. Parent grade. |
| `name` | `character varying(50)` | NO | NULL | Section identifier (e.g. "Section A", "1-A"). |
| `capacity` | `integer` | NO | NULL | Maximum student enrollment capacity. Must be > 0. |

---

### 15. `student_invoices`
Billing statements issued to students.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('student_invoices_id_seq')` | Primary Key. |
| `student_id` | `integer` | NO | NULL | FK -> `student_profiles.id`. |
| `fee_structure_id` | `integer` | NO | NULL | FK -> `fee_structures.id`. |
| `issue_date` | `date` | NO | NULL | Invoice creation/issuance date. |
| `due_date` | `date` | NO | NULL | Invoice payment due date. |
| `amount_due` | `double precision` | NO | NULL | Total charge due. |
| `status` | `character varying(30)` | NO | NULL | Status: 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'. |

---

### 16. `student_parent`
Many-to-many junction linking students and legal guardians.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `student_id` | `integer` | NO | NULL | FK -> `student_profiles.id`. Composite PK (1/2). |
| `parent_id` | `integer` | NO | NULL | FK -> `parent_profiles.id`. Composite PK (2/2). |

---

### 17. `student_profiles`
Student demographic, biodata, and emergency data.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('student_profiles_id_seq')` | Primary Key. |
| `user_id` | `integer` | NO | NULL | FK -> `users.id` (Unique). Linked login account. |
| `first_name` | `character varying(100)`| NO | NULL | Student first name. |
| `last_name` | `character varying(100)`| NO | NULL | Student surname. |
| `date_of_birth` | `date` | YES | NULL | Birth date. |
| `enrollment_date`| `date` | NO | `CURRENT_DATE` | Initial date enrolled. |
| `gender` | `character varying(20)` | YES | NULL | 'Male', 'Female', etc. |
| `blood_type` | `character varying(10)` | YES | NULL | Blood group (e.g. 'O+', 'A+'). |
| `national_id` | `character varying(50)` | YES | NULL | National identification or Civil ID number. |
| `address` | `text` | YES | NULL | Residential address. |
| `phone_number` | `character varying(30)` | YES | NULL | Emergency or direct contact telephone. |
| `medical_conditions`| `text` | YES | NULL | Health alerts, allergies, chronic conditions. |

---

### 18. `subjects`
Curriculum disciplines.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('subjects_id_seq')` | Primary Key. |
| `name` | `character varying(100)`| NO | NULL | Subject title (e.g. "Mathematics", "Physics"). |
| `code` | `character varying(20)` | NO | NULL | Subject unique code (e.g. "MATH-101", "PHY-201"). |

---

### 19. `teacher_profiles`
Teacher biodata and employment record.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('teacher_profiles_id_seq')` | Primary Key. |
| `user_id` | `integer` | NO | NULL | FK -> `users.id` (Unique). Linked login account. |
| `first_name` | `character varying(100)`| NO | NULL | Staff first name. |
| `last_name` | `character varying(100)`| NO | NULL | Staff surname. |
| `hire_date` | `date` | NO | `CURRENT_DATE` | Date hired. |

---

### 20. `terms`
Academic division periods.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('terms_id_seq')` | Primary Key. |
| `academic_year_id`| `integer` | NO | NULL | FK -> `academic_years.id`. |
| `name` | `character varying(100)`| NO | NULL | Term name (e.g. "Term 1", "Semester 1"). |
| `start_date` | `date` | NO | NULL | Term start date. |
| `end_date` | `date` | NO | NULL | Term end date. |

---

### 21. `timetables`
Weekly class schedules.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('timetables_id_seq')` | Primary Key. |
| `section_id` | `integer` | NO | NULL | FK -> `sections.id`. Target class. |
| `subject_id` | `integer` | NO | NULL | FK -> `subjects.id`. Course being taught. |
| `teacher_id` | `integer` | NO | NULL | FK -> `teacher_profiles.id`. Assigned faculty. |
| `day_of_week` | `character varying(20)` | NO | NULL | Day of lesson ('Sunday', 'Monday', 'Tuesday', etc.). |
| `start_time` | `time` | NO | NULL | Period start time. |
| `end_time` | `time` | NO | NULL | Period end time. Must be > `start_time`. |
| `classroom` | `character varying(50)` | YES | NULL | Room number / laboratory name. |

---

### 22. `users`
System authentication credentials.
| Column | Type | Nullable | Default | Description & Validation |
|---|---|---|---|---|
| `id` | `integer` | NO | `nextval('users_id_seq')` | Primary Key. |
| `username` | `character varying(150)`| NO | NULL | Unique username. |
| `email` | `character varying(255)`| NO | NULL | Primary email address. Unique. |
| `hashed_password` | `character varying(255)`| NO | NULL | PBKDF2/Argon2/bcrypt secure password hash. |
| `role_id` | `integer` | NO | NULL | FK -> `roles.id`. System security role. |
| `is_active` | `boolean` | NO | NULL | Account status flag (true = active, false = disabled). |
| `created_at` | `timestamp` | NO | `now()` | Account registration date. |
