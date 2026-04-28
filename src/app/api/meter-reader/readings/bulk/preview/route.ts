import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2/promise'

interface ConsumerPreviewRow extends RowDataPacket {
  Consumer_ID: string
  First_Name: string
  Last_Name: string
  Meter_Serial_No: string
  Area_Name: string | null
}

export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const body = await req.json()
    if (!body || !Array.isArray(body.consumerIds)) {
      return err('Invalid payload format. Expected { consumerIds: [] }', 400)
    }

    const { consumerIds } = body

    if (consumerIds.length === 0) {
      return ok({ consumers: {} })
    }

    // Deduplicate consumerIds to avoid a massive IN clause
    const uniqueConsumerIds = Array.from(new Set(consumerIds))

    // Chunk the uniqueConsumerIds to avoid too many variables in a single query
    const consumersMap: Record<string, { consumerName: string, assignedArea: string, meterSerialNo: string }> = {}

    const chunkSize = 100
    for (let i = 0; i < uniqueConsumerIds.length; i += chunkSize) {
        const chunk = uniqueConsumerIds.slice(i, i + chunkSize)

        const placeholders = chunk.map(() => '?').join(', ')

        const rows = await query<ConsumerPreviewRow>(
          `SELECT
            c.Consumer_ID,
            u.First_Name,
            u.Last_Name,
            c.Meter_Serial_No,
            a.Name AS Area_Name
           FROM Consumer c
           JOIN User u ON u.User_ID = c.User_ID
           LEFT JOIN Area a ON c.Area_ID = a.Area_ID
           WHERE c.Consumer_ID IN (${placeholders})`,
          chunk
        )

        rows.forEach(row => {
            consumersMap[row.Consumer_ID] = {
                consumerName: `${row.First_Name} ${row.Last_Name}`.trim(),
                assignedArea: row.Area_Name || 'Unassigned',
                meterSerialNo: row.Meter_Serial_No || 'N/A'
            }
        })
    }

    return ok({ consumers: consumersMap })

  } catch (error) {
    return handleApiError(error)
  }
}
