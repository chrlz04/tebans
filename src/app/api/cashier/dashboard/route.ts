import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

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
      `SELECT Assigned_Area FROM Cashier WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!cashier) {
      return err('Cashier profile not found', 404)
    }

    const assignedArea = cashier.Assigned_Area
    const today = new Date().toISOString().split('T')[0]

    // Total collections today
    const todayCollections = await queryOne<SummaryRow>(
      `SELECT
        COALESCE(SUM(p.Amount_Paid), 0) AS total,
        COUNT(p.Payment_ID) AS count
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE DATE(p.Date_Paid) = ?
         AND c.Area_Name = ?`,
      [today, assignedArea]
    )

    // Pending cash remittance (all unpaid bills total)
    const pendingRemittance = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(b.Amount), 0) AS total
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE b.Payment_Status = 'Unpaid'
         AND c.Area_Name = ?`,
      [assignedArea]
    )

    // Pending consumers to pay
    const pendingConsumers = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE b.Payment_Status != 'Paid'
         AND c.Area_Name = ?`,
      [assignedArea]
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
         AND c.Area_Name = ?
       ORDER BY p.Date_Paid DESC
       LIMIT 10`,
      [today, assignedArea]
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
    console.error('Cashier dashboard error:', error)
    return err('Internal server error', 500)
  }
}