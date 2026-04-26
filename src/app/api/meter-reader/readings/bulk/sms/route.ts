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

async function processSmsQueue(smsTasks: { to: string, content: string, consumerId: string, meterReadingId: string }[], delaySeconds: number) {
  for (const task of smsTasks) {
    try {
      // Find the pending notification that was generated during the bulk reading
      const notification = await queryOne<{ Notification_ID: string } & RowDataPacket>(
        `SELECT Notification_ID FROM Notification WHERE Consumer_ID = ? AND MeterReading_ID = ? AND Alert_Type = 'Billing' ORDER BY Date_Sent DESC LIMIT 1`,
        [task.consumerId, task.meterReadingId]
      )

      const smsResult = await sendSms({ to: task.to, content: task.content })

      if (notification) {
        if (!smsResult.success) {
          logger.warn('Bulk SMS notification failed', {
            consumerId: task.consumerId,
            reason: smsResult.message,
          })
          await execute(`UPDATE Notification SET Status = 'Failed' WHERE Notification_ID = ?`, [notification.Notification_ID])
        } else {
          await execute(`UPDATE Notification SET Status = 'Sent' WHERE Notification_ID = ?`, [notification.Notification_ID])
        }
      } else {
         // In case the notification wasn't found (which shouldn't happen, but just log it)
         if (!smsResult.success) {
            logger.warn('Bulk SMS notification failed, and no Notification record found to update', { consumerId: task.consumerId })
         }
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
    const keys = ['SMS_BATCH_SIZE_LIMIT', 'SMS_BATCH_DELAY']
    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (?, ?)`,
      keys
    )
    const settings: Record<string, string> = {}
    rows.forEach(r => settings[r.Setting_Key] = r.Setting_Value)

    const limit = settings['SMS_BATCH_SIZE_LIMIT'] ? parseInt(settings['SMS_BATCH_SIZE_LIMIT'], 10) : 500
    const delay = settings['SMS_BATCH_DELAY'] ? parseInt(settings['SMS_BATCH_DELAY'], 10) : 1

    const tasksToProcess = smsTasks.slice(0, limit)

    // Process SMS asynchronously in background
    if (tasksToProcess.length > 0) {
      processSmsQueue(tasksToProcess, delay).catch(e => {
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
