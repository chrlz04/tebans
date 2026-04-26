import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { execute } from '@/lib/db-helpers'
import { getBillingCycleSettings } from '@/lib/services/settings.service'
import { getManilaDateParts } from '@/lib/date-utils'

export async function PUT(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const body = await req.json()
    const { endDay } = body

    if (endDay === undefined || endDay < 1 || endDay > 28) {
        return err('Invalid end day. Must be between 1 and 28.', 400)
    }

    // startDay is the next day after endDay
    const startDay = endDay + 1

    const currentSettings = await getBillingCycleSettings()

    // If the setting isn't actually changing, just return OK
    if (currentSettings.endDay === endDay) {
      return ok(null, 'Billing cycle settings are already up to date.')
    }

    // Determine when the new cycle should take effect
    // It should take effect on the start day of the *next* cycle.
    const { year, month, day } = getManilaDateParts()

    // Calculate the start date of the NEXT cycle based on CURRENT settings
    let effectiveYear = year
    let effectiveMonth = month // 0-11

    // If today is before or on the current end day, the current cycle ends this month.
    // So the next cycle starts this month (if currentSettings.startDay > currentSettings.endDay)
    // Actually, startDay is ALWAYS endDay + 1.
    // The current cycle's end date is:
    //   If today's day > current end day, the cycle ends NEXT month.
    //   If today's day <= current end day, the cycle ends THIS month.
    if (day > currentSettings.endDay) {
      effectiveMonth += 1
      if (effectiveMonth > 11) {
        effectiveMonth = 0
        effectiveYear += 1
      }
    }

    const effectiveDateObj = new Date(effectiveYear, effectiveMonth, currentSettings.startDay)
    const effectiveDateStr = `${effectiveDateObj.getFullYear()}-${String(effectiveDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentSettings.startDay).padStart(2, '0')}`

    // Save as pending instead of immediately overwriting
    await execute(
      `INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`,
      ['PENDING_BILLING_CYCLE_END_DAY', String(endDay), String(endDay)]
    )

    await execute(
      `INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`,
      ['PENDING_BILLING_CYCLE_START_DAY', String(startDay), String(startDay)]
    )

    await execute(
      `INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`,
      ['PENDING_BILLING_CYCLE_EFFECTIVE_DATE', effectiveDateStr, effectiveDateStr]
    )

    return ok(null, `Billing cycle change scheduled. It will take effect on ${effectiveDateStr}.`)
  } catch (error) {
    console.error('Failed to update billing cycle settings:', error)
    return err('Failed to update settings', 500)
  }
}
