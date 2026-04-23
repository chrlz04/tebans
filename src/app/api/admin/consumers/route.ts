import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:       string
  First_Name:        string
  Last_Name:         string
  Address:           string
  Meter_Serial_No:   string
  Area_Name: string
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
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        c.Meter_Serial_No,
        a.Name AS Area_Name,
        c.Area_ID,
        u.Contact_No,
        u.Account_Status,
        u.Registration_Date
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       LEFT JOIN Area a ON a.Area_ID = c.Area_ID
       WHERE
         u.First_Name  LIKE ? OR
         u.Last_Name   LIKE ? OR
         c.Consumer_ID LIKE ? OR
         a.Name LIKE ?
       ORDER BY u.Registration_Date DESC`,
      [searchParam, searchParam, searchParam, searchParam]
    )

    return ok(consumers.map((c) => ({
      consumerId:       c.Consumer_ID,
      firstName:        c.First_Name,
      lastName:         c.Last_Name,
      address:          c.Address,
      meterSerialNo:    c.Meter_Serial_No,
      areaId:           c.Area_ID,
      areaName:         c.Area_Name,
      contactNo:        c.Contact_No,
      accountStatus:    c.Account_Status,
      registrationDate: c.Registration_Date,
    })))

  } catch (error) {
    logger.error('Get consumers error:', error)
    return handleApiError(error)
  }
}