# Implementation Plan

## Overview
This phased roadmap details the end-to-end delivery of the Smart School Management System (SSMS), ensuring preservation of the existing PostgreSQL database schema (`ssms_db.csv`), robust backend business logic in Django REST Framework, modern React TypeScript frontend, and bilingual (English/Arabic) UI.

---

## Roadmap Phases

### Phase 1: Database Reconstruction & Architecture Discovery [COMPLETED]
- [x] Extract and verify all 22 tables from `ssms_db.csv`.
- [x] Generate database inventory (`docs/database-inventory.md`).
- [x] Construct Entity Relationship Model and Cardinality Map (`docs/database-relationships.md`).
- [x] Create comprehensive column-by-column Data Dictionary (`docs/data-dictionary.md`).
- [x] Formalize System Architecture and Directory Layout (`docs/architecture.md`).
- [x] Define Security and Authorization Matrix (`docs/security.md`).

---

### Phase 2: Backend Core & Database Mapping
- [ ] Initialize Django project structure in `backend/` with modular app layout (`accounts`, `academics`, `profiles`, `timetable`, `attendance`, `exams`, `finance`, `analytics`).
- [ ] Map Django models precisely to existing PostgreSQL tables using `db_table` and exact column definitions to prevent any schema damage.
- [ ] Configure database settings supporting PostgreSQL connection via environment variables with a fallback SQLite configuration for immediate test runner validation.
- [ ] Implement Custom User Model (`CustomUser`) mapping to `users`, linked to `roles` and `role_permissions`.
- [ ] Build Authentication & Token API (`/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/refresh`).
- [ ] Seed base system roles (`super_admin`, `school_admin`, `teacher`, `student`, `parent`, `accountant`) and default admin user if tables are empty.

---

### Phase 3: Core Academic & Student Operations (DRF APIs)
- [ ] **Academics API**: CRUD endpoints for `academic_years`, `terms`, `class_levels`, `sections`, `subjects`, and `enrollments`.
- [ ] **Profiles API**: Endpoints for `student_profiles`, `teacher_profiles`, `parent_profiles`, and `student_parent` link management.
- [ ] **Timetable Engine**: CRUD for `timetables` with real-time server-side conflict detection (preventing teacher double-booking, section room collision, and overlapping time slots).
- [ ] **Attendance Service**: Endpoints for session attendance marking, bulk status logging, daily registers, and attendance analytics (% present, absent counts).
- [ ] **Exams & Grading Service**: CRUD for `exam_types`, `marks` recording, validation (`0 <= score <= max_score`), weighted student term mark calculations.
- [ ] **Finance & Billing Ledger**: Endpoints for `fee_types`, `fee_structures`, `student_invoices`, and `payments` with atomic transaction processing and balance calculation.
- [ ] **Smart Analytics & AI Engine**: Rule-based analytics detecting chronic absenteeism (< 85%), academic performance dips, and saving diagnostic observations into `ai_student_notes`.

---

### Phase 4: Frontend Development (React + TypeScript + Vite)
- [ ] Scaffold Vite + React + TypeScript project in `frontend/` with Tailwind CSS, Lucide icons, and modern design tokens.
- [ ] Configure `i18next` with complete English (LTR) and Arabic (RTL) translations, dynamic direction switching (`dir="rtl"` / `dir="ltr"`), and font pairing (Inter + Cairo).
- [ ] Implement robust layout shells:
  - Collapsible Sidebar with active route indicators and role-aware navigation menus.
  - Navbar with language switcher, theme/direction controls, user profile preview, and notification indicators.
- [ ] Build Core UI Components: Data tables with search/pagination, modal dialogs, metric cards, status badges, and tab views.
- [ ] Develop Feature Modules:
  1. **Dashboard**: Role-specific KPI metrics (Total Students, Teachers, Classes, Attendance Rate, Outstanding Fees, Urgent Alerts) with interactive Recharts.
  2. **Students Directory**: Filterable list, student profile viewer, enrollment manager, parent link viewer.
  3. **Academic Structure**: Class levels, sections, subjects, academic years and terms.
  4. **Timetable Viewer & Scheduler**: Grid-based weekly timetable viewer with conflict alerts.
  5. **Attendance Register**: Daily session marker with quick bulk buttons (Mark All Present, toggle Absent/Late) and remarks.
  6. **Gradebook & Report Cards**: Marks entry grid with validation and transcript viewer.
  7. **Financial Management**: Invoices overview, payment collection modal, receipt generator, fee structure table.
  8. **AI Student Notes & Early Intervention**: Warning cards for students requiring intervention, note generator, and insights breakdown.

---

### Phase 5: Testing, Validation & End-to-End Verification
- [ ] Write Django unit and integration tests for API endpoints, role permissions, timetable conflict engine, and financial calculations.
- [ ] Verify both English (LTR) and Arabic (RTL) interface layouts, form inputs, and typography.
- [ ] Verify automated calculation of balances, invoice statuses (PAID, PARTIAL, UNPAID, OVERDUE), and marks aggregations.

---

### Phase 6: Production Readiness & DevOps Configuration
- [ ] Write production-ready `Dockerfile` for Django backend.
- [ ] Write optimized multi-stage `Dockerfile` (or Nginx static server) for React frontend.
- [ ] Provide `docker-compose.yml` orchestrating PostgreSQL, Django API, and Vite/Nginx frontend.
- [ ] Provide `.env.example` with documented environment variables.
- [ ] Write comprehensive `README.md` with installation, running, testing, and migration instructions.
