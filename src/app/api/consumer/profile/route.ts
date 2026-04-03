import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerProfileRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Address:        string
  Meter_Serial_No: string
  Area_Name:      string
  Contact_No:     string
  Account_Status: string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    // payload!.userId is now the User_ID for consumer, so we join using that.
    // However, maybe consumer endpoint expects Consumer_ID as the payload user ID?
    // In auth/login, we use `user.User_ID` which is the User's ID. Wait, let's look at what payload.userId contains.
    // In login route: account.User_ID. For consumers it used to be c.Consumer_ID AS User_ID.
    // But now we use `u.User_ID` directly. Let's make sure we query by User_ID.
    const profile = await queryOne<ConsumerProfileRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        c.Meter_Serial_No,
        c.Area_Name,
        u.Contact_No,
        u.Account_Status
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.User_ID = ?`,
      [payload!.userId]
    )

    if (!profile) {
      return err('Consumer profile not found', 404)
    }

    return ok({
      consumerId:    profile.Consumer_ID,
      firstName:     profile.First_Name,
      lastName:      profile.Last_Name,
      address:       profile.Address,
      meterSerialNo: profile.Meter_Serial_No,
      areaName:      profile.Area_Name,
      contactNo:     profile.Contact_No,
      accountStatus: profile.Account_Status,
    })

  } catch (error) {
    console.error('Get consumer profile error:', error)
    return err('Internal server error', 500)
  }
}