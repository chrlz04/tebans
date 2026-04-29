import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'

import { logger } from '@/lib/logger'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'
import { getBillingCycleSettings } from '@/lib/services/settings.service'

interface SummaryRow extends RowDataPacket {
  total: number
  count: number
}

interface RecentTransactionRow extends RowDataPacket {
  Payment_ID:  string
  Consumer_ID: string
  First_Name:  string
  Last_Name:   string
  Amount_Paid: number
  Date_Paid:   string
}

interface NotYetPaidConsumerRow extends RowDataPacket {
  Consumer_ID: string
  First_Name:  string
  Last_Name:   string
  Address:     string
  Amount: number
}

function formatCyclePeriod(start: Date, end: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const s = `${months[start.getMonth()]} ${start.getDate()}`
  const e = `${months[end.getMonth()]} ${end.getDate()}`
  return start.getFullYear() === end.getFullYear()
    ? `${s} – ${e}, ${end.getFullYear()}`
    : `${s}, ${start.getFullYear()} – ${e}, ${end.getFullYear()}`
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['cashier'])
    if (error) return error

    // Fetch the cashier's assigned area
    const cashier = await queryOne<{ Assigned_Area: string } & RowDataPacket>(
      `SELECT Assigned_Area_ID FROM Cashier WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!cashier) {
      return err('Cashier profile not found', 404)
    }

    const assignedAreaId = cashier.Assigned_Area_ID
    const today = new Date().toISOString().split('T')[0]

    // Total collections today
    const todayCollections = await queryOne<SummaryRow>(
      `SELECT
        COALESCE(SUM(p.Amount_Paid), 0) AS total,
        COUNT(p.Payment_ID) AS count
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE DATE(p.Date_Paid) = ?
         AND c.Area_ID = ?`,
      [today, assignedAreaId]
    )

    // Pending cash remittance (collected payments not yet remitted)
    // Period: Current billing cycle
    const { year, month, day } = getManilaDateParts()
    const { startDay, endDay } = await getBillingCycleSettings()

    const isCrossMonth = startDay > endDay
    let startDateObj: Date, endDateObj: Date
    if (isCrossMonth) {
      if (day >= startDay) {
        startDateObj = new Date(year, month, startDay)
        endDateObj   = new Date(year, month + 1, endDay)
      } else {
        startDateObj = new Date(year, month - 1, startDay)
        endDateObj   = new Date(year, month, endDay)
      }
    } else {
      startDateObj = new Date(year, month, startDay)
      endDateObj   = new Date(year, month, endDay)
    }

    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`
    const endDate   = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`

    const prevStartDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth() - 1, startDateObj.getDate())
    const prevEndDateObj   = new Date(endDateObj.getFullYear(),   endDateObj.getMonth()   - 1, endDateObj.getDate())
    const prevCycleStart   = prevStartDateObj.toISOString().slice(0, 10)
    const prevCycleEnd     = prevEndDateObj.toISOString().slice(0, 10)

    const pendingRemittance = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(p.Amount_Paid), 0) AS total
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE DATE(p.Date_Paid) >= ?
         AND DATE(p.Date_Paid) <= ?
         AND c.Area_ID = ?`,
      [startDate, endDate, assignedAreaId]
    )

    // --- Collection Progress ---
    // 1. Total Active Consumers in assigned area
    const totalActiveConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(c.Consumer_ID) AS count
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ? AND u.Account_Status = 'Active'`,
      [assignedAreaId]
    )
    const totalConsumers = totalActiveConsumersRow?.count ?? 0

    const currentMonthStr = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1)
      .toLocaleString('en-PH', { month: 'long', year: 'numeric' })
    const prevMonthStr    = new Date(prevStartDateObj.getFullYear(), prevStartDateObj.getMonth(), 1)
      .toLocaleString('en-PH', { month: 'long', year: 'numeric' })

    // 2. Paid Consumers (Has a payment record this month <= 27, linked to current month bill)
    //    We check the Payment table for Date_Paid using the 28th to 27th date boundaries
    //    and verify via Bill that it's for the current month.
    const paidConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT p.Consumer_ID) AS count
       FROM Payment p
       JOIN Bill b ON b.Bill_ID = p.Bill_ID
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ?
         AND u.Account_Status = 'Active'
         AND b.Billing_Month = ?
         AND DATE(p.Date_Paid) >= ?
         AND DATE(p.Date_Paid) <= ?`,
      [assignedAreaId, currentMonthStr, startDate, endDate]
    )
    const paidConsumers = paidConsumersRow?.count ?? 0

    // 3. Not Yet Paid Consumers (All active consumers minus those who have paid this month)
    // To get the count and the list
    const notYetPaidListRow = await query<NotYetPaidConsumerRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        COALESCE((
          SELECT b.Amount
          FROM Bill b
          WHERE b.Consumer_ID = c.Consumer_ID
            AND b.Billing_Month = ?
          LIMIT 1
        ), 0) AS Amount
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ?
         AND u.Account_Status = 'Active'
         AND c.Consumer_ID NOT IN (
           SELECT p.Consumer_ID
           FROM Payment p
           JOIN Bill b2 ON b2.Bill_ID = p.Bill_ID
           WHERE b2.Billing_Month = ?
             AND DATE(p.Date_Paid) >= ?
             AND DATE(p.Date_Paid) <= ?
         )`,
      [currentMonthStr, assignedAreaId, currentMonthStr, startDate, endDate]
    )
    const notYetPaidConsumers = totalConsumers - paidConsumers
    const completionRate = totalConsumers > 0 ? Math.round((paidConsumers / totalConsumers) * 100) : 0

    const notYetPaidList = notYetPaidListRow.map((row) => ({
      consumerId: row.Consumer_ID,
      firstName: row.First_Name,
      lastName: row.Last_Name,
      address: row.Address,
      balance: row.Amount,
    }))

    // Previous cycle collection progress
    const prevPaidRow = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT p.Consumer_ID) AS count
       FROM Payment p
       JOIN Bill b ON b.Bill_ID = p.Bill_ID
       JOIN Consumer co ON co.Consumer_ID = p.Consumer_ID
       JOIN User u ON u.User_ID = co.User_ID
       WHERE co.Area_ID = ?
         AND u.Account_Status = 'Active'
         AND b.Billing_Month = ?
         AND DATE(p.Date_Paid) >= ?
         AND DATE(p.Date_Paid) <= ?`,
      [assignedAreaId, prevMonthStr, prevCycleStart, prevCycleEnd]
    )
    const prevPaid = prevPaidRow?.count ?? 0
    const prevNotYetPaid = Math.max(0, totalConsumers - prevPaid)

    const prevNotYetPaidListRow = await query<NotYetPaidConsumerRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        COALESCE((
          SELECT b.Amount
          FROM Bill b
          WHERE b.Consumer_ID = c.Consumer_ID
            AND b.Billing_Month = ?
          LIMIT 1
        ), 0) AS Amount
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ?
         AND u.Account_Status = 'Active'
         AND c.Consumer_ID NOT IN (
           SELECT p.Consumer_ID
           FROM Payment p
           JOIN Bill b2 ON b2.Bill_ID = p.Bill_ID
           WHERE b2.Billing_Month = ?
             AND DATE(p.Date_Paid) >= ?
             AND DATE(p.Date_Paid) <= ?
         )`,
      [prevMonthStr, assignedAreaId, prevMonthStr, prevCycleStart, prevCycleEnd]
    )

    const previousCollectionProgress = {
      totalConsumers,
      paidConsumers:      prevPaid,
      notYetPaidConsumers: prevNotYetPaid,
      completionRate:     totalConsumers > 0 ? Math.round((prevPaid / totalConsumers) * 100) : 0,
      notYetPaidList:     prevNotYetPaidListRow.map((row) => ({
        consumerId: row.Consumer_ID,
        firstName:  row.First_Name,
        lastName:   row.Last_Name,
        address:    row.Address,
        balance:    row.Amount,
      })),
    }

    // Recent transactions today
    const recentTransactions = await query<RecentTransactionRow>(
      `SELECT
        p.Payment_ID,
        p.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        p.Amount_Paid,
        p.Date_Paid
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       JOIN User u ON u.User_ID = c.User_ID
       WHERE DATE(p.Date_Paid) = ?
         AND c.Area_ID = ?
       ORDER BY p.Date_Paid DESC
       LIMIT 10`,
      [today, assignedAreaId]
    )

    return ok({
      totalCollectionsToday:  todayCollections?.total  ?? 0,
      transactionsProcessed:  todayCollections?.count  ?? 0,
      pendingCashRemittance:  pendingRemittance?.total  ?? 0,
      collectionProgress: {
        totalConsumers,
        paidConsumers,
        notYetPaidConsumers,
        completionRate,
        notYetPaidList,
      },
      previousCollectionProgress,
      currentPeriodLabel:  formatCyclePeriod(startDateObj, endDateObj),
      previousPeriodLabel: formatCyclePeriod(prevStartDateObj, prevEndDateObj),
      recentTransactions: recentTransactions.map((t) => ({
        paymentId:   t.Payment_ID,
        consumerId:  t.Consumer_ID,
        consumerName: `${t.First_Name} ${t.Last_Name}`,
        amountPaid:  t.Amount_Paid,
        datePaid:    t.Date_Paid,
      })),
    })

  } catch (error) {
    logger.error('Cashier dashboard error:', error)
    return handleApiError(error)
  }
}