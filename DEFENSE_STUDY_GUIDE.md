# DEFENSE STUDY GUIDE

Welcome. As your computer science instructor, I have reviewed your repository and identified the 3 most complex logic files that form the critical backbone of your system's architecture. It is imperative that you fully comprehend these files, as they dictate routing and authorization, payment transaction integrity, and accurate financial penalty assessment.

For each file, you will find the exact code snippet, a rigorous step-by-step breakdown of its operations, and a clear explanation of the cascading failures that would occur should any part of it be removed. Study this guide thoroughly.

## 1. Next.js 16 Proxy Configuration (`src/proxy.ts`)

This file is responsible for handling routing and role-based access control (RBAC) since you opted not to use the standard Next.js `middleware.ts`.

### Exact Code Snippet

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rolePermissions: Record<string, string[]> = {
  admin:        ['/admin'],
  consumer:     ['/consumer'],
  meter_reader: ['/meter-reader'],
  cashier:      ['/cashier'],
}

const roleHomePages: Record<string, string> = {
  admin:        '/admin/dashboard',
  consumer:     '/consumer/bills',
  meter_reader: '/meter-reader/consumers',
  cashier:      '/cashier/dashboard',
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value
  const role  = req.cookies.get('role')?.value

  // Allow public routes
  if (pathname === '/login' || pathname === '/') {
    if (token && role && roleHomePages[role]) {
      return NextResponse.redirect(new URL(roleHomePages[role], req.url))
    }
    return NextResponse.next()
  }

  // No token — redirect to login
  if (!token || !role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check role permissions
  const allowedPaths = rolePermissions[role] || []
  const isAllowed = allowedPaths.some((path) => pathname.startsWith(path))

  if (!isAllowed) {
    return NextResponse.redirect(new URL(roleHomePages[role], req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.ico$).*)',
  ],
}
```

### Step-by-Step Breakdown

1. **Role Mappings Definition:** `rolePermissions` and `roleHomePages` establish the access rights and default landing pages for each user role (`admin`, `consumer`, `meter_reader`, `cashier`).
2. **API Route Bypass:** The proxy intercepts requests but explicitly bypasses any path starting with `/api` (`if (pathname.startsWith('/api'))`), shifting the authentication responsibility to the individual API handlers.
3. **Cookie Extraction:** It attempts to extract the `token` and `role` from the request's cookies. This is your primary mechanism for identifying an authenticated session.
4. **Public Route Handling:** If the requested path is `/login` or `/`, the proxy checks if an authenticated session exists. If it does, the user is immediately redirected to their designated homepage, preventing them from accessing the login page unnecessarily. If not, the request proceeds normally.
5. **Authentication Check:** For any non-public, non-API route, if either the `token` or `role` is missing, the proxy forcefully redirects the request to the `/login` page.
6. **Authorization Check:** The proxy retrieves the allowed paths for the user's role from `rolePermissions`. It then verifies if the requested `pathname` starts with any of those allowed paths.
7. **Access Denial / Enforcement:** If the user attempts to access a path not authorized for their role, the proxy intervenes and redirects them back to their role-specific homepage.
8. **Next middleware config:** The `config` object uses a complex regular expression to exclude static assets (images, Next.js internal files) from passing through the proxy, optimizing performance.

### **What Breaks If Deleted**

If this proxy configuration is deleted or fails, you will experience catastrophic security and routing failures:
*   **Total Loss of Frontend Authentication Enforcement:** Any user, authenticated or not, could navigate directly to sensitive URLs (e.g., `/admin/dashboard`), exposing internal UI structures.
*   **Cross-Role Data Exposure:** A `consumer` could manually change the URL to access the `/cashier` interface. While APIs might still reject them, the frontend would attempt to load unauthorized components.
*   **Routing Loops or Stagnation:** Authenticated users trying to visit `/login` would no longer be redirected, causing confusion. Unauthenticated users trying to access protected routes would see blank pages or frontend errors instead of being cleanly redirected to login.
*   **Static Asset Overhead:** Removing the `matcher` config would force the proxy function to execute for every single image and CSS file, severely degrading server performance.


## 2. Database Transaction Handling (`src/app/api/cashier/payments/route.ts`)

This file manages the critical logic of processing multiple bill payments in a single transaction-like flow.

### Exact Code Snippet

```typescript
import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired, validatePaymentMethod } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { generateSequentialId } from '@/lib/services/billing.service'
import { generateReceiptNumber, recordPayment, updateBillStatus } from '@/lib/services/payment.service'

interface BillRow extends RowDataPacket {
  Bill_ID:        string
  Consumer_ID:    string
  Amount:         number
  Payment_Status: string
}

interface CashierRow extends RowDataPacket {
  Cashier_ID: string
}

export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['cashier'])
    if (error) return error

    const { billIds, paymentMethod } = await req.json()

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return err('At least one bill must be selected', 400)
    }

    const reqError = validateRequired({ paymentMethod }, ['paymentMethod'])
    if (reqError) {
      return err(reqError, 400)
    }

    if (!validatePaymentMethod(paymentMethod)) {
      return err('Invalid payment method', 400)
    }

    // Get cashier ID
    const cashier = await queryOne<CashierRow>(
      'SELECT Cashier_ID FROM Cashier WHERE User_ID = ?',
      [payload!.userId]
    )

    if (!cashier) {
      return err('Cashier record not found', 404)
    }

    // Get all selected bills
    const placeholders = billIds.map(() => '?').join(',')
    const bills = await query<BillRow>(
      `SELECT Bill_ID, Consumer_ID, Amount, Payment_Status
       FROM Bill
       WHERE Bill_ID IN (${placeholders})
         AND Payment_Status != 'Paid'`,
      billIds
    )

    if (bills.length === 0) {
      return err('No valid unpaid bills found', 400)
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()
    const paymentIds: string[] = []

    // Record payment for each bill
    for (const bill of bills) {
      const paymentId = await generateSequentialId('Payment', 'Payment_ID', 'pay')
      paymentIds.push(paymentId)

      await recordPayment({
        paymentId,
        billId:        bill.Bill_ID,
        cashierId:     cashier.Cashier_ID,
        consumerId:    bill.Consumer_ID,
        amountPaid:    bill.Amount,
        paymentMethod,
        receiptNumber,
      })

      // Update bill status
      await updateBillStatus(bill.Bill_ID, bill.Amount)
    }

    const totalAmount = bills.reduce((sum, b) => sum + b.Amount, 0)

    return ok({
      receiptNumber,
      paymentIds,
      totalBills: bills.length,
      totalAmount,
    }, 'Payment recorded successfully')

  } catch (error) {
    logger.error('Process payment error:', error)
    return handleApiError(error)
  }
}
```

### Step-by-Step Breakdown

1. **Authorization & Payload Extraction:** Validates that the request comes from an authenticated `cashier`. It extracts the `billIds` array and `paymentMethod` from the request body.
2. **Input Sanitization:** Ensures that the `billIds` is a non-empty array and validates the `paymentMethod` strictly.
3. **Cashier Identity Verification:** Uses the session user ID to query the `Cashier` table and securely retrieve the associated `Cashier_ID`.
4. **Bill Validation Query:** Constructs a dynamic SQL `IN` clause to fetch all requested bills. Crucially, it filters out any bill where `Payment_Status` is already 'Paid'.
5. **Pre-Flight Checks:** If no valid, unpaid bills are returned, the process halts immediately to prevent double payments or processing errors.
6. **Global Receipt Generation:** Calls `generateReceiptNumber()` once, ensuring that all selected bills in this batch share a single receipt number for tracking.
7. **Iterative Payment Processing:** Loops through each verified unpaid bill:
    *   Generates a unique, sequential `Payment_ID`.
    *   Calls `recordPayment` to insert the payment record into the database, linking the cashier, consumer, bill, amount, and receipt.
    *   Calls `updateBillStatus` to transition the specific bill's state to 'Paid'.
8. **Aggregation & Response:** Calculates the total amount paid using `reduce` and returns a success payload containing the unified receipt number and array of generated payment IDs.

### **What Breaks If Deleted**

If this payment route logic is deleted or altered incorrectly:
*   **Database Corruption via Double-Payment:** Without the `AND Payment_Status != 'Paid'` check, a cashier could process the same bill twice, corrupting financial records.
*   **Orphaned Transactions:** If the `recordPayment` and `updateBillStatus` are unlinked, money could be collected without marking the bill as paid, leading to wrongful service disconnections for consumers.
*   **Receipt Tracking Failure:** Deleting the global receipt generation would make it impossible to audit bulk payments made by a single consumer in one sitting.
*   **Unauthorized Financial Modification:** Without the `requireRole(req, ['cashier'])` check, any user (including consumers) could theoretically forge requests to mark their own bills as paid.


## 3. Overdue Status Logic (`src/app/api/meter-reader/disconnections/overdue/route.ts`)

This file contains the complex aggregation query that determines which consumers are delinquent and calculates their cumulative penalty status.

### Exact Code Snippet

```typescript
import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface OverdueRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Contact_No:     string
  Address:        string
  Amount:         number
  Due_Date:       string
  Request_Status: string | null
  Scheduled_Date: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const today = new Date().toISOString().split('T')[0]

    const overdueAccounts = await query<OverdueRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        c.Address,
        SUM(b.Amount) AS Amount,
        MIN(b.Due_Date) AS Due_Date,
        dr.Request_Status,
        dr.Scheduled_Date
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       JOIN Bill b ON b.Consumer_ID = c.Consumer_ID
       LEFT JOIN DisconnectionRequest dr
         ON dr.Consumer_ID = c.Consumer_ID
         AND dr.Request_Status = 'Pending'
       WHERE
         b.Payment_Status != 'Paid'
         AND b.Due_Date < ?
       GROUP BY
         c.Consumer_ID,
         u.First_Name,
         u.Last_Name,
         u.Contact_No,
         c.Address,
         dr.Request_Status,
         dr.Scheduled_Date
       ORDER BY Due_Date ASC`,
      [today]
    )

    return ok(overdueAccounts.map((o) => ({
      consumerId:     o.Consumer_ID,
      firstName:      o.First_Name,
      lastName:       o.Last_Name,
      contactNo:      o.Contact_No,
      address:        o.Address,
      amountDue:      o.Amount,
      scheduledDate:  o.Scheduled_Date ?? new Date(
        new Date().setDate(new Date().getDate() + 7)
      ).toISOString().split('T')[0],
      requestStatus:  o.Request_Status ?? 'Pending',
      monthsOverdue:  Math.ceil(
        (new Date().getTime() - new Date(o.Due_Date).getTime())
        / (1000 * 60 * 60 * 24 * 30)
      ),
    })))

  } catch (error) {
    console.error('Get overdue accounts error:', error)
    return err('Internal server error', 500)
  }
}
```

### Step-by-Step Breakdown

1. **Time Context Initialization:** Calculates the current date (`today`) in `YYYY-MM-DD` format to serve as the threshold for delinquency.
2. **Complex Multi-Table Query Setup:** Joins four distinct logical entities: `Consumer`, `User` (for personal details), `Bill` (for financial data), and `DisconnectionRequest` (via `LEFT JOIN` to identify existing pending actions).
3. **Filtering Rules:** Applies the `WHERE` clause to filter out any bills that are 'Paid' and ensures only bills where the `Due_Date` is strictly less than `today` are considered.
4. **Data Aggregation (`GROUP BY`):** Groups the results by consumer. This is crucial because a consumer might have multiple unpaid bills across different months.
5. **Financial Calculation (`SUM` and `MIN`):** Calculates the total outstanding balance (`SUM(b.Amount)`) and identifies the oldest delinquent bill (`MIN(b.Due_Date)`) to represent the true age of the debt.
6. **Sorting:** Orders the results by `Due_Date ASC`, prioritizing the accounts that have been delinquent the longest.
7. **Business Logic Mapping:** Transforms the raw database rows into the frontend contract.
    *   It calculates a default `scheduledDate` (7 days from now) if no explicit pending request exists.
    *   It dynamically computes the `monthsOverdue` using timestamp arithmetic relative to the oldest unpaid bill.

### **What Breaks If Deleted**

If this specific route or its SQL query is deleted:
*   **Systemic Failure of the Disconnection Workflow:** The meter reader dashboard will fail to populate the list of delinquent accounts. No disconnections can be legally or procedurally enforced.
*   **Incorrect Penalty Assessments:** Removing the `SUM(b.Amount)` aggregation would cause the system to either miss multiple unpaid bills for a single consumer or duplicate the consumer in the list, confusing the operational staff.
*   **Loss of Contextual Awareness:** The `LEFT JOIN DisconnectionRequest` is critical. Without it, the system would repeatedly generate new, duplicate disconnection warnings for the same user, spamming them with SMS notifications and cluttering the database.
*   **Calculation Errors:** Deleting the `monthsOverdue` logic on the server side would force the frontend to calculate it, potentially leading to timezone or client-side caching discrepancies that misrepresent a consumer's legal standing.