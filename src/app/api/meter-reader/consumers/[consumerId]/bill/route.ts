import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Address:        string
  Meter_Serial_No: string
  Contact_No:     string
  Account_Status: string
}

interface BillRow extends RowDataPacket {
  Bill_ID:          string
  Amount:           string
  Due_Date:         string
  Payment_Status:   string
  Billing_Month:    string
  Previous_Reading: string
  Current_Reading:  string
}

// ── GET /api/meter-reader/consumers/[consumerId]/bill ─────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ consumerId: string }> }
) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { consumerId } = await params

    const consumer = await queryOne<ConsumerRow>(
      `SELECT
         c.Consumer_ID,
         u.First_Name,
         u.Last_Name,
         c.Address,
         c.Meter_Serial_No,
         u.Contact_No,
         u.Account_Status
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Consumer_ID = ?`,
      [consumerId]
    )

    if (!consumer) {
      return err('Consumer not found', 404)
    }

    const bills = await query<BillRow>(
      `SELECT
        b.Bill_ID,
        b.Amount,
        b.Due_Date,
        b.Payment_Status,
        b.Billing_Month,
        m.Previous_Reading,
        m.Current_Reading
       FROM Bill b
       LEFT JOIN MeterReading m ON b.MeterReading_ID = m.MeterReading_ID
       WHERE b.Consumer_ID = ?
       ORDER BY b.Due_Date DESC`,
      [consumerId]
    )

    return ok({
      consumer: {
        consumerId:    consumer.Consumer_ID,
        firstName:     consumer.First_Name,
        lastName:      consumer.Last_Name,
        address:       consumer.Address,
        meterSerialNo: consumer.Meter_Serial_No,
        contactNo:     consumer.Contact_No,
        accountStatus: consumer.Account_Status,
      },
      bills: bills.map((b) => ({
        billId:          b.Bill_ID,
        amount:          Number(b.Amount),
        dueDate:         b.Due_Date,
        paymentStatus:   b.Payment_Status,
        billingMonth:    b.Billing_Month,
        previousReading: Number(b.Previous_Reading || 0),
        currentReading:  Number(b.Current_Reading || 0),
        consumption:     Number(b.Current_Reading || 0) - Number(b.Previous_Reading || 0),
      })),
    })

  } catch (error) {
    console.error('Get consumer bill error:', error)
    return err('Internal server error', 500)
  }
}