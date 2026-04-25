import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { execute } from '@/lib/db-helpers'

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

    await execute(
      `INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`,
      ['BILLING_CYCLE_END_DAY', String(endDay), String(endDay)]
    )

    await execute(
      `INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`,
      ['BILLING_CYCLE_START_DAY', String(startDay), String(startDay)]
    )

    return ok(null, 'Billing cycle settings updated successfully')
  } catch (error) {
    console.error('Failed to update billing cycle settings:', error)
    return err('Failed to update settings', 500)
  }
}
