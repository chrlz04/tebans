import { NextRequest, NextResponse } from 'next/server'
import { getBillingCycleSettings } from '@/lib/services/settings.service'
import { ok, err } from '@/lib/auth-helpers'
import { requireRole } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin', 'meter_reader', 'cashier', 'consumer'])
    if (error) return error

    const settings = await getBillingCycleSettings()
    return ok(settings)
  } catch (error) {
    console.error('Failed to fetch billing cycle settings:', error)
    return err('Failed to fetch billing cycle settings', 500)
  }
}
