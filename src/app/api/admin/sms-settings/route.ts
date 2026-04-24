import { NextRequest, NextResponse } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const keys = [
      'SMS_PROVIDER', 'SMS_API_URL', 'SMS_API_KEY', 'SMS_PHONE_NUMBER',
      'SMS_DEVICE_ID', 'SMS_USERNAME', 'SMS_PASSWORD',
      'SMS_CUSTOM_AUTH_TYPE', 'SMS_CUSTOM_AUTH_HEADER', 'SMS_CUSTOM_PAYLOAD'
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
    console.error('Failed to fetch SMS settings:', error)
    return err('Failed to fetch settings', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const body = await req.json()

    const keys = [
      'SMS_PROVIDER', 'SMS_API_URL', 'SMS_API_KEY', 'SMS_PHONE_NUMBER',
      'SMS_DEVICE_ID', 'SMS_USERNAME', 'SMS_PASSWORD',
      'SMS_CUSTOM_AUTH_TYPE', 'SMS_CUSTOM_AUTH_HEADER', 'SMS_CUSTOM_PAYLOAD'
    ]

    // Using execute iteratively as noted in project memory
    for (const key of keys) {
      if (body[key] !== undefined) {
        await execute(`INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`, [key, body[key], body[key]])
      }
    }

    return ok(null, 'SMS settings updated successfully')
  } catch (error) {
    console.error('Failed to update SMS settings:', error)
    return err('Failed to update settings', 500)
  }
}
