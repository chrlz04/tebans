import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { generateSequentialId } from '@/lib/services/billing.service'
import { sendSms, buildDisconnectionMessage } from '@/lib/services/sms.service'

interface MeterReaderRow extends RowDataPacket {
  MeterReader_ID: string
}

interface ConsumerRow extends RowDataPacket {
  First_Name: string
  Last_Name:  string
  Contact_No: string
}

// ── POST /api/meter-reader/disconnections ─────────────────
export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { consumerId, smsMessage } = await req.json()


    const reqError = validateRequired({ consumerId }, ['consumerId'])
    if (reqError) {
      return err(reqError, 400)
    }

    // Get meter reader ID
    const meterReader = await queryOne<MeterReaderRow>(
      'SELECT MeterReader_ID FROM MeterReader WHERE User_ID = ?',
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader record not found', 404)
    }

    const disconnectionId = await generateSequentialId(
      'DisconnectionRequest',
      'DisconnectionRequest_ID',
      'disc'
    )

    // Scheduled date = 7 days from now
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 7)
    const scheduledDateStr = scheduledDate.toISOString().split('T')[0]

    const reason = smsMessage || 'Unpaid electricity bill'

    // Insert disconnection request
    await execute(
      `INSERT INTO DisconnectionRequest (
        DisconnectionRequest_ID,
        Consumer_ID,
        MeterReader_ID,
        Reason_for_Disconnection,
        Scheduled_Date,
        Request_Status
      ) VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [
        disconnectionId,
        consumerId,
        meterReader.MeterReader_ID,
        reason,
        scheduledDateStr,
      ]
    )

    // Send SMS Notification
    const consumer = await queryOne<ConsumerRow>(
      `SELECT u.First_Name, u.Last_Name, u.Contact_No
       FROM Consumer c
       JOIN User u ON c.User_ID = u.User_ID
       WHERE c.Consumer_ID = ?`,
      [consumerId]
    )

    if (consumer?.Contact_No) {
      const smsContent = buildDisconnectionMessage({
        consumerName:  `${consumer.First_Name} ${consumer.Last_Name}`,
        scheduledDate: scheduledDateStr,
        reason:        reason,
      })

      await sendSms({
        to:      consumer.Contact_No,
        content: smsContent,
      })
    }

    return ok({
      disconnectionId,
      scheduledDate: scheduledDateStr,
    }, 'Disconnection request submitted successfully')

  } catch (error) {
    logger.error('Disconnection request error:', error)
    return handleApiError(error)
  }
}