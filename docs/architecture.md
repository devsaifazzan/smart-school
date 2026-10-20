# System Architecture & Technical Design

## 1. High-Level Architecture Overview

The Smart School Management System (SSMS) is built as a multi-tier, decoupled, API-driven enterprise web application:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Browser / Mobile)             │
│   React 18 + TypeScript + Vite + Tailwind CSS + Lucide      │
│   TanStack Query + React Hook Form + Zod + Recharts         │
│   Dual-Language: English (LTR) / Arabic (RTL) via i18next   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Gateway / Reverse Proxy          │
│                (Nginx / Caddy / Traefik in Prod)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend Layer: Django & DRF                 │
│   Python 3.12 + Django REST Framework                       │
│   Modular Domain-Driven Apps (`apps/accounts`, etc.)         │
│   Role-Based Authorization & Custom Permission Backends     │
│   Service Layer for Complex Business Logic & Validation     │
└──────────────────────────────┬──────────────────────────────┘
                               │ ORM / Connection Pool
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Data Persistence Layer: PostgreSQL            │
│   Existing `ssms_db` schema (22 tables preserved)           │
│   ACID Transactions, Foreign Key Constraints, Indexes       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture (Django & DRF)

### 2.1 Project Layout
```
backend/
├── config/                  # Django project configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py         # Modular base, dev, prod settings
│   ├── urls.py             # Root URL routing (/api/v1/...)
│   └── wsgi.py
├── apps/                    # Business Domain Modules
│   ├── accounts/           # User authentication, roles, role_permissions
│   ├── academics/          # Academic years, terms, class levels, sections, subjects, enrollments
│   ├── profiles/           # Student, teacher, and parent profiles & guardian relationships
│   ├── timetable/          # Timetable schedules and scheduling conflict detection engine
│   ├── attendance/         # Session attendance recording, status enum, bulk logging
│   ├── exams/              # Exam types, marks, weighted score calculations, report cards
│   ├── finance/            # Fee types, fee structures, invoices, payments, balances
│   └── analytics/          # AI student notes, automated early intervention flags, metrics
├── manage.py
└── requirements.txt
```

### 2.2 Domain Decomposition and Existing Table Mapping

| App Name | Existing DB Tables (`db_table`) | Core Responsibilities |
|---|---|---|
| `accounts` | `users`, `roles`, `role_permissions` | Custom auth user model, JWT / session tokens, RBAC permission checker |
| `academics` | `academic_years`, `terms`, `class_levels`, `sections`, `subjects`, `enrollments` | School calendar, classroom capacity, course rosters, promotion workflows |
| `profiles` | `student_profiles`, `teacher_profiles`, `parent_profiles`, `student_parent` | Demographic profiles, family relationships, emergency/medical info |
| `timetable` | `timetables` | Slot scheduling, teacher/classroom collision prevention |
| `attendance` | `attendance` | Daily/period attendance logging, absence analytics |
| `exams` | `exam_types`, `marks` | Assessment management, marks recording, transcripts |
| `finance` | `fee_types`, `fee_structures`, `student_invoices`, `payments` | Billing, payment processing, invoice generation, arrears tracking |
| `analytics` | `ai_student_notes` | Algorithmic & AI diagnostic insights, student risk scoring |

### 2.3 Database Mapping Strategy
* All models explicitly define `db_table = 'exact_table_name'` to preserve the existing database.
* Sequences (`nextval('..._seq'::regclass)`) and Primary Keys (`id = models.AutoField(primary_key=True)`) match the database catalog.
* Foreign keys explicitly define `db_column='...'` to maintain referential fidelity without altering column names.
* Critical multi-table updates (e.g. Invoicing + Payment recording, Timetable checks) are executed inside atomic transactions (`@transaction.atomic`).

---

## 3. Frontend Architecture (React + TypeScript + Vite)

### 3.1 Directory Organization
```
frontend/
├── src/
│   ├── api/                 # Axios / fetch client with auth interceptors
│   ├── components/          # Reusable UI library (Button, Modal, Input, DataTable, Badge...)
│   │   ├── ui/
│   │   ├── layout/          # Sidebar, Navbar, PageHeader, Breadcrumbs
│   │   └── forms/           # FormField, Select, DatePicker
│   ├── contexts/            # AuthContext, ThemeContext, LanguageContext
│   ├── features/            # Feature modules
│   │   ├── dashboard/       # Metric cards, charts, activity feeds
│   │   ├── students/        # Student directory, profile view, enrollment dialog
│   │   ├── academics/       # Academic years, classes, sections, subjects
│   │   ├── timetable/       # Timetable grid & conflict validator
│   │   ├── attendance/      # Attendance sheet, bulk register, reports
│   │   ├── exams/           # Marks entry sheet, gradebook, transcripts
│   │   ├── finance/         # Invoices, payment modal, receipts, fee matrix
│   │   └── analytics/       # AI insights, at-risk student tracker
│   ├── hooks/               # Custom hooks (useAuth, useDirection, usePermissions)
│   ├── i18n/                # Dual locale configurations (en.json, ar.json)
│   ├── types/               # TypeScript interfaces for API models & schemas
│   ├── App.tsx              # Router configuration with protected routes
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 3.2 Dual Language & Directionality (RTL / LTR)
* Seamless switching between **English (LTR)** and **Arabic (RTL)**.
* Setting `<html dir="rtl" lang="ar">` or `<html dir="ltr" lang="en">` dynamically adjusts:
  * Sidebar alignment (left on LTR, right on RTL).
  * Table text alignment and column orders.
  * Form labels and chevron icons.
  * Flex and Grid flows.
* Uses Cairo and Inter typography tailored for Arabic and English legibility.

---

## 4. API & Integration Design

* **Base URL**: `/api/v1/`
* **Format**: Standard JSON payloads with consistent envelope format:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional human-readable feedback"
  }
  ```
* **Error Envelope**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Field errors present",
      "details": { "score": ["Score cannot exceed maximum score."] }
    }
  }
  ```
* **Pagination**: Standard Limit/Offset or PageNumber pagination for datasets (`results`, `count`, `next`, `previous`).
* **Authentication**: Token / Bearer Authentication with secure HTTP headers.
