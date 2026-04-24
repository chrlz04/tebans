import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, withTransaction } from '@/lib/db-helpers'
import { RowDataPacket, PoolConnection } from 'mysql2/promise'
import { sendSms, buildBillingAlertMessage } from '@/lib/services/sms.service'

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

// Background pacing function for SMS
async function processSmsQueue(smsTasks: { to: string, content: string, consumerId: string }[]) {
  // Typical paced interval, e.g. 1-2 seconds between messages
  for (const task of smsTasks) {
    try {
      const smsResult = await sendSms({ to: task.to, content: task.content })
      if (!smsResult.success) {
        logger.warn('Bulk SMS notification failed', {
          consumerId: task.consumerId,
          reason: smsResult.message,
        })
      }
    } catch (e) {
      logger.error('Bulk SMS send error', e)
    }
    // Delay between sends (e.g., 2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const body = await req.json()
    if (!body || !Array.isArray(body.readings)) {
      return err('Invalid payload format. Expected { readings: [] }', 400)
    }

    const { readings } = body

    if (readings.length === 0) {
      return err('No readings provided', 400)
    }

    // First validate the whole file
    const validationErrors: { row: number, errors: string[] }[] = []

    // Get meter reader ID
    const meterReader = await queryOne<MeterReaderRow>(
      'SELECT MeterReader_ID FROM MeterReader WHERE User_ID = ?',
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader record not found', 404)
    }

    // Fetch all needed consumer IDs to reduce DB calls during validation
    const consumerIds = readings.map((r: any) => r.consumerId)
    // Prepare for transaction

    // Validate each row
    const validDataToInsert: any[] = []
    const smsTasks: { to: string, content: string, consumerId: string }[] = []

    for (let i = 0; i < readings.length; i++) {
      const r = readings[i]
      const rowNum = i + 1
      const rowErrors: string[] = []

      if (!r.consumerId) rowErrors.push('Missing Account Number')
      if (r.currentReading === undefined || r.currentReading === null || r.currentReading < 0) rowErrors.push('Invalid Current Reading')
      if (r.amountWithTaxEvat === undefined || r.amountWithTaxEvat === null || r.amountWithTaxEvat < 0) rowErrors.push('Invalid Amount Due')
      if (!r.readingDate) rowErrors.push('Missing Reading Date')
      if (!r.dueDate) rowErrors.push('Missing Due Date')

      if (rowErrors.length > 0) {
        validationErrors.push({ row: rowNum, errors: rowErrors })
        continue
      }

      // Check consumer
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
        [r.consumerId]
      )

      if (!consumer) {
        validationErrors.push({ row: rowNum, errors: ['Consumer Account Not Found'] })
        continue
      }

      // Get previous reading
      const lastReading = await queryOne<LastReadingRow>(
        `SELECT Current_Reading
         FROM MeterReading
         WHERE Consumer_ID = ?
         ORDER BY Date_Recorded DESC
         LIMIT 1`,
        [r.consumerId]
      )

      const previousReading = lastReading?.Current_Reading ?? 0

      if (r.currentReading < previousReading) {
          validationErrors.push({ row: rowNum, errors: [`Current reading (${r.currentReading}) is less than previous reading (${previousReading})`] })
          continue
      }

      const date = new Date(r.readingDate)
      const billingMonth = date.toLocaleDateString('en-PH', {
        year:  'numeric',
        month: 'long',
      })

      // We need to queue the data for transaction insertion
      validDataToInsert.push({
        consumerId: r.consumerId,
        previousReading,
        currentReading: r.currentReading,
        amountWithTaxEvat: r.amountWithTaxEvat,
        readingDate: r.readingDate,
        dueDate: r.dueDate,
        billingMonth,
        consumer: {
          firstName: consumer.First_Name,
          lastName: consumer.Last_Name,
          contactNo: consumer.Contact_No
        }
      })
    }

    if (validationErrors.length > 0) {
      return Response.json({ success: false, message: 'File validation failed', validationErrors }, { status: 400 })
    }

    // Now execute inside a single transaction
    await withTransaction(async (conn) => {
      for (const item of validDataToInsert) {
        // Generate IDs with proper sequential string format inside the transaction
        const [highestReadingRows]: any = await conn.execute(
            `SELECT MeterReading_ID FROM MeterReading WHERE MeterReading_ID LIKE 'mr-read-%' ORDER BY LENGTH(MeterReading_ID) DESC, MeterReading_ID DESC LIMIT 1`
        )
        const highestReading = highestReadingRows[0]

        let nextMrSeq = 1
        if (highestReading && highestReading.MeterReading_ID) {
            const match = highestReading.MeterReading_ID.match(/^mr-read-(\d+)$/)
            if (match && match[1]) {
                nextMrSeq = parseInt(match[1], 10) + 1
            }
        }
        const meterReadingId = `mr-read-${nextMrSeq.toString().padStart(3, '0')}`

        const [highestBillRows]: any = await conn.execute(
            `SELECT Bill_ID FROM Bill WHERE Bill_ID LIKE 'bill-%' ORDER BY LENGTH(Bill_ID) DESC, Bill_ID DESC LIMIT 1`
        )
        const highestBill = highestBillRows[0]

        let nextBillSeq = 1
        if (highestBill && highestBill.Bill_ID) {
            const match = highestBill.Bill_ID.match(/^bill-(\d+)$/)
            if (match && match[1]) {
                nextBillSeq = parseInt(match[1], 10) + 1
            }
        }
        const billId = `bill-${nextBillSeq.toString().padStart(3, '0')}`

        await conn.execute(
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
              item.consumerId,
              meterReader.MeterReader_ID,
              item.previousReading,
              item.currentReading,
              item.readingDate,
              item.billingMonth,
            ]
        )

        await conn.execute(
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
              item.consumerId,
              meterReadingId,
              item.amountWithTaxEvat,
              item.dueDate,
              item.billingMonth,
            ]
        )

        if (item.consumer.contactNo) {
            smsTasks.push({
                to: item.consumer.contactNo,
                consumerId: item.consumerId,
                content: buildBillingAlertMessage({
                    consumerName: `${item.consumer.firstName} ${item.consumer.lastName}`,
                    billAmount: item.amountWithTaxEvat,
                    dueDate: item.dueDate,
                    billingMonth: item.billingMonth,
                    previousReading: item.previousReading,
                    currentReading: item.currentReading,
                })
            })
        }
      }
    })

    // Process SMS asynchronously in background
    if (smsTasks.length > 0) {
      processSmsQueue(smsTasks).catch(e => {
        logger.error('Unhandled error in processSmsQueue', e)
      })
    }

    return ok({
        successCount: validDataToInsert.length,
        smsQueued: smsTasks.length
    }, 'Batch bills generated successfully')

  } catch (error) {
    logger.error('Bulk meter reading error:', error)
    return handleApiError(error)
  }
}
