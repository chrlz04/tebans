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

    const today = new Date().toISOString().split('T')[0]

    // Total collections today
    const todayCollections = await queryOne<SummaryRow>(
      `SELECT
        COALESCE(SUM(Amount_Paid), 0) AS total,
        COUNT(*) AS count
       FROM Payment
       WHERE DATE(Date_Paid) = ?`,
      [today]
    )

    // Pending cash remittance (all unpaid bills total)
    const pendingRemittance = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(Amount), 0) AS total
       FROM Bill
       WHERE Payment_Status = 'Unpaid'`
    )

    // Pending consumers to pay
    const pendingConsumers = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT Consumer_ID) AS count
       FROM Bill
       WHERE Payment_Status != 'Paid'`
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
       ORDER BY p.Date_Paid DESC
       LIMIT 10`,
      [today]
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