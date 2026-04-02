import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { execute } from '@/lib/db-helpers'

// ── PUT /api/meter-reader/consumers/[consumerId] ──────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ consumerId: string }> }
) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { consumerId } = await params
    const { firstName, lastName, address, contactNo, areaName } = await req.json()

    if (!firstName || !lastName || !address || !contactNo) {
      return err('All fields are required', 400)
    }

    await execute(
      `UPDATE Consumer
       SET
         First_Name = ?,
         Last_Name  = ?,
         Address    = ?,
         Contact_No = ?,
         Area_Name  = ?
       WHERE Consumer_ID = ?`,
      [firstName, lastName, address, contactNo, areaName, consumerId]
    )

    return ok(null, 'Consumer updated successfully')

  } catch (error) {
    console.error('Update consumer error:', error)
    return err('Internal server error', 500)
  }
}
