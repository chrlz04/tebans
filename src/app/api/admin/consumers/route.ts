import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:       string
  First_Name:        string
  Last_Name:         string
  Address:           string
  Meter_Serial_No:   string
  Area_Name:         string
  Contact_No:        string
  Account_Status:    string
  Registration_Date: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const search      = req.nextUrl.searchParams.get('search') || ''
    const searchParam = `%${search}%`

    const consumers = await query<ConsumerRow>(
      `SELECT
        Consumer_ID,
        First_Name,
        Last_Name,
        Address,
        Meter_Serial_No,
        Area_Name,
        Contact_No,
        Account_Status,
        Registration_Date
       FROM Consumer
       WHERE
         First_Name  LIKE ? OR
         Last_Name   LIKE ? OR
         Consumer_ID LIKE ? OR
         Area_Name   LIKE ?
       ORDER BY Registration_Date DESC`,
      [searchParam, searchParam, searchParam, searchParam]
    )

    return ok(consumers.map((c) => ({
      consumerId:       c.Consumer_ID,
      firstName:        c.First_Name,
      lastName:         c.Last_Name,
      address:          c.Address,
      meterSerialNo:    c.Meter_Serial_No,
      areaName:         c.Area_Name,
      contactNo:        c.Contact_No,
      accountStatus:    c.Account_Status,
      registrationDate: c.Registration_Date,
    })))

  } catch (error) {
    console.error('Get consumers error:', error)
    return err('Internal server error', 500)
  }
}