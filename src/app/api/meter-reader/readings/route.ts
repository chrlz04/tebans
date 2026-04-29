import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { queryOne, query, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getCycleBoundsForDate } from '@/lib/date-utils'
import { getBillingCycleSettings } from '@/lib/services/settings.service'
import { sendSms } from '@/lib/services/sms.service'
import { buildBillingAlertMessage } from '@/lib/sms-templates'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

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


    const reqError = validateRequired({
      consumerId, currentReading, readingDate, amountWithTaxEvat, dueDate
    }, ['consumerId', 'readingDate', 'amountWithTaxEvat', 'dueDate'])

    if (reqError || currentReading === undefined) {
      return err(reqError || 'currentReading is required', 400)
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

    // Check if bill already exists for this billing cycle (not just calendar month)
    const { startDay, endDay } = await getBillingCycleSettings()
    const { cycleStartDate, cycleEndDate } = getCycleBoundsForDate(readingDate, startDay, endDay)

    const existingBill = await queryOne(
      `SELECT b.Bill_ID FROM Bill b
       JOIN MeterReading mr ON mr.MeterReading_ID = b.MeterReading_ID
       WHERE b.Consumer_ID = ?
         AND DATE(mr.Date_Recorded) >= ?
         AND DATE(mr.Date_Recorded) <= ?
       LIMIT 1`,
      [consumerId, cycleStartDate, cycleEndDate]
    )

    if (existingBill) {
      const consumerName = `${consumer.First_Name} ${consumer.Last_Name}`
      return err(`Consumer ${consumerName} (${consumerId}) already has a bill for this billing cycle (${cycleStartDate} to ${cycleEndDate}). Duplicate entries are not allowed.`, 400)
    }

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

    // Fetch SMS settings
    const keys = ['SMS_MESSAGE_TEMPLATE']
    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (?)`,
      keys
    )
    const settings: Record<string, string> = {}
    rows.forEach(r => settings[r.Setting_Key] = r.Setting_Value)
    const smsTemplate = settings['SMS_MESSAGE_TEMPLATE'] || 'Dear {name}, your electricity bill for {month} is P{amount} (Previous: {previous_reading} kWh, Present: {current_reading} kWh) with a total of {usage} kWh used this month. Please pay on or before {due_date}. - TEBANS'

    // Prepare SMS message content regardless of whether there's a phone number
    const smsMessage = buildBillingAlertMessage({
      template:      smsTemplate,
      consumerName:  `${consumer.First_Name} ${consumer.Last_Name}`,
      billAmount:    amountWithTaxEvat,
      dueDate:       dueDateStr,
      billingMonth,
      accountNo:     consumerId,
      previousReading: previousReading,
      currentReading:  currentReading,
    })

    // ── Generate Notification Record ──────────────
    const highestNotification = await queryOne<{ Notification_ID: string } & RowDataPacket>(
      `SELECT Notification_ID FROM Notification WHERE Notification_ID LIKE 'notif-%' ORDER BY LENGTH(Notification_ID) DESC, Notification_ID DESC LIMIT 1`
    )
    let nextNotifSeq = 1
    if (highestNotification && highestNotification.Notification_ID) {
      const match = highestNotification.Notification_ID.match(/^notif-(\d+)$/)
      if (match && match[1]) {
        nextNotifSeq = parseInt(match[1], 10) + 1
      }
    }
    const notifId = `notif-${nextNotifSeq.toString().padStart(3, '0')}`

    // Always insert a pending notification
    await execute(
      `INSERT INTO Notification (
        Notification_ID,
        Consumer_ID,
        MeterReading_ID,
        Alert_Type,
        Message_Content,
        Reference_Type,
        Status
      ) VALUES (?, ?, ?, 'Billing', ?, 'MeterReading', 'Pending')`,
      [
        notifId,
        consumerId,
        meterReadingId,
        smsMessage
      ]
    )

    // ── Attempt SMS and Update Notification Status ──────────────
    let smsSent = false
    if (!consumer.Contact_No) {
      logger.warn('SMS skipped — no contact number', {
        consumerId,
      })
      await execute(`UPDATE Notification SET Status = 'Failed' WHERE Notification_ID = ?`, [notifId])
    } else {
      // Send SMS without blocking or failing the main operation
      const smsResult = await sendSms({
        to:      consumer.Contact_No,
        content: smsMessage,
      })

      if (!smsResult.success) {
        // Log the failure but don't throw — bill is already saved
        logger.warn('SMS notification failed after bill generation', {
          consumerId: consumerId,
          reason:     smsResult.message,
        })
        await execute(`UPDATE Notification SET Status = 'Failed' WHERE Notification_ID = ?`, [notifId])
      } else {
        smsSent = true
        await execute(`UPDATE Notification SET Status = 'Sent' WHERE Notification_ID = ?`, [notifId])
      }
    }

    return ok({
      billId,
      meterReadingId,
      billAmount:    amountWithTaxEvat,
      billingMonth,
      dueDate:       dueDateStr,
      previousReading,
      smsSent,
    }, 'Bill generated successfully')

  } catch (error) {
    logger.error('Record meter reading error:', error)
    return handleApiError(error)
  }
}