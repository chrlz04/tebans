import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const keys = [
      'SMS_BATCH_SENDING_ENABLED',
      'SMS_BATCH_SIZE_LIMIT',
      'SMS_BATCH_DELAY',
      'SMS_REQUIRE_CONFIRMATION',
      'SMS_AUTO_MARK_SENT',
      'SMS_MESSAGE_TEMPLATE'
    ]

    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (${keys.map(() => '?').join(', ')})`,
      keys
    )

    const settings: Record<string, string> = {}
    keys.forEach(k => settings[k] = '')

    rows.forEach(row => {
      if (row.Setting_Key in settings) {
        settings[row.Setting_Key] = row.Setting_Value
      }
    })

    return ok(settings)
  } catch (error) {
    console.error('Failed to fetch SMS settings for meter reader:', error)
    return err('Failed to fetch settings', 500)
  }
}
