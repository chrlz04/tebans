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
    const { firstName, lastName, address, province, municipality, barangay, areaId, contactNo } = await req.json()

    if (!firstName || !lastName || !address || !contactNo || !areaId) {
      return err('All fields are required', 400)
    }

    // Need to get User_ID first to update User table
    const result = await execute(`
      UPDATE User u
      JOIN Consumer c ON c.User_ID = u.User_ID
      SET
         u.First_Name = ?,
         u.Last_Name  = ?,
         c.Address    = ?,
         c.Province   = ?,
         c.Municipality = ?,
         c.Barangay   = ?,
         c.Area_ID    = ?,
         u.Contact_No = ?
       WHERE c.Consumer_ID = ?`,
      [firstName, lastName, address, province, municipality, barangay, areaId, contactNo, consumerId]
    )

    return ok(null, 'Consumer updated successfully')

  } catch (error) {
    console.error('Update consumer error:', error)
    return err('Internal server error', 500)
  }
}
