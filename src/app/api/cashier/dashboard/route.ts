import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'

import { logger } from '@/lib/logger'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'

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
    // Period: 28th of previous month up to 27th of current month
    const { year, month, day } = getManilaDateParts()

    const startDateObj = new Date(year, day > 27 ? month : month - 1, 28)
    const endDateObj = new Date(year, day > 27 ? month + 1 : month, 27)

    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-28`
    const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-27`

    const pendingRemittance = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(p.Amount_Paid), 0) AS total
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE DATE(p.Date_Paid) >= ?
         AND DATE(p.Date_Paid) <= ?
         AND c.Area_ID = ?`,
      [startDate, endDate, assignedAreaId]
    )

    // Pending consumers to pay
    const pendingConsumers = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE b.Payment_Status != 'Paid'
         AND c.Area_ID = ?`,
      [assignedAreaId]
    )

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
      pendingConsumersToPay:  pendingConsumers?.count   ?? 0,
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