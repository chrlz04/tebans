import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { v4 as uuidv4 } from 'uuid'

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
    } = await req.json()

    if (!consumerId || currentReading === undefined || !readingDate || !amountWithTaxEvat) {
      return err('All fields are required', 400)
    }

    // Get consumer details
    const consumer = await queryOne<ConsumerRow>(
      `SELECT
        Consumer_ID,
        First_Name,
        Last_Name,
        Contact_No,
        Meter_Serial_No
       FROM Consumer
       WHERE Consumer_ID = ?`,
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

    // Due date = 30 days from reading date
    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + 30)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    // Generate IDs
    const meterReadingId = uuidv4()
    const billId         = uuidv4()

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