# Smart School Management System (SSMS)
### نظام إدارة المدرسة الذكية المتكامل

[![Backend: Django REST Framework](https://img.shields.io/badge/Backend-Django_6.1_%2B_DRF-0C4B33?logo=django)](https://www.djangoproject.com/)
[![Frontend: React + Vite + TypeScript](https://img.shields.io/badge/Frontend-React_19_%2B_Vite_%2B_TS-61DAFB?logo=react)](https://react.dev/)
[![Database: PostgreSQL Preserved](https://img.shields.io/badge/Database-PostgreSQL_Preserved-336791?logo=postgresql)](https://www.postgresql.org/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![i18n: English LTR & Arabic RTL](https://img.shields.io/badge/i18n-Arabic_RTL_%26_English_LTR-6366F1)](https://react.i18next.com/)

---

## 1. System Overview

The **Smart School Management System (SSMS)** is an enterprise-grade, full-stack school administration platform designed to connect directly with the existing PostgreSQL database schema (`ssms_db.csv`).

The system integrates student demographics, guardian relations, academic scheduling, attendance tracking, exam grading, financial ledger management, and intelligent diagnostic early-warning analytics into a cohesive, bilingual (Arabic RTL & English LTR) web application.

---

## 2. Comprehensive Documentation

All architectural specifications, database catalogs, data dictionaries, security guidelines, and implementation roadmaps are available in the [`docs/`](file:///d:/Smart%20School/docs) directory:

* [`docs/database-inventory.md`](file:///d:/Smart%20School/docs/database-inventory.md): Full inventory of all 22 tables from `ssms_db.csv`, schemas, columns, nullability, and primary keys.
* [`docs/database-relationships.md`](file:///d:/Smart%20School/docs/database-relationships.md): Entity Relationship Diagram (ERD), foreign-key mappings, and cardinality matrix.
* [`docs/data-dictionary.md`](file:///d:/Smart%20School/docs/data-dictionary.md): Field-by-field definitions, data types, constraints, and business validation rules.
* [`docs/architecture.md`](file:///d:/Smart%20School/docs/architecture.md): Multi-tier decoupled architecture, backend domain apps, and frontend component layout.
* [`docs/implementation-plan.md`](file:///d:/Smart%20School/docs/implementation-plan.md): Phased roadmap, deliverables, and verification checkpoints.
* [`docs/security.md`](file:///d:/Smart%20School/docs/security.md): Authentication framework, RBAC matrix, IDOR protection, and threat mitigations.

---

## 3. Existing PostgreSQL Database Preservation Rules

All 22 existing PostgreSQL tables from `ssms_db.csv` are strictly mapped and preserved:
* `academic_years`, `terms`, `class_levels`, `sections`, `subjects`, `enrollments`
* `users`, `roles`, `role_permissions`
* `student_profiles`, `teacher_profiles`, `parent_profiles`, `student_parent`
* `timetables`, `attendance`
* `exam_types`, `marks`
* `fee_types`, `fee_structures`, `student_invoices`, `payments`
* `ai_student_notes`

Every Django model explicitly specifies `db_table = '<table_name>'` and exact column references to avoid altering existing database definitions or running destructive migrations.

---

## 4. Key Features & Operational Modules

### 4.1 Executive Dashboard & Real-Time Analytics
* Dynamic KPI cards calculated from real database records (Total Students, Active Faculty, Classes, Attendance Rate, Invoiced, Collected, Arrears).
* Interactive Recharts visualizations (weekly attendance percentage bars, financial collections vs balance pie).
* Urgent smart diagnostic alert feed.

### 4.2 Student Information Management
* Searchable and filterable student roster with national ID, phone, emergency contacts, and medical alerts.
* Detail drawer showing demographic biodata and parent/guardian links.

### 4.3 Academic Structure & Scheduling
* Multi-year calendar management with activation flags.
* Class grade tiers and classroom capacity indicators.
* Timetable grid with **server-side conflict detection** preventing teacher double-booking, room collision, and overlapping periods.

### 4.4 Attendance Management
* Daily & period session register.
* "Mark All Present" batch action, status toggles (Present, Absent, Late, Excused), and absence remarks.
* Bulk submission with live statistics calculation.

### 4.5 Exams, Marks & Official Transcripts
* Assessment category management (Midterms, Finals) with configurable weight percentages.
* Student report card generator calculating cumulative weighted percentages and letter grades (A, B, C, D, F).

### 4.6 Fees & Financial Ledger
* Tuition structures by grade level and academic year.
* Student invoices with statuses (`PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`).
* Transactional payment collection modal with overpayment protection.

### 4.7 Smart Analytics & AI Early Interventions
* Algorithmic diagnostic scanner (`/api/v1/analytics/notes/generate-notes/`).
* Detects chronic absenteeism (< 80%) and academic performance dips (< 60%), generating structured diagnostic notes and actionable intervention flags.

### 4.8 Arabic (RTL) & English (LTR) Bilingual Design
* Instant one-click language toggle in Navbar and Login screen.
* Sets layout direction (`dir="rtl"` vs `dir="ltr"`), adjusting alignment, sidebars, forms, tables, and typography (Cairo for Arabic, Inter for English).

---

## 5. Quick Start & Local Execution

### 5.1 Local PostgreSQL Database Configuration
The application is pre-configured in `.env` to connect to your local PostgreSQL server:
* **Host**: `localhost`
* **Port**: `5433` (or `5432` depending on instance)
* **Database Name**: `ssms_db`
* **User**: `postgres`
* **Password**: `postgres`

All 22 tables and existing records in `ssms_db` are directly connected, protected from data loss, and support raw Argon2 password hashes.

### 5.2 Backend Setup (Python 3.12)
1. Open terminal and navigate to the backend directory:
   ```bash
   cd "d:\Smart School\backend"
   ```
2. Start the Django REST API server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   API is accessible at `http://127.0.0.1:8000/api/v1/`

### 5.3 Frontend Setup (Node.js & Vite)
1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd "d:\Smart School\frontend"
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`

---

## 6. Accounts on Local PostgreSQL

The system uses the authentic accounts already present in your local PostgreSQL `ssms_db`:

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | System Administrator with full access |
| **Teacher** | `teacher1` | `teacher123` | Faculty member (John Doe) |
| **Student** | `alice` | `alice123` | Enrolled student (Alice 2 Johnson) |
| **Student** | `bob` | `bob123` | Enrolled student (Bob Smith) |
| **Student** | `charlie` | `charlie123` | Enrolled student (Charlie Davis) |
| **Student** | `evan` | `evan123` | Enrolled student (Evan Wright) |

---

## 7. Automated Test Execution

Run backend unit and integration test suites:
```bash
cd "d:\Smart School\backend"
python manage.py test apps.accounts.tests apps.timetable.tests apps.finance.tests
```

Build and test frontend TypeScript compilation:
```bash
cd "d:\Smart School\frontend"
npm run build
```

---

## 8. Docker & Production Deployment

A production-ready `docker-compose.yml` is provided in the root directory:

```bash
docker-compose up --build -d
```
* **PostgreSQL Database**: Port `5432`
* **Django API Backend**: Port `8000`
* **Nginx Static Frontend**: Port `80`
