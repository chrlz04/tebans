# TEBANS Codebase Audit Report

## Audit Scope
This report cross-references the functional requirements listed in `REQUIREMENTS.md` with the current Next.js and SQL codebase of the Tubod Electricity Billing Alert and Notification System (TEBANS). It identifies which requirements are fully implemented, partially implemented, or missing, and highlights undocumented features discovered in the codebase.

---

## 1. Requirement Implementation Status

### Fully Implemented
The following requirements are fully functional and align completely with the specification.

| Requirement ID | Description | Notes / Evidence |
|---|---|---|
| **FR-01** | Login Account | Implemented via Next.js API `src/app/api/auth/login/route.ts` using bcrypt for password hashing and JWT for authentication. Validates username, password, and active account status. |
| **FR-02** | Change Password | Implemented via `src/app/api/auth/change-password/route.ts`. Validates current password, enforces minimum length and character requirements (verified in `src/lib/validators.ts`), and successfully issues a fresh JWT. |
| **FR-03** | View Admin Dashboard | Implemented in `src/app/admin/dashboard/page.tsx` and `src/app/api/admin/dashboard/route.ts`. Retrieves active consumer count, pending disconnections, and recent registrations as specified. |
| **FR-04** | View Staff Accounts | Implemented in `src/app/admin/accounts/page.tsx` and `src/app/api/admin/staff/route.ts`. Search filter works for name, user ID, or role. |
| **FR-05** | View Consumer Accounts | Implemented in `src/app/admin/accounts/page.tsx` and `src/app/api/admin/consumers/route.ts`. Search filter works for name, ID, or area. |
| **FR-06** | Manage Registered Accounts | Implemented via `src/app/api/admin/staff/[userId]/status/route.ts` and `src/app/api/admin/consumers/[consumerId]/status/route.ts`. Status toggling allows activation and deactivation. |
| **FR-07** | Create Staff Account | Implemented in `src/app/api/admin/staff/route.ts`. Generates ID, enforces constraints, and properly initializes account status. |
| **FR-08** | Update Staff Account | Implemented in `src/app/api/admin/staff/[userId]/route.ts`. Modifies staff information safely. |
| **FR-10** | View Profile (Consumer) | Implemented in `src/app/api/consumer/profile/route.ts`. Accurately surfaces read-only personal information and location data. |
| **FR-12** | View Consumer Account (Meter Reader) | Implemented in `src/app/api/meter-reader/consumers/route.ts`. Searches and limits data scope to the meter reader's assigned area. |
| **FR-13** | View Consumer Bill (Meter Reader) | Implemented in `src/app/api/meter-reader/consumers/[consumerId]/bill/route.ts`. Displays required properties including due dates and reading amounts. |
| **FR-14** | Update Consumer Account | Implemented in `src/app/api/meter-reader/consumers/[consumerId]/route.ts`. Successfully updates Consumer and User tables. |
| **FR-15** | Generate Bill | Implemented in `src/app/api/meter-reader/readings/route.ts`. Inserts reading, calculates bill, creates notification logs, and automatically triggers an SMS via `src/lib/services/sms.service.ts`. |
| **FR-16** | Create Consumer Accounts | Implemented in `src/app/api/meter-reader/consumers/route.ts`. Generates sequential IDs and enforces duplicate constraints on meter serial number. |
| **FR-17** | Display Overdue Accounts | Implemented in `src/app/api/meter-reader/disconnections/overdue/route.ts`. Groups unpaid bills past their due dates. |
| **FR-18** | Send Disconnection Request | Implemented in `src/app/api/meter-reader/disconnections/route.ts`. Registers request and triggers automated SMS alerts. |
| **FR-19** | View Payment Collection | Implemented in `src/app/api/cashier/collections/route.ts`. Supports robust date-range filtering. |
| **FR-20** | View Cashier Dashboard | Implemented in `src/app/api/cashier/dashboard/route.ts` and `src/app/cashier/dashboard/page.tsx`. Calculates detailed daily activity. |
| **FR-21** | Record Payment Transaction | Implemented in `src/app/api/cashier/payments/route.ts` utilizing `src/lib/services/payment.service.ts`. Generates a receipt, deducts balances, and toggles payment states. |
| **FR-22** | View Consumer Bill (Cashier) | Implemented in `src/app/api/cashier/bills/unpaid/route.ts`. Searches and correctly filters bills for payment selection. |


### Partially Implemented
The following requirements have been implemented but lack specific minor details mandated by `REQUIREMENTS.md`.

| Requirement ID | Description | Notes / Missing Elements |
|---|---|---|
| **FR-09** | View Billing History | **Missing Element:** The requirement specifies displaying the "reading date" for each billing period. The `src/app/api/consumer/bills/history/route.ts` API endpoint successfully fetches the history but only returns the `Due_Date` and `Billing_Month`. The `Date_Recorded` (reading date) from the `MeterReading` table is omitted. |
| **FR-11** | Payment History | **Missing Element:** The requirement states the consumer can search by "date and bill ID". However, the `src/app/api/consumer/payments/route.ts` endpoint only supports filtering by `year` and `Receipt_Number`, not by specific dates or bill IDs. |


### Missing
There are no fully missing functional requirements from the specified scope.

---

## 2. Undocumented Features (Proposed Functional Requirements)

During the codebase audit, several robust features were discovered that are fully implemented but entirely absent from `REQUIREMENTS.md`. To ensure the documentation is fully aligned with the software deliverables, the following formal requirements are proposed for inclusion:

**Proposed FR-23: Batch Meter Reading (Bulk Upload)**
The system shall allow the Meter Reader to upload a batch file (Excel `.xlsx` or CSV) containing multiple meter readings to process them simultaneously. The system shall validate the entire file, verifying account numbers, reading validity, and ensuring no duplicate bills exist for the billing month. If validation succeeds, the system shall process all readings within a single transaction to maintain data integrity. (Implemented in `src/app/meter-reader/readings/batch/page.tsx` and `src/app/api/meter-reader/readings/bulk/route.ts`).

**Proposed FR-24: Batch SMS Streaming Notification**
Following a successful bulk upload of meter readings, the system shall provide the Meter Reader with the option to send SMS notifications to all affected consumers sequentially. The system shall process these messages using a Server-Sent Events (SSE) streaming endpoint, delivering real-time progress updates to the dashboard, and adhering to system-defined batch limits and rate delays. (Implemented in `src/app/api/meter-reader/readings/bulk/sms/stream/route.ts`).

**Proposed FR-25: View SMS Notification History**
The system shall provide the Meter Reader with an interface to view the status of SMS notifications sent during the current billing cycle. The list shall display the consumer name, bill details, and whether the SMS notification was successfully sent or failed. (Implemented in `src/app/api/meter-reader/sms/route.ts`).

**Proposed FR-26: Manage Service Areas**
The system shall allow the Admin to manage the distinct geographic regions (Service Areas/Puroks) used by the system to assign staff and categorize consumers. The Admin can create, rename, and securely delete areas, with the system providing warnings if a deletion would orphan assigned staff or consumers. (Implemented in `src/app/admin/settings/areas/page.tsx` and `src/app/api/admin/areas/route.ts`).

**Proposed FR-27: Configure SMS Provider Settings**
The system shall allow the Admin to configure the underlying API connection settings for the system's SMS gateway provider. The Admin can update API URLs, API Keys, authentication headers, and batch sending rules (such as rate limits and delays) directly through the interface to ensure continuous message delivery. (Implemented in `src/app/admin/settings/sms/page.tsx` and `src/app/api/admin/sms-settings/route.ts`).

**Proposed FR-28: Configure Billing Cycle Settings**
The system shall allow the Admin to modify the global billing cycle boundaries (start and end dates) used for generating dashboard reports and setting automatic due dates. The system shall save these changes in a "pending" state and automatically apply them on the first day of the following cycle to avoid disrupting active reporting periods. (Implemented in `src/app/admin/settings/billing-cycle/page.tsx` and `src/app/api/admin/settings/billing-cycle/route.ts`).

**Proposed FR-29: Manage Disconnection Requests (Admin)**
The system shall allow the Admin to view a consolidated list of all pending and executed disconnection requests submitted by Meter Readers. The Admin can review the specific details (consumer, amount due, reason, and scheduled date) and manually mark pending requests as "Executed" once the physical disconnection is complete. (Implemented in `src/app/admin/disconnections/page.tsx` and `src/app/api/admin/disconnections/route.ts`).

**Proposed FR-30: View Staff Profiles**
The system shall allow Staff members (Admin, Cashier, and Meter Reader) to view their personal account profile information. The system retrieves the staff's details from the respective role table and displays their name, contact number, role-specific ID, and assigned area (if applicable). This is a read-only view that allows the staff member to verify that their information on file is accurate. (Implemented in `src/app/admin/profile/page.tsx`, `src/app/cashier/profile/page.tsx`, and `src/app/meter-reader/profile/page.tsx`).