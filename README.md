# TEBANS

**Tubod Electricity Billing Alert and Notification System**

A web-based billing alert and notification system for Tubod Electric Cooperative in Barangay Tubod, Clarin, Bohol. TEBANS automates SMS notifications for electricity bills, payment confirmations, and disconnection alerts — replacing manual, paper-based communication between the cooperative and its consumers.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Features by Role](#features-by-role)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [SMS Notifications](#sms-notifications)
- [Security](#security)
- [Team](#team)

---

## Overview

TEBANS addresses the common billing challenges of Tubod Electric Cooperative:

- Manual billing processes with no automated notifications
- Delayed communication between meter readers, cashiers, and consumers
- No centralized record of billing history and payments

The system provides four role-specific dashboards for **Admin**, **Meter Reader**, **Cashier**, and **Consumer**, each with tailored features and access control.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | MySQL |
| Authentication | JWT + bcryptjs |
| SMS Gateway | httpSMS API |
| State Management | TanStack React Query |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Version Control | Git + GitHub |
| IDE | Visual Studio Code |

---

## System Architecture

TEBANS uses a **unified Next.js architecture** — the frontend and backend live in the same project. There is no separate Express server.

```
Browser
  └── Next.js (localhost:3000)
        ├── Frontend  →  /admin, /consumer, /meter-reader, /cashier
        └── Backend   →  /api/**  (Next.js API Route Handlers)
              └── MySQL Database
```

### MVC Pattern (adapted for Next.js)

| Layer | Files | Role |
|---|---|---|
| Model | `src/types/index.ts`, `src/lib/db.ts` | Data structures and DB connection |
| View | `src/app/**/page.tsx`, `src/components/**` | UI pages and components |
| Controller | `src/proxy.ts`, `src/lib/auth-helpers.ts`, `src/app/api/**` | Route protection, auth, business logic |

---

## Features by Role

### Admin
- View system dashboard (total active consumers, pending disconnections, recent registrations)
- Manage staff accounts (Meter Readers and Cashiers) — create, edit, activate, deactivate
- View and manage consumer accounts — activate, deactivate
- Change account password

### Meter Reader
- View and search assigned consumer accounts
- Register new consumer accounts
- Record meter readings and generate bills (amount entered from BOHECO billing report)
- View consumer billing details
- Batch input mode — process multiple consumers in sequence
- View overdue accounts and submit disconnection requests with SMS notification
- View payment collection records
- Change account password

### Cashier
- View daily dashboard (total collections, transactions processed, pending remittance, pending consumers)
- Process consumer payments (single or multiple bills)
- View collection reports with date range filter and CSV export
- Change account password

### Consumer
- View current balance and due date
- View complete billing history
- View payment transaction history
- View personal profile (read-only)
- Change account password

---

## Project Structure

```
tebans/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   │   └── page.tsx                   # Login page UI
│   │   ├── admin/
│   │   │   ├── accounts/page.tsx          # Consumer accounts management UI
│   │   │   ├── dashboard/page.tsx         # Admin dashboard stats UI
│   │   │   ├── settings/page.tsx          # Admin settings/password change UI
│   │   │   ├── staff/new/page.tsx         # New staff registration UI
│   │   │   └── layout.tsx                 # Admin layout & navigation
│   │   ├── cashier/
│   │   │   ├── collections/page.tsx       # Collections report UI
│   │   │   ├── dashboard/page.tsx         # Cashier dashboard stats UI
│   │   │   ├── payments/new/page.tsx      # Process new payment UI
│   │   │   ├── settings/page.tsx          # Cashier settings/password change UI
│   │   │   └── layout.tsx                 # Cashier layout & navigation
│   │   ├── consumer/
│   │   │   ├── bills/page.tsx             # Consumer billing history UI
│   │   │   ├── payments/page.tsx          # Consumer payment history UI
│   │   │   ├── profile/page.tsx           # Consumer profile details UI
│   │   │   └── layout.tsx                 # Consumer layout & navigation
│   │   ├── meter-reader/
│   │   │   ├── consumers/
│   │   │   │   ├── new/page.tsx           # Consumer registration UI
│   │   │   │   └── page.tsx               # Consumers list UI
│   │   │   ├── disconnections/page.tsx    # Overdue/inactive disconnections UI
│   │   │   ├── payments/page.tsx          # Payment collections viewer UI
│   │   │   ├── readings/
│   │   │   │   ├── batch/page.tsx         # Batch meter reading UI
│   │   │   │   ├── new/page.tsx           # Individual meter reading UI
│   │   │   │   └── page.tsx               # Readings list UI
│   │   │   ├── settings/page.tsx          # Meter reader settings UI
│   │   │   └── layout.tsx                 # Meter reader layout & navigation
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts         # User authentication endpoint
│   │   │   │   ├── logout/route.ts        # Clear session endpoint
│   │   │   │   └── change-password/route.ts # General change password endpoint
│   │   │   ├── admin/
│   │   │   │   ├── auth/change-password/route.ts # Admin specific password change
│   │   │   │   ├── consumers/route.ts     # List all consumers
│   │   │   │   ├── consumers/[consumerId]/status/route.ts # Toggle consumer active status
│   │   │   │   ├── dashboard/route.ts     # Admin dashboard statistics
│   │   │   │   ├── staff/route.ts         # List and create staff
│   │   │   │   ├── staff/[userId]/route.ts # Update staff details
│   │   │   │   └── staff/[userId]/status/route.ts # Toggle staff status
│   │   │   ├── cashier/
│   │   │   │   ├── auth/change-password/route.ts # Cashier specific password change
│   │   │   │   ├── bills/unpaid/route.ts  # List all unpaid bills
│   │   │   │   ├── collections/route.ts   # Cashier collections report
│   │   │   │   ├── dashboard/route.ts     # Cashier dashboard statistics
│   │   │   │   └── payments/route.ts      # Process payments endpoint
│   │   │   ├── consumer/
│   │   │   │   ├── auth/change-password/route.ts # Consumer specific password change
│   │   │   │   ├── bills/route.ts         # List all bills for consumer
│   │   │   │   ├── bills/current/route.ts # Get current active bill
│   │   │   │   ├── bills/history/route.ts # Get billing history
│   │   │   │   ├── payments/route.ts      # Get payment history
│   │   │   │   └── profile/route.ts       # Get consumer profile details
│   │   │   ├── meter-reader/
│   │   │   │   ├── auth/change-password/route.ts # Meter reader specific password change
│   │   │   │   ├── consumers/route.ts     # List consumers in assigned area
│   │   │   │   ├── consumers/batch/route.ts # List consumers for batch processing
│   │   │   │   ├── consumers/[consumerId]/route.ts # Get specific consumer details
│   │   │   │   ├── consumers/[consumerId]/bill/route.ts # Get consumer bills
│   │   │   │   ├── consumers/[consumerId]/previous-reading/route.ts # Get last meter reading
│   │   │   │   ├── disconnections/route.ts # Process disconnections
│   │   │   │   ├── disconnections/inactive/route.ts # List inactive disconnections
│   │   │   │   ├── disconnections/overdue/route.ts # List overdue disconnections
│   │   │   │   ├── payments/route.ts      # View payments in assigned area
│   │   │   │   ├── profile/route.ts       # Get meter reader profile
│   │   │   │   └── readings/route.ts      # Record meter reading and generate bill
│   │   │   ├── debug/route.ts             # Debugging utility endpoint
│   │   │   ├── hash/route.ts              # Password hashing utility endpoint
│   │   │   ├── health/route.ts            # API health check endpoint
│   │   │   └── test-sms/route.ts          # SMS gateway testing endpoint
│   │   ├── globals.css                    # Tailwind CSS definitions
│   │   ├── layout.tsx                     # Global Root Layout
│   │   └── page.tsx                       # Landing/Home page
│   ├── components/
│   │   ├── ui/                            # Button, Input, Badge, Modal, etc.
│   │   ├── layout/                        # Sidebar, Header, DashboardLayout
│   │   └── shared/                        # DataTable, SearchBar, StatCard, etc.
│   ├── lib/
│   │   ├── db.ts                          # MySQL connection pool
│   │   ├── db-helpers.ts                  # Query execution helpers
│   │   ├── auth-helpers.ts                # JWT and role-based access helpers
│   │   ├── auth-context.tsx               # React Auth Provider context
│   │   ├── use-role-guard.ts              # Custom hook for role-based protection
│   │   ├── api.ts                         # Axios interceptor setup
│   │   ├── error-handler.ts               # Standard API error formatter
│   │   ├── validators.ts                  # Input schema validations (Zod)
│   │   ├── rate-limiter.ts                # Request rate limiting utility
│   │   ├── logger.ts                      # Backend structured logger
│   │   └── services/
│   │       ├── billing.service.ts         # Billing core logic
│   │       ├── payment.service.ts         # Payment processing logic
│   │       └── sms.service.ts             # SMS notification logic
│   ├── types/
│   │   └── index.ts                       # TypeScript interfaces and types
│   └── proxy.ts                           # Global RBAC route guard
├── .env.local                             # Environment variables
├── next.config.ts                         # Next.js configuration
└── package.json                           # Project dependencies
```

---

## Database Schema

The database consists of 11 tables:

| Table | Description |
|---|---|
| `Login` | Authentication credentials for all users |
| `User` | Staff accounts (Admin, Meter Reader, Cashier) |
| `Admin` | Admin-specific records |
| `MeterReader` | Meter reader records with assigned area |
| `Cashier` | Cashier records with assigned area |
| `Consumer` | Consumer account information |
| `MeterReading` | Physical meter readings recorded by meter readers |
| `Bill` | Generated bills with amount (from BOHECO) and due date |
| `Payment` | Payment transactions processed by cashiers |
| `DisconnectionRequest` | Disconnection requests for overdue accounts |
| `Notification` | Log of all SMS notifications sent |

### ID Format

All records use sequential IDs for readability:

| Table | Format | Example |
|---|---|---|
| MeterReading | `MR-YYYY-NNN` | `MR-2026-001` |
| Bill | `BILL-YYYY-NNN` | `BILL-2026-001` |
| Payment | `PAY-YYYY-NNN` | `PAY-2026-001` |
| Receipt | `RCP-YYYY-NNN` | `RCP-2026-001` |
| DisconnectionRequest | `DISC-YYYY-NNN` | `DISC-2026-001` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- httpSMS account + Android phone (for SMS)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/tebans.git
cd tebans
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file at the root:

```env
NEXT_PUBLIC_API_URL=/api

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tebans_db

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

HTTPSMS_API_KEY=your_httpsms_api_key
HTTPSMS_PHONE_NUMBER=+639XXXXXXXXX
```

### 4. Set Up the Database

Open MySQL Workbench or your MySQL terminal and run the schema file:

```sql
-- Run src/lib/schema.sql
-- Then run src/lib/seed.sql to create the default admin account
```

Default admin credentials after seeding:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@1234` |

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DB_HOST` | MySQL host | Yes |
| `DB_PORT` | MySQL port (default: 3306) | Yes |
| `DB_USER` | MySQL username | Yes |
| `DB_PASSWORD` | MySQL password | Yes |
| `DB_NAME` | Database name (`tebans_db`) | Yes |
| `JWT_SECRET` | Secret key for signing JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `1d`) | Yes |
| `HTTPSMS_API_KEY` | httpSMS API key | For SMS |
| `HTTPSMS_PHONE_NUMBER` | Registered phone number in E.164 format | For SMS |

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require a valid JWT token passed as an `httpOnly` cookie (set automatically on login) or via the `Authorization: Bearer <token>` header for Postman testing.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login for all roles |
| POST | `/api/auth/logout` | Any | Clear auth cookies |
| PUT | `/api/auth/change-password` | Any | Change password |
| PUT | `/api/admin/auth/change-password` | Admin | Change admin password |
| PUT | `/api/consumer/auth/change-password` | Consumer | Change consumer password |
| PUT | `/api/meter-reader/auth/change-password` | Meter Reader | Change meter reader password |
| PUT | `/api/cashier/auth/change-password` | Cashier | Change cashier password |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/staff` | List all staff |
| POST | `/api/admin/staff` | Create staff account |
| PUT | `/api/admin/staff/[userId]` | Update staff account |
| PATCH | `/api/admin/staff/[userId]/status` | Toggle staff status |
| GET | `/api/admin/consumers` | List all consumers |
| PATCH | `/api/admin/consumers/[consumerId]/status` | Toggle consumer status |

### Consumer

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/consumer/profile` | Get own profile |
| GET | `/api/consumer/bills` | Get all bills |
| GET | `/api/consumer/bills/current` | Get current balance |
| GET | `/api/consumer/bills/history` | Get billing history |
| GET | `/api/consumer/payments` | Get payment history |

### Meter Reader

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meter-reader/consumers` | List consumers |
| GET | `/api/meter-reader/consumers/batch` | List consumers in batch mode |
| POST | `/api/meter-reader/consumers` | Register new consumer |
| PUT | `/api/meter-reader/consumers/[consumerId]` | Update consumer |
| GET | `/api/meter-reader/consumers/[consumerId]/bill` | View consumer bills |
| GET | `/api/meter-reader/consumers/[consumerId]/previous-reading` | Get last reading |
| POST | `/api/meter-reader/readings` | Record meter reading + generate bill |
| GET | `/api/meter-reader/disconnections/overdue` | List overdue accounts |
| GET | `/api/meter-reader/disconnections/inactive` | List inactive accounts |
| POST | `/api/meter-reader/disconnections` | Submit disconnection request |
| GET | `/api/meter-reader/payments` | View payment collection |
| GET | `/api/meter-reader/profile` | Get own profile |

### Cashier

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cashier/dashboard` | Dashboard stats |
| GET | `/api/cashier/bills/unpaid` | List unpaid bills |
| POST | `/api/cashier/payments` | Process payment |
| GET | `/api/cashier/collections` | Collection reports |

---

## SMS Notifications

TEBANS uses [httpSMS](https://httpsms.com) to send SMS messages through a registered Android phone.

Three events trigger automatic SMS notifications:

| Event | Trigger | Recipient |
|---|---|---|
| Bill generated | Meter reader records a reading | Consumer |
| Disconnection request | Meter reader submits disconnection | Consumer |
| Payment received | Cashier processes a payment | Consumer |

### SMS Setup

1. Create a free account at [httpsms.com](https://httpsms.com)
2. Download and install the httpSMS Android app on the phone registered as the sender
3. Copy your API key from the Settings page
4. Add the API key and phone number to `.env.local`
5. Keep the app open and connected on the phone for SMS to send

### Phone Number Format

Consumer contact numbers are automatically formatted to E.164 format:

```
09123456789   →   +639123456789
9123456789    →   +639123456789
+639123456789 →   +639123456789  (unchanged)
```

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs with salt rounds = 10 |
| Authentication | JWT stored in httpOnly cookie |
| Role-based access | `requireRole()` on every protected endpoint |
| Route protection | `proxy.ts` guards all non-API routes |
| Brute force protection | In-memory rate limiter — 10 attempts per 15 minutes |
| Input validation | `validators.ts` for required fields, passwords, phone numbers |
| Input sanitization | `sanitizeString()` strips `<>` from all text inputs |
| SQL injection | Parameterized queries via `mysql2` |
| XSS | React escapes HTML by default |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| CSRF | `sameSite: lax` on all cookies |

---

## Team

| Name | Role | Responsibilities |
|---|---|---|
| Charles Carcallas | Backend Developer / UI-UX Designer | System design, DFDs, ERD, database schema, UI design, backend API development, documentation |
| Mary Tiffany Busalanan | Frontend Developer / QA Tester | Requirements gathering, frontend development, UI components, testing, quality assurance |
| Krisha Mae Basio | Project Support / System Integrator | Project planning, documentation, database implementation, feature integration, deployment |

**Institution:** Bohol Island State University — Clarin Campus
**Course:** Software Engineering 2 (BSCS 2B)
**Academic Year:** 2025–2026

---

## License

This project was developed as a midterm requirement for Software Engineering 2. All rights reserved by the development team and Bohol Island State University.