import { query, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

export async function getBillingCycleSettings(): Promise<{ startDay: number, endDay: number }> {
  try {
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

    let startDay = 28
    let endDay = 27
    let pendingStartDay: number | null = null
    let pendingEndDay: number | null = null
    let pendingEffectiveDate: string | null = null

    for (const row of rows) {
      if (row.Setting_Key === 'BILLING_CYCLE_START_DAY' && row.Setting_Value != null && row.Setting_Value !== '') {
        const parsed = parseInt(row.Setting_Value, 10)
        if (!isNaN(parsed)) startDay = parsed
      }
      if (row.Setting_Key === 'BILLING_CYCLE_END_DAY' && row.Setting_Value != null && row.Setting_Value !== '') {
        const parsed = parseInt(row.Setting_Value, 10)
        if (!isNaN(parsed)) endDay = parsed
      }
      if (row.Setting_Key === 'PENDING_BILLING_CYCLE_START_DAY' && row.Setting_Value != null && row.Setting_Value !== '') {
        const parsed = parseInt(row.Setting_Value, 10)
        if (!isNaN(parsed)) pendingStartDay = parsed
      }
      if (row.Setting_Key === 'PENDING_BILLING_CYCLE_END_DAY' && row.Setting_Value != null && row.Setting_Value !== '') {
        const parsed = parseInt(row.Setting_Value, 10)
        if (!isNaN(parsed)) pendingEndDay = parsed
      }
      if (row.Setting_Key === 'PENDING_BILLING_CYCLE_EFFECTIVE_DATE' && row.Setting_Value != null && row.Setting_Value !== '') {
        pendingEffectiveDate = row.Setting_Value
      }
    }

    // Check if we have a pending change that has become effective
    if (pendingStartDay !== null && pendingEndDay !== null && pendingEffectiveDate !== null) {
      const { year, month, day } = getManilaDateParts()
      // format current date to YYYY-MM-DD
      const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // If current date is on or after the effective date, promote pending to active
      if (currentDateStr >= pendingEffectiveDate) {
        startDay = pendingStartDay
        endDay = pendingEndDay

        // Asynchronously update the database to reflect the promotion
        // To handle race conditions (e.g. concurrent requests), we execute a single atomic SQL statement
        // that transfers the pending values to the active values ONLY IF the pending values still exist.
        execute(`
          UPDATE System_Settings AS s_active
          JOIN System_Settings AS s_pending
            ON s_pending.Setting_Key = CONCAT('PENDING_', s_active.Setting_Key)
          SET s_active.Setting_Value = s_pending.Setting_Value
          WHERE s_active.Setting_Key IN ('BILLING_CYCLE_START_DAY', 'BILLING_CYCLE_END_DAY');
        `).then(() => {
          // After successfully updating, delete the pending keys.
          // This ensures that even if concurrent requests fire, the UPDATE is idempotent.
          return execute(
            `DELETE FROM System_Settings WHERE Setting_Key IN ('PENDING_BILLING_CYCLE_START_DAY', 'PENDING_BILLING_CYCLE_END_DAY', 'PENDING_BILLING_CYCLE_EFFECTIVE_DATE')`
          )
        }).catch(err => {
          console.error('Failed to promote pending billing cycle settings:', err)
        })
      }
    }

    return { startDay, endDay }
  } catch (error) {
    console.error('Failed to get billing cycle settings, using defaults:', error)
    return { startDay: 28, endDay: 27 }
  }
}
