import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Contact_No:     string
  Meter_Serial_No: string
}

interface LastReadingRow extends RowDataPacket {
  Current_Reading: number
}

interface MeterReaderRow extends RowDataPacket {
  MeterReader_ID: string
}

// ── POST /api/meter-reader/readings ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { consumerId, currentReading, readingDate } = await req.json()

    if (!consumerId || currentReading === undefined || !readingDate) {
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

    const previousReading  = lastReading?.Current_Reading ?? 0
    const consumptionKwh   = Math.max(0, currentReading - previousReading)

    // ── Billing calculation ───────────────────────────────
    const ratePerKwh        = 11.50  // base rate in PHP
    const vatRate           = 0.12
    const proRatedLossRate  = 0.02
    const proRatedKwhLoss   = consumptionKwh * proRatedLossRate
    const totalKwh          = consumptionKwh + proRatedKwhLoss
    const baseAmount        = totalKwh * ratePerKwh
    const vatAmount         = baseAmount * vatRate
    const amountWithTaxEvat = baseAmount + vatAmount

    // Billing month (e.g. "April 2026")
    const date         = new Date(readingDate)
    const billingMonth = date.toLocaleDateString('en-PH', {
      year:  'numeric',
      month: 'long',
    })

    // Due date = 30 days from reading date
    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + 30)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    // Generate IDs sequentially
    const highestMeterReading = await queryOne<{ MeterReading_ID: string } & RowDataPacket>(
      `SELECT MeterReading_ID FROM MeterReading WHERE MeterReading_ID LIKE 'mr_read-%' ORDER BY LENGTH(MeterReading_ID) DESC, MeterReading_ID DESC LIMIT 1`
    )

    let nextMrReadSeq = 1
    if (highestMeterReading && highestMeterReading.MeterReading_ID) {
      const match = highestMeterReading.MeterReading_ID.match(/^mr_read-(\d+)$/)
      if (match && match[1]) {
        nextMrReadSeq = parseInt(match[1], 10) + 1
      }
    }
    const meterReadingId = `mr_read-${nextMrReadSeq.toString().padStart(3, '0')}`

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

    // Insert MeterReading
    await execute(
      `INSERT INTO MeterReading (
        MeterReading_ID,
        Consumer_ID,
        MeterReader_ID,
        Previous_Reading,
        Current_Reading,
        Consumption_kWh,
        Date_Recorded,
        Amount_with_Tax_EVAT,
        VAT_PassThrough_Taxes,
        Total_KWH,
        Pro_Rated_KWH_Loss,
        Billing_Month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meterReadingId,
        consumerId,
        meterReader.MeterReader_ID,
        previousReading,
        currentReading,
        consumptionKwh,
        readingDate,
        amountWithTaxEvat,
        vatAmount,
        totalKwh,
        proRatedKwhLoss,
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
      consumptionKwh,
    }, 'Bill generated successfully')

  } catch (error) {
    console.error('Record meter reading error:', error)
    return err('Internal server error', 500)
  }
}