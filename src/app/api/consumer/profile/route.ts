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

    const profile = await queryOne<ConsumerProfileRow>(
      `SELECT
        Consumer_ID,
        First_Name,
        Last_Name,
        Address,
        Meter_Serial_No,
        Area_Name,
        Contact_No,
        Account_Status
       FROM Consumer
       WHERE Consumer_ID = ?`,
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