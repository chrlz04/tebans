import { NextRequest } from 'next/server'
import { requireRole, err } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'
import { queryOne, query, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2/promise'
import { sendSms } from '@/lib/services/sms.service'
import { buildBillingAlertMessage } from '@/lib/sms-templates'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
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
    const keys = ['SMS_BATCH_SIZE_LIMIT', 'SMS_BATCH_DELAY', 'SMS_MESSAGE_TEMPLATE']
    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (?, ?, ?)`,
      keys
    )
    const settings: Record<string, string> = {}
    rows.forEach(r => settings[r.Setting_Key] = r.Setting_Value)

    const limit = settings['SMS_BATCH_SIZE_LIMIT'] ? parseInt(settings['SMS_BATCH_SIZE_LIMIT'], 10) : 500
    const delay = settings['SMS_BATCH_DELAY'] ? parseInt(settings['SMS_BATCH_DELAY'], 10) : 1
    const smsTemplate = settings['SMS_MESSAGE_TEMPLATE'] || 'Dear {name}, your electricity bill for {month} is P{amount} (Previous: {previous_reading} kWh, Present: {current_reading} kWh) with a total of {usage} kWh used this month. Please pay on or before {due_date}. - TEBANS'

    const tasksToProcess = smsTasks.slice(0, limit)

    // Set up SSE Stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        for (let i = 0; i < tasksToProcess.length; i++) {
          const task = tasksToProcess[i]

          try {
            sendEvent({ consumerId: task.consumerId, status: 'Sending...' })

            const content = buildBillingAlertMessage({
              template: smsTemplate,
              consumerName: task.consumerName,
              billAmount: task.amountWithTaxEvat,
              dueDate: task.dueDate,
              billingMonth: task.billingMonth,
              accountNo: task.consumerId,
              previousReading: task.previousReading,
              currentReading: task.currentReading,
            })

            // Find the pending notification that was generated during the bulk reading
            const notification = await queryOne<{ Notification_ID: string } & RowDataPacket>(
              `SELECT Notification_ID FROM Notification WHERE Consumer_ID = ? AND MeterReading_ID = ? AND Alert_Type = 'Billing' ORDER BY Date_Sent DESC LIMIT 1`,
              [task.consumerId, task.meterReadingId]
            )

            const smsResult = await sendSms({ to: task.to, content })

            if (notification) {
              if (!smsResult.success) {
                logger.warn('Bulk SMS notification failed', {
                  consumerId: task.consumerId,
                  reason: smsResult.message,
                })
                await execute(`UPDATE Notification SET Status = 'Failed' WHERE Notification_ID = ?`, [notification.Notification_ID])
                sendEvent({ consumerId: task.consumerId, status: 'Failed' })
              } else {
                await execute(`UPDATE Notification SET Status = 'Sent' WHERE Notification_ID = ?`, [notification.Notification_ID])
                sendEvent({ consumerId: task.consumerId, status: 'Sent' })
              }
            } else {
              if (!smsResult.success) {
                sendEvent({ consumerId: task.consumerId, status: 'Failed' })
              } else {
                sendEvent({ consumerId: task.consumerId, status: 'Sent' })
              }
            }
          } catch (e) {
            logger.error('Bulk SMS send error', e)
            sendEvent({ consumerId: task.consumerId, status: 'Failed' })
          }

          if (i < tasksToProcess.length - 1 && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    logger.error('Batch SMS stream endpoint error:', error)
    return err('Failed to start SMS stream', 500)
  }
}
