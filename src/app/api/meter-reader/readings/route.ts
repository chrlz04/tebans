import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:     string
  First_Name:      string
  Last_Name:       string
  Contact_No:      string
  Meter_Serial_No: string
}

interface LastReadingRow extends RowDataPacket {
  Current_Reading: number
}

interface MeterReaderRow extends RowDataPacket {
  MeterReader_ID: string
}

export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const {
      consumerId,
      currentReading,
      readingDate,
      amountWithTaxEvat,
      dueDate,
    } = await req.json()

    if (!consumerId || currentReading === undefined || !readingDate || !amountWithTaxEvat || !dueDate) {
      return err('All fields are required', 400)
    }

    // Get consumer details
    const consumer = await queryOne<ConsumerRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        c.Meter_Serial_No
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Consumer_ID = ?`,
      [consumerId]
    )

    if (!consumer) {
      return err('Consumer not found', 404)
    }

    // Get meter reader ID
    const meterReader = await queryOne<MeterReaderRow>(
      'SELECT MeterReader_ID FROM MeterReader WHERE User_ID = ?',
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader record not found', 404)
    }

    // Get previous reading
    const lastReading = await queryOne<LastReadingRow>(
      `SELECT Current_Reading
       FROM MeterReading
       WHERE Consumer_ID = ?
       ORDER BY Date_Recorded DESC
       LIMIT 1`,
      [consumerId]
    )

    const previousReading = lastReading?.Current_Reading ?? 0

    // Billing month
    const date         = new Date(readingDate)
    const billingMonth = date.toLocaleDateString('en-PH', {
      year:  'numeric',
      month: 'long',
    })

    // Use the user-provided due date
    const dueDateStr = dueDate

    // Generate IDs with proper sequential string format
    const highestReading = await queryOne<{ MeterReading_ID: string } & RowDataPacket>(
      `SELECT MeterReading_ID FROM MeterReading WHERE MeterReading_ID LIKE 'mr-read-%' ORDER BY LENGTH(MeterReading_ID) DESC, MeterReading_ID DESC LIMIT 1`
    )

    let nextMrSeq = 1
    if (highestReading && highestReading.MeterReading_ID) {
      const match = highestReading.MeterReading_ID.match(/^mr-read-(\d+)$/)
      if (match && match[1]) {
        nextMrSeq = parseInt(match[1], 10) + 1
      }
    }
    const meterReadingId = `mr-read-${nextMrSeq.toString().padStart(3, '0')}`

    const highestBill = await queryOne<{ Bill_ID: string } & RowDataPacket>(
      `SELECT Bill_ID FROM Bill WHERE Bill_ID LIKE 'bill-%' ORDER BY LENGTH(Bill_ID) DESC, Bill_ID DESC LIMIT 1`
    )

    let nextBillSeq = 1
    if (highestBill && highestBill.Bill_ID) {
      const match = highestBill.Bill_ID.match(/^bill-(\d+)$/)
      if (match && match[1]) {
        nextBillSeq = parseInt(match[1], 10) + 1
      }
    }
    const billId = `bill-${nextBillSeq.toString().padStart(3, '0')}`

    // Insert MeterReading — simplified columns
    await execute(
      `INSERT INTO MeterReading (
        MeterReading_ID,
        Consumer_ID,
        MeterReader_ID,
        Previous_Reading,
        Current_Reading,
        Date_Recorded,
        Billing_Month
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        meterReadingId,
        consumerId,
        meterReader.MeterReader_ID,
        previousReading,
        currentReading,
        readingDate,
        billingMonth,
      ]
    )

    // Insert Bill
    await execute(
      `INSERT INTO Bill (
        Bill_ID,
        Consumer_ID,
        MeterReading_ID,
        Amount,
        Due_Date,
        Payment_Status,
        Billing_Month
      ) VALUES (?, ?, ?, ?, ?, 'Unpaid', ?)`,
      [
        billId,
        consumerId,
        meterReadingId,
        amountWithTaxEvat,
        dueDateStr,
        billingMonth,
      ]
    )

    return ok({
      billId,
      billAmount:    amountWithTaxEvat,
      billingMonth,
      dueDate:       dueDateStr,
      previousReading,
    }, 'Bill generated successfully')

  } catch (error) {
    console.error('Record meter reading error:', error)
    return err('Internal server error', 500)
  }
}