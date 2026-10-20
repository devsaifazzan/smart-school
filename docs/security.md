# Security Architecture & Permission Matrix

## 1. Authentication Framework

### 1.1 Credential Management
* **User Accounts**: Sourced from the `users` table.
* **Password Hashing**: Uses Django's industry-standard PBKDF2 with SHA-256 (or Argon2/bcrypt), matching `hashed_password` specifications.
* **Account Status**: `is_active` boolean strictly verified upon every authentication request. Inactive accounts are immediately denied token issuance.

### 1.2 Authentication Mechanism
* Token-based authentication via REST API (`Bearer <token>`) with optional HttpOnly cookie deployment for same-origin web clients.
* Tokens have short expiration cycles with sliding session refreshes.
* Authorization headers are validated via custom Django authentication backends checking against active database records.

---

## 2. Role-Based Access Control (RBAC) & Permission Matrix

### 2.1 System Roles
The system distinguishes six core roles derived from `roles`:
1. `super_admin`: Full system control across all operational modules and school configurations.
2. `school_admin`: School operations manager (admissions, class assignments, fee structures, staffing).
3. `teacher`: Instruction-level access (view assigned classes, record attendance, enter marks, view timetables).
4. `accountant`: Financial officer (invoices, record payments, view financial summaries).
5. `parent`: Family guardian (view children's academic results, attendance, invoices, and notices).
6. `student`: Individual learner (view own grades, timetable, personal attendance, assignments).

### 2.2 Permissions Matrix

| Resource (`resource_name`) | Action | `super_admin` | `school_admin` | `teacher` | `accountant` | `parent` | `student` |
|---|---|---|---|---|---|---|---|
| **Users & Roles** | Create / Read / Update / Delete | Full | Limited | None | None | None | None |
| **Academic Years & Terms**| Create / Read / Update / Delete | Full | Full | Read | Read | Read | Read |
| **Classes & Sections** | Create / Read / Update / Delete | Full | Full | Read | Read | Read (Own) | Read (Own) |
| **Subjects** | Create / Read / Update / Delete | Full | Full | Read | None | Read | Read |
| **Student Profiles** | Create / Update | Full | Full | Read | Read | Update (Contact) | None |
| **Student Profiles** | Read | Full | Full | Assigned | Assigned | Own Children | Own Profile |
| **Timetables** | Create / Update / Delete | Full | Full | None | None | None | None |
| **Timetables** | Read | Full | Full | Assigned | Read | Children's | Own Class |
| **Attendance** | Create / Update (Mark) | Full | Full | Assigned Class | None | None | None |
| **Attendance** | Read | Full | Full | Assigned Class | None | Children's | Own Attendance |
| **Marks & Grades** | Create / Update (Entry) | Full | Full | Assigned Subject | None | None | None |
| **Marks & Grades** | Read | Full | Full | Assigned Subject | None | Children's | Own Marks |
| **Invoices & Billing** | Create / Update | Full | Full | None | Full | None | None |
| **Payments** | Record / Settle | Full | Full | None | Full | None | None |
| **Payments** | Read | Full | Full | None | Full | Children's | Own Invoices |
| **AI Notes / Interventions** | Generate / Manage | Full | Full | Assigned Students | None | Read (Approved) | Read (Approved) |

---

## 3. Object-Level Access Control & IDOR Prevention

### 3.1 Scoped Data Isolation
To prevent Insecure Direct Object References (IDOR):
1. **Parents**: When a parent requests `/api/v1/students/{id}/`, the backend checks the `student_parent` junction table (`parent_id = current_user.parent_profile.id AND student_id = {id}`). Any attempt to access an unrelated student yields HTTP `403 Forbidden`.
2. **Students**: When a student requests marks or attendance, querysets are filtered automatically to `student_id = current_user.student_profile.id`. URL tampering targeting another student is blocked server-side.
3. **Teachers**: When a teacher marks attendance or grades, the backend validates that the teacher is assigned to the relevant timetable or subject section (`timetables.teacher_id = current_user.teacher_profile.id`).

---

## 4. Threat Modeling & Protections

### 4.1 SQL Injection Protection
* Django ORM parameterized queries are used exclusively.
* No direct string concatenation into SQL statements.

### 4.2 Cross-Site Scripting (XSS)
* React automatically escapes JSX expressions.
* User-submitted remarks, medical conditions, and notes are sanitized and encoded before rendering.

### 4.3 Cross-Origin Resource Sharing (CORS) & CSRF
* Configured using `django-cors-headers` with explicit allowed origins (`CORS_ALLOWED_ORIGINS`).
* CSRF tokens enforced for session-authenticated endpoints.

### 4.4 Financial Transaction Integrity
* Multiple concurrent payments are protected using PostgreSQL row-level locking (`select_for_update()`) and database transactions (`atomic()`) to avoid race conditions and double payments.
* Invoices cannot be double-paid beyond the outstanding balance.
