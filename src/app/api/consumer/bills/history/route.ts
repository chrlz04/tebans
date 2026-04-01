import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillHistoryRow extends RowDataPacket {
  Bill_ID:              string
  Amount:               number
  Due_Date:             string
  Payment_Status:       string
  Billing_Month:        string
  Previous_Reading:     number
  Current_Reading:      number
  Consumption_kWh:      number
  Pro_Rated_KWH_Loss:   number
  Total_KWH:            number
  VAT_PassThrough_Taxes: number
  Amount_with_Tax_EVAT: number
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    const history = await query<BillHistoryRow>(
      `SELECT
        b.Bill_ID,
        b.Amount,
        b.Due_Date,
        b.Payment_Status,
        b.Billing_Month,
        mr.Previous_Reading,
        mr.Current_Reading,
        mr.Consumption_kWh,
        mr.Pro_Rated_KWH_Loss,
        mr.Total_KWH,
        mr.VAT_PassThrough_Taxes,
        mr.Amount_with_Tax_EVAT
       FROM Bill b
       JOIN MeterReading mr ON mr.MeterReading_ID = b.MeterReading_ID
       WHERE b.Consumer_ID = ?
       ORDER BY b.Due_Date DESC`,
      [payload!.userId]
    )

    return ok(history.map((b) => ({
      billId:             b.Bill_ID,
      amount:             b.Amount,
      dueDate:            b.Due_Date,
      paymentStatus:      b.Payment_Status,
      billingMonth:       b.Billing_Month,
      previousReading:    b.Previous_Reading,
      currentReading:     b.Current_Reading,
      consumptionKwh:     b.Consumption_kWh,
      proRatedKwhLoss:    b.Pro_Rated_KWH_Loss,
      totalKwh:           b.Total_KWH,
      vatPassThroughTaxes: b.VAT_PassThrough_Taxes,
      amountWithTaxEvat:  b.Amount_with_Tax_EVAT,
    })))

  } catch (error) {
    console.error('Get billing history error:', error)
    return err('Internal server error', 500)
  }
}