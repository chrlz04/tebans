import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'
import type { AdminBillingProgress, MeterReaderProgress, AdminPaymentProgress, CashierProgress } from '@/types'

interface CountRow extends RowDataPacket {
  count: number
}

interface RecentUser extends RowDataPacket {
  User_ID:           string
  First_Name:        string
  Last_Name:         string
  User_Type:         string
  Account_Status:    string
  Registration_Date: string
}

interface MeterReaderAreaInfo extends RowDataPacket {
  User_ID: string
  First_Name: string
  Last_Name: string
  Assigned_Area_ID: string
  Area_Name: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    // Total active consumers
    const activeConsumers = await queryOne<CountRow>(
      `SELECT COUNT(*) as count
       FROM User
       WHERE User_Type = 'consumer' AND Account_Status = 'Active'`
    )

    // Pending disconnections
    const pendingDisconnections = await queryOne<CountRow>(
      `SELECT COUNT(*) as count
       FROM DisconnectionRequest
       WHERE Request_Status = 'Pending'`
    )

    // Recent registrations (last 5)
    const recentRegistrations = await query<RecentUser>(
      `SELECT
        User_ID,
        First_Name,
        Last_Name,
        User_Type,
        Account_Status,
        Registration_Date
       FROM User
       ORDER BY Registration_Date DESC
       LIMIT 5`
    )

    // Calculate Billing Cycle Progress for current month
    const { year, month } = getManilaDateParts()
    const currentMonthDate = new Date(year, month, 1)
    const currentMonthStr = currentMonthDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' })

    const activeMeterReaders = await query<MeterReaderAreaInfo>(
      `SELECT
        mr.User_ID,
        u.First_Name,
        u.Last_Name,
        mr.Assigned_Area_ID,
        a.Name AS Area_Name
       FROM MeterReader mr
       JOIN User u ON u.User_ID = mr.User_ID
       JOIN Area a ON a.Area_ID = mr.Assigned_Area_ID
       WHERE u.Account_Status = 'Active'`
    )

    const meterReaderBreakdown: MeterReaderProgress[] = []
    let globalTotalConsumers = 0
    let globalBilledConsumers = 0

    for (const mr of activeMeterReaders) {
      const areaTotalRow = await queryOne<CountRow>(
        `SELECT COUNT(c.Consumer_ID) AS count
         FROM Consumer c
         JOIN User u ON u.User_ID = c.User_ID
         WHERE c.Area_ID = ? AND u.Account_Status = 'Active'`,
        [mr.Assigned_Area_ID]
      )

      const areaBilledRow = await queryOne<CountRow>(
        `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
         FROM Bill b
         JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
         JOIN User u ON u.User_ID = c.User_ID
         WHERE c.Area_ID = ?
           AND u.Account_Status = 'Active'
           AND b.Billing_Month = ?`,
        [mr.Assigned_Area_ID, currentMonthStr]
      )

      const totalAreaConsumers = areaTotalRow?.count ?? 0
      const billedAreaConsumers = areaBilledRow?.count ?? 0
      const unbilledAreaConsumers = Math.max(0, totalAreaConsumers - billedAreaConsumers)

      globalTotalConsumers += totalAreaConsumers
      globalBilledConsumers += billedAreaConsumers

      meterReaderBreakdown.push({
        meterReaderId: mr.User_ID,
        firstName: mr.First_Name,
        lastName: mr.Last_Name,
        assignedAreaName: mr.Area_Name,
        totalConsumers: totalAreaConsumers,
        billedConsumers: billedAreaConsumers,
        unbilledConsumers: unbilledAreaConsumers,
      })
    }

    const billingProgress: AdminBillingProgress = {
      totalConsumers: globalTotalConsumers,
      billedConsumers: globalBilledConsumers,
      unbilledConsumers: Math.max(0, globalTotalConsumers - globalBilledConsumers),
      overallCompletion: globalTotalConsumers > 0 ? Math.round((globalBilledConsumers / globalTotalConsumers) * 100) : 0,
      meterReaderBreakdown,
    }

    // Calculate Payment Collection Progress for current month
    const activeCashiers = await query<MeterReaderAreaInfo>(
      `SELECT
        c.User_ID,
        u.First_Name,
        u.Last_Name,
        c.Assigned_Area_ID,
        a.Name AS Area_Name
       FROM Cashier c
       JOIN User u ON u.User_ID = c.User_ID
       JOIN Area a ON a.Area_ID = c.Assigned_Area_ID
       WHERE u.Account_Status = 'Active'`
    )

    const cashierBreakdown: CashierProgress[] = []
    let globalPaymentTotalConsumers = 0
    let globalPaidConsumers = 0

    for (const c of activeCashiers) {
      const areaTotalRow = await queryOne<CountRow>(
        `SELECT COUNT(co.Consumer_ID) AS count
         FROM Consumer co
         JOIN User u ON u.User_ID = co.User_ID
         WHERE co.Area_ID = ? AND u.Account_Status = 'Active'`,
        [c.Assigned_Area_ID]
      )

      const areaPaidRow = await queryOne<CountRow>(
        `SELECT COUNT(DISTINCT p.Consumer_ID) AS count
         FROM Payment p
         JOIN Bill b ON p.Bill_ID = b.Bill_ID
         JOIN Consumer co ON co.Consumer_ID = p.Consumer_ID
         JOIN User u ON u.User_ID = co.User_ID
         WHERE co.Area_ID = ?
           AND u.Account_Status = 'Active'
           AND MONTH(p.Date_Paid) = ?
           AND DAY(p.Date_Paid) <= 27
           AND b.Billing_Month = ?`,
        [c.Assigned_Area_ID, month, currentMonthStr]
      )

      const totalAreaConsumers = areaTotalRow?.count ?? 0
      const paidAreaConsumers = areaPaidRow?.count ?? 0
      const notYetPaidConsumers = Math.max(0, totalAreaConsumers - paidAreaConsumers)

      globalPaymentTotalConsumers += totalAreaConsumers
      globalPaidConsumers += paidAreaConsumers

      cashierBreakdown.push({
        cashierId: c.User_ID,
        firstName: c.First_Name,
        lastName: c.Last_Name,
        assignedAreaName: c.Area_Name,
        totalConsumers: totalAreaConsumers,
        paidConsumers: paidAreaConsumers,
        notYetPaidConsumers: notYetPaidConsumers,
      })
    }

    const paymentProgress: AdminPaymentProgress = {
      totalConsumers: globalPaymentTotalConsumers,
      paidConsumers: globalPaidConsumers,
      notYetPaidConsumers: Math.max(0, globalPaymentTotalConsumers - globalPaidConsumers),
      overallCompletion: globalPaymentTotalConsumers > 0 ? Math.round((globalPaidConsumers / globalPaymentTotalConsumers) * 100) : 0,
      cashierBreakdown,
    }


    return ok({
      totalActiveConsumers:  activeConsumers?.count ?? 0,
      pendingDisconnections: pendingDisconnections?.count ?? 0,
      recentRegistrations:   recentRegistrations.map((u) => ({
        userId:           u.User_ID,
        firstName:        u.First_Name,
        lastName:         u.Last_Name,
        userType:         u.User_Type,
        accountStatus:    u.Account_Status,
        registrationDate: u.Registration_Date,
      })),
      billingProgress,
      paymentProgress,
    })

  } catch (error) {
    logger.error('Admin dashboard error:', error)
    return handleApiError(error)
  }
}