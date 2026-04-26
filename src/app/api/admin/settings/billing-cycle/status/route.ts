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
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const keys = [
      'BILLING_CYCLE_START_DAY',
      'BILLING_CYCLE_END_DAY',
      'PENDING_BILLING_CYCLE_START_DAY',
      'PENDING_BILLING_CYCLE_END_DAY',
      'PENDING_BILLING_CYCLE_EFFECTIVE_DATE'
    ]

    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (?, ?, ?, ?, ?)`,
      keys
    )

    const data: any = {
      startDay: 28,
      endDay: 27,
      pendingStartDay: null,
      pendingEndDay: null,
      effectiveDate: null
    }

    for (const row of rows) {
      if (row.Setting_Key === 'BILLING_CYCLE_START_DAY' && row.Setting_Value) {
        data.startDay = parseInt(row.Setting_Value, 10)
      }
      if (row.Setting_Key === 'BILLING_CYCLE_END_DAY' && row.Setting_Value) {
        data.endDay = parseInt(row.Setting_Value, 10)
      }
      if (row.Setting_Key === 'PENDING_BILLING_CYCLE_START_DAY' && row.Setting_Value) {
        data.pendingStartDay = parseInt(row.Setting_Value, 10)
      }
      if (row.Setting_Key === 'PENDING_BILLING_CYCLE_END_DAY' && row.Setting_Value) {
        data.pendingEndDay = parseInt(row.Setting_Value, 10)
      }
      if (row.Setting_Key === 'PENDING_BILLING_CYCLE_EFFECTIVE_DATE' && row.Setting_Value) {
        // Format to a readable string like "March 1, 2025"
        try {
          const date = new Date(row.Setting_Value)
          data.effectiveDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        } catch (e) {
          data.effectiveDate = row.Setting_Value
        }
      }
    }

    return ok(data)
  } catch (error) {
    console.error('Failed to get full billing cycle settings:', error)
    return err('Failed to retrieve settings', 500)
  }
}
