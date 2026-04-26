import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, query, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2/promise'
import { sendSms } from '@/lib/services/sms.service'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

async function processSmsQueue(smsTasks: { to: string, content: string, consumerId: string, meterReadingId: string }[], autoMarkSent: boolean, delaySeconds: number) {
  for (const task of smsTasks) {
    try {
      const smsResult = await sendSms({ to: task.to, content: task.content })
      if (!smsResult.success) {
        logger.warn('Bulk SMS notification failed', {
          consumerId: task.consumerId,
          reason: smsResult.message,
        })
      } else if (autoMarkSent) {
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

          await execute(
              `INSERT INTO Notification (
                Notification_ID,
                Consumer_ID,
                MeterReading_ID,
                Alert_Type,
                Message_Content,
                Reference_Type
              ) VALUES (?, ?, ?, 'Billing', ?, 'MeterReading')`,
              [
                  notifId,
                  task.consumerId,
                  task.meterReadingId,
                  task.content
              ]
          ).catch(e => logger.error('Failed to auto mark SMS sent in batch', e))
      }
    } catch (e) {
      logger.error('Bulk SMS send error', e)
    }

    if (delaySeconds > 0) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds))
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const body = await req.json()
    if (!body || !Array.isArray(body.smsTasks)) {
      return err('Invalid payload format. Expected { smsTasks: [] }', 400)
    }

    const { smsTasks } = body

    if (smsTasks.length === 0) {
      return err('No SMS tasks provided', 400)
    }

    // Fetch SMS settings
    const keys = ['SMS_BATCH_SIZE_LIMIT', 'SMS_BATCH_DELAY', 'SMS_AUTO_MARK_SENT']
    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (?, ?, ?)`,
      keys
    )
    const settings: Record<string, string> = {}
    rows.forEach(r => settings[r.Setting_Key] = r.Setting_Value)

    const limit = settings['SMS_BATCH_SIZE_LIMIT'] ? parseInt(settings['SMS_BATCH_SIZE_LIMIT'], 10) : 500
    const delay = settings['SMS_BATCH_DELAY'] ? parseInt(settings['SMS_BATCH_DELAY'], 10) : 1
    const autoMarkSent = settings['SMS_AUTO_MARK_SENT'] === '1'

    const tasksToProcess = smsTasks.slice(0, limit)

    // Process SMS asynchronously in background
    if (tasksToProcess.length > 0) {
      processSmsQueue(tasksToProcess, autoMarkSent, delay).catch(e => {
        logger.error('Unhandled error in processSmsQueue', e)
      })
    }

    return ok({
        smsQueued: tasksToProcess.length
    }, 'Batch SMS dispatch initiated')

  } catch (error) {
    logger.error('Batch SMS endpoint error:', error)
    return handleApiError(error)
  }
}
