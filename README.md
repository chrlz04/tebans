# TEBANS

**Tubod Electricity Billing Alert and Notification System**

A web-based billing alert and notification system in Barangay Tubod, Clarin, Bohol. TEBANS automates SMS notifications for electricity bills, payment confirmations, and disconnection alerts — replacing manual, paper-based communication between the staff and its consumers.

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
│   │   ├── (auth)/
│   │   │   ├── change-password/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── accounts/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   ├── BillingCycleProgress.tsx
│   │   │   │   │   └── PaymentCollectionProgress.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── areas/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── billing-cycle/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── sms/
│   │   │   │       └── page.tsx
│   │   │   └── staff/
│   │   │       └── new/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── areas/
│   │   │   │   │   ├── [areaId]/
│   │   │   │   │   │   ├── dependencies/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── auth/
│   │   │   │   │   └── change-password/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── consumers/
│   │   │   │   │   ├── [consumerId]/
│   │   │   │   │   │   └── status/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── profile/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── settings/
│   │   │   │   │   └── billing-cycle/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       └── status/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── sms-settings/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── sms-test/
│   │   │   │   │   └── route.ts
│   │   │   │   └── staff/
│   │   │   │       ├── [userId]/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── status/
│   │   │   │       │       └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── areas/
│   │   │   │   └── route.ts
│   │   │   ├── auth/
│   │   │   │   ├── change-password/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   ├── cashier/
│   │   │   │   ├── auth/
│   │   │   │   │   └── change-password/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── bills/
│   │   │   │   │   └── unpaid/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── collections/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   └── route.ts
│   │   │   │   └── profile/
│   │   │   │       └── route.ts
│   │   │   ├── consumer/
│   │   │   │   ├── auth/
│   │   │   │   │   └── change-password/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── bills/
│   │   │   │   │   ├── current/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── history/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   └── route.ts
│   │   │   │   └── profile/
│   │   │   │       └── route.ts
│   │   │   ├── debug/
│   │   │   │   └── route.ts
│   │   │   ├── hash/
│   │   │   │   └── route.ts
│   │   │   ├── health/
│   │   │   │   └── route.ts
│   │   │   ├── meter-reader/
│   │   │   │   ├── auth/
│   │   │   │   │   └── change-password/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── consumers/
│   │   │   │   │   ├── [consumerId]/
│   │   │   │   │   │   ├── bill/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   ├── previous-reading/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── batch/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── disconnections/
│   │   │   │   │   ├── overdue/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── profile/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── readings/
│   │   │   │   │   ├── bulk/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   └── sms/
│   │   │   │   │   │       ├── route.ts
│   │   │   │   │   │       └── stream/
│   │   │   │   │   │           └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── sms/
│   │   │   │   │   └── route.ts
│   │   │   │   └── sms-settings/
│   │   │   │       └── route.ts
│   │   │   ├── settings/
│   │   │   │   └── billing-cycle/
│   │   │   │       └── route.ts
│   │   │   └── test-sms/
│   │   │       └── route.ts
│   │   ├── cashier/
│   │   │   ├── collections/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   └── CashierCollectionProgress.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── payments/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── consumer/
│   │   │   ├── bills/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── payments/
│   │   │   │   └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── meter-reader/
│   │   │   ├── components/
│   │   │   │   └── ConsumerTabs.tsx
│   │   │   ├── consumers/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── payments/
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   ├── MeterReaderBillingProgress.tsx
│   │   │   │   │   └── MeterReaderOverdueAccounts.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── disconnections/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── readings/
│   │   │   │   ├── batch/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── sms/
│   │   │       └── page.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   │   └── SmsSettingsForm.tsx
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── shared/
│   │   │   ├── ChangePasswordForm.tsx
│   │   │   ├── ConsumerBillModal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── EditConsumerModal.tsx
│   │   │   ├── EditStaffModal.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── ui/
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── DueDateBadge.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   └── lib/
│       ├── api.ts
│       ├── auth-context.tsx
│       ├── auth-helpers.ts
│       ├── date-utils.ts
│       ├── db-helpers.ts
│       ├── db.ts
│       ├── error-handler.ts
│       ├── logger.ts
│       ├── psgc.ts
│       ├── rate-limiter.ts
│       ├── schema.sql
│       ├── seed.sql
│       ├── services/
│       │   ├── billing.service.ts
│       │   ├── payment.service.ts
│       │   ├── settings.service.ts
│       │   └── sms.service.ts
│       ├── sms-templates.ts
│       ├── use-role-guard.ts
│       └── validators.ts


```

---

## Database Schema

The database consists of 11 tables:

| Table | Description |
|---|---|
| `Login` | Authentication credentials for all users |
| `User` | Staff and consumer accounts |
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
| MeterReading | `mr-read-NNN` | `mr-read-001` |
| Bill | `bill-NNN` | `bill-001` |
| Payment | `pay-NNN` | `pay-001` |
| Receipt | `RCP-YYYY-NNN` | `RCP-2026-001` |
| DisconnectionRequest | `disc-YYYY-NNN` | `disc-2026-001` |
| Consumer | `consumer-NNN` | `consumer-001` |
| User (Consumer) | `user-consumer-NNN` | `user-consumer-001` |
| Login (Consumer) | `login-consumer-NNN` | `login-consumer-001` |

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
| GET | `/api/admin/profile` | Get admin profile |
| GET | `/api/admin/staff` | List all staff |
| POST | `/api/admin/staff` | Create staff account |
| PUT | `/api/admin/staff/[userId]` | Update staff account |
| PATCH | `/api/admin/staff/[userId]/status` | Toggle staff status |
| GET | `/api/admin/consumers` | List all consumers |
| PATCH | `/api/admin/consumers/[consumerId]/status` | Toggle consumer status |
| GET/POST | `/api/admin/areas` | Manage sub-barangay areas |
| GET/PUT/DEL| `/api/admin/areas/[areaId]` | Update/delete specific area |
| GET | `/api/admin/areas/[areaId]/dependencies` | Check dependencies for area |
| GET/PUT | `/api/admin/settings/billing-cycle` | Manage billing cycle bounds |
| PATCH | `/api/admin/settings/billing-cycle/status` | Toggle automatic cycle updates |
| GET/PUT | `/api/admin/sms-settings` | Manage global SMS credentials |
| POST | `/api/admin/sms-test` | Send a test SMS to verify provider |
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
| GET | `/api/meter-reader/profile` | Get own profile |
| GET | `/api/meter-reader/dashboard` | Dashboard stats |
| GET | `/api/meter-reader/consumers` | List consumers |
| GET | `/api/meter-reader/consumers/batch` | List consumers in batch mode |
| POST | `/api/meter-reader/consumers` | Register new consumer |
| GET/PUT | `/api/meter-reader/consumers/[consumerId]` | View/Update consumer |
| GET | `/api/meter-reader/consumers/[consumerId]/bill` | View consumer bills |
| GET | `/api/meter-reader/consumers/[consumerId]/previous-reading` | Get last reading |
| GET | `/api/meter-reader/readings` | List meter readings |
| POST | `/api/meter-reader/readings` | Record meter reading + generate bill |
| POST | `/api/meter-reader/readings/bulk` | Import bulk readings |
| POST | `/api/meter-reader/readings/bulk/sms` | Send bulk SMS for readings |
| GET | `/api/meter-reader/readings/bulk/sms/stream` | SSE stream for batch SMS |
| GET | `/api/meter-reader/disconnections` | List standard disconnections |
| POST | `/api/meter-reader/disconnections` | Submit disconnection request |
| GET | `/api/meter-reader/disconnections/overdue` | List overdue accounts |
| GET | `/api/meter-reader/payments` | View payment collection |
| GET/PUT | `/api/meter-reader/sms-settings` | Manage SMS configuration |
| GET | `/api/meter-reader/sms` | SMS log / history |
### Cashier

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cashier/profile` | Get own profile |
| GET | `/api/cashier/dashboard` | Dashboard stats |
| GET | `/api/cashier/bills/unpaid` | List unpaid bills |
| POST | `/api/cashier/payments` | Process payment |
| GET | `/api/cashier/collections` | Collection reports |
### Other

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/areas` | Protected | Get list of available areas |
| GET | `/api/health` | Public | API health check endpoint |
| GET | `/api/hash` | Dev | Password hashing utility endpoint |
| GET | `/api/debug` | Dev | Debugging utility endpoint |
| GET | `/api/settings/billing-cycle` | System | Active cycle sync |
| POST | `/api/test-sms` | Dev | SMS gateway test endpoint |
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
