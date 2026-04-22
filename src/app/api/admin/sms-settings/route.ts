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

    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN ('SMS_API_URL', 'SMS_API_KEY', 'SMS_PHONE_NUMBER')`
    )

    const settings = {
      SMS_API_URL: '',
      SMS_API_KEY: '',
      SMS_PHONE_NUMBER: ''
    }

    rows.forEach(row => {
      if (row.Setting_Key in settings) {
        settings[row.Setting_Key as keyof typeof settings] = row.Setting_Value
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
    const { SMS_API_URL, SMS_API_KEY, SMS_PHONE_NUMBER } = body

    if (SMS_API_URL === undefined || SMS_API_KEY === undefined || SMS_PHONE_NUMBER === undefined) {
      return err('Missing required SMS settings', 400)
    }

    // Using execute iteratively as noted in project memory
    await execute(`INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES ('SMS_API_URL', ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`, [SMS_API_URL, SMS_API_URL])
    await execute(`INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES ('SMS_API_KEY', ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`, [SMS_API_KEY, SMS_API_KEY])
    await execute(`INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES ('SMS_PHONE_NUMBER', ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`, [SMS_PHONE_NUMBER, SMS_PHONE_NUMBER])

    return ok(null, 'SMS settings updated successfully')
  } catch (error) {
    console.error('Failed to update SMS settings:', error)
    return err('Failed to update settings', 500)
  }
}
