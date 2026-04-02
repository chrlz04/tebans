import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query, execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:     string
  First_Name:      string
  Last_Name:       string
  Address:         string
  Meter_Serial_No: string
  Area_Name:       string
  Contact_No:      string
  Account_Status:  string
}

// ── GET /api/meter-reader/consumers ──────────────────────
export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
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
        Account_Status
       FROM Consumer
       WHERE
         First_Name   LIKE ? OR
         Last_Name    LIKE ? OR
         Consumer_ID  LIKE ? OR
         Area_Name    LIKE ?
       ORDER BY First_Name ASC`,
      [searchParam, searchParam, searchParam, searchParam]
    )

    return ok(consumers.map((c) => ({
      consumerId:    c.Consumer_ID,
      firstName:     c.First_Name,
      lastName:      c.Last_Name,
      address:       c.Address,
      meterSerialNo: c.Meter_Serial_No,
      areaName:      c.Area_Name,
      contactNo:     c.Contact_No,
      accountStatus: c.Account_Status,
    })))

  } catch (error) {
    console.error('Get consumers error:', error)
    return err('Internal server error', 500)
  }
}

// ── POST /api/meter-reader/consumers ─────────────────────
export async function POST(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const {
      firstName,
      lastName,
      address,
      meterSerialNo,
      areaName,
      contactNo,
    } = await req.json()

    if (!firstName || !lastName || !address || !meterSerialNo || !areaName || !contactNo) {
      return err('All fields are required', 400)
    }

    // Check for duplicate meter serial number
    const existing = await queryOne(
      'SELECT Consumer_ID FROM Consumer WHERE Meter_Serial_No = ?',
      [meterSerialNo]
    )
    if (existing) {
      return err('Meter serial number already exists', 409)
    }

    const highestConsumer = await queryOne<{ Consumer_ID: string } & RowDataPacket>(
      `SELECT Consumer_ID FROM Consumer WHERE Consumer_ID LIKE 'con-%' ORDER BY LENGTH(Consumer_ID) DESC, Consumer_ID DESC LIMIT 1`
    )

    let nextSeq = 1
    if (highestConsumer && highestConsumer.Consumer_ID) {
      const match = highestConsumer.Consumer_ID.match(/^con-(\d+)$/)
      if (match && match[1]) {
        nextSeq = parseInt(match[1], 10) + 1
      }
    }

    const consumerId = `con-${nextSeq.toString().padStart(3, '0')}`

    await execute(
      `INSERT INTO Consumer (
        Consumer_ID, First_Name, Last_Name,
        Address, Meter_Serial_No, Area_Name,
        Contact_No, Account_Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [consumerId, firstName, lastName, address, meterSerialNo, areaName, contactNo]
    )

    return ok({ consumerId }, 'Consumer account created successfully')

  } catch (error) {
    console.error('Create consumer error:', error)
    return err('Internal server error', 500)
  }
}