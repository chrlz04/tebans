import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

export async function getBillingCycleSettings(): Promise<{ startDay: number, endDay: number }> {
  try {
    const keys = ['BILLING_CYCLE_START_DAY', 'BILLING_CYCLE_END_DAY']
    const rows = await query<SettingRow>(
      `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (?, ?)`,
      keys
    )

    let startDay = 28
    let endDay = 27

    for (const row of rows) {
      if (row.Setting_Key === 'BILLING_CYCLE_START_DAY' && row.Setting_Value != null && row.Setting_Value !== '') {
        const parsed = parseInt(row.Setting_Value, 10)
        if (!isNaN(parsed)) startDay = parsed
      }
      if (row.Setting_Key === 'BILLING_CYCLE_END_DAY' && row.Setting_Value != null && row.Setting_Value !== '') {
        const parsed = parseInt(row.Setting_Value, 10)
        if (!isNaN(parsed)) endDay = parsed
      }
    }

    return { startDay, endDay }
  } catch (error) {
    console.error('Failed to get billing cycle settings, using defaults:', error)
    return { startDay: 28, endDay: 27 }
  }
}
