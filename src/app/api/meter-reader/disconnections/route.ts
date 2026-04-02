import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface MeterReaderRow extends RowDataPacket {
  MeterReader_ID: string
}

// ── POST /api/meter-reader/disconnections ─────────────────
export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { consumerId, smsMessage } = await req.json()

    if (!consumerId) {
      return err('Consumer ID is required', 400)
    }

    // Get meter reader ID
    const meterReader = await queryOne<MeterReaderRow>(
      'SELECT MeterReader_ID FROM MeterReader WHERE User_ID = ?',
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader record not found', 404)
    }

    const highestDisc = await queryOne<{ DisconnectionRequest_ID: string } & RowDataPacket>(
      `SELECT DisconnectionRequest_ID FROM DisconnectionRequest WHERE DisconnectionRequest_ID LIKE 'disc-%' ORDER BY LENGTH(DisconnectionRequest_ID) DESC, DisconnectionRequest_ID DESC LIMIT 1`
    )

    let nextSeq = 1
    if (highestDisc && highestDisc.DisconnectionRequest_ID) {
      const match = highestDisc.DisconnectionRequest_ID.match(/^disc-(\d+)$/)
      if (match && match[1]) {
        nextSeq = parseInt(match[1], 10) + 1
      }
    }
    const disconnectionId = `disc-${nextSeq.toString().padStart(3, '0')}`

    // Scheduled date = 7 days from now
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 7)
    const scheduledDateStr = scheduledDate.toISOString().split('T')[0]

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
        smsMessage || 'Unpaid electricity bill',
        scheduledDateStr,
      ]
    )

    return ok({
      disconnectionId,
      scheduledDate: scheduledDateStr,
    }, 'Disconnection request submitted successfully')

  } catch (error) {
    console.error('Disconnection request error:', error)
    return err('Internal server error', 500)
  }
}