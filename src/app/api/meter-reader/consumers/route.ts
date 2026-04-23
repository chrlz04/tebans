import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { query, execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerRow extends RowDataPacket {
  Consumer_ID:     string
  First_Name:      string
  Last_Name:       string
  Address:         string
  Province:        string
  Municipality:    string
  Barangay:        string
  Area_ID:         string
  Area_Name:       string
  Meter_Serial_No: string
  Contact_No:      string
  Account_Status:  string
}

// ── GET /api/meter-reader/consumers ──────────────────────
export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Fetch the meter reader's assigned area
    const meterReader = await queryOne<{ Assigned_Area_ID: string } & RowDataPacket>(
      `SELECT Assigned_Area_ID FROM MeterReader WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader profile not found', 404)
    }

    const assignedArea = meterReader.Assigned_Area_ID

    const search      = req.nextUrl.searchParams.get('search') || ''
    const searchParam = `%${search}%`

    const consumers = await query<ConsumerRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        c.Province,
        c.Municipality,
        c.Barangay,
        c.Area_ID,
        a.Name AS Area_Name,
        c.Meter_Serial_No,
        u.Contact_No,
        u.Account_Status
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       LEFT JOIN Area a ON a.Area_ID = c.Area_ID
       WHERE c.Area_ID = ?
         AND (
           u.First_Name   LIKE ? OR
           u.Last_Name    LIKE ? OR
           c.Consumer_ID  LIKE ? OR
           a.Name         LIKE ?
         )
       ORDER BY u.First_Name ASC`,
      [assignedArea, searchParam, searchParam, searchParam, searchParam]
    )

    return ok(consumers.map((c) => ({
      consumerId:    c.Consumer_ID,
      firstName:     c.First_Name,
      lastName:      c.Last_Name,
      address:       c.Address,
      province:      c.Province,
      municipality:  c.Municipality,
      barangay:      c.Barangay,
      areaId:        c.Area_ID,
      areaName:      c.Area_Name,
      meterSerialNo: c.Meter_Serial_No,
      contactNo:     c.Contact_No,
      accountStatus: c.Account_Status,
    })))

  } catch (error) {
    logger.error('Get consumers error:', error)
    return handleApiError(error)
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
      province,
      municipality,
      barangay,
      meterSerialNo,
      areaId,
      contactNo,
    } = await req.json()


    const reqError = validateRequired({
      firstName, lastName, address, meterSerialNo, areaId, contactNo
    }, ['firstName', 'lastName', 'address', 'meterSerialNo', 'areaId', 'contactNo'])

    if (reqError) {
      return err(reqError, 400)
    }

    // Check for duplicate meter serial number
    const existing = await queryOne(
      'SELECT Consumer_ID FROM Consumer WHERE Meter_Serial_No = ?',
      [meterSerialNo]
    )
    if (existing) {
      return err('Meter serial number already exists', 409)
    }

    const highestUser = await queryOne<{ User_ID: string } & RowDataPacket>(
      `SELECT User_ID FROM User WHERE User_ID LIKE 'user-consumer-%' ORDER BY LENGTH(User_ID) DESC, User_ID DESC LIMIT 1`
    )

    let nextUserSeq = 1
    if (highestUser && highestUser.User_ID) {
      const match = highestUser.User_ID.match(/^user-consumer-(\d+)$/)
      if (match && match[1]) {
        nextUserSeq = parseInt(match[1], 10) + 1
      }
    }
    const userId = `user-consumer-${nextUserSeq.toString().padStart(3, '0')}`
    const loginId = `login-consumer-${nextUserSeq.toString().padStart(3, '0')}`

    // Determine username based on firstName
    const baseUsername = firstName.replace(/\s+/g, '').toLowerCase()
    let username = baseUsername
    let usernameSuffix = 1

    // Ensure username is unique
    while (true) {
      const existingUser = await queryOne(
        'SELECT Login_ID FROM Login WHERE User_name = ?',
        [username]
      )
      if (!existingUser) {
        break
      }
      username = `${baseUsername}${usernameSuffix}`
      usernameSuffix++
    }

    // Default password for consumer
    const hashedPassword = await bcrypt.hash('P@ssw0rd', 10)

    // Insert Login record
    await execute(
      'INSERT INTO Login (Login_ID, User_name, Password) VALUES (?, ?, ?)',
      [loginId, username, hashedPassword]
    )

    await execute(
      `INSERT INTO User (User_ID, First_Name, Last_Name, Contact_No, User_Type, Account_Status, Login_ID)
       VALUES (?, ?, ?, ?, 'consumer', 'Active', ?)`,
      [userId, firstName, lastName, contactNo, loginId]
    )

    const highestConsumer = await queryOne<{ Consumer_ID: string } & RowDataPacket>(
      `SELECT Consumer_ID FROM Consumer WHERE Consumer_ID LIKE 'consumer-%' ORDER BY LENGTH(Consumer_ID) DESC, Consumer_ID DESC LIMIT 1`
    )

    let nextSeq = 1
    if (highestConsumer && highestConsumer.Consumer_ID) {
      const match = highestConsumer.Consumer_ID.match(/^consumer-(\d+)$/)
      if (match && match[1]) {
        nextSeq = parseInt(match[1], 10) + 1
      }
    }

    const consumerId = `consumer-${nextSeq.toString().padStart(3, '0')}`

    await execute(
      `INSERT INTO Consumer (
        Consumer_ID, Address, Province, Municipality, Barangay, Meter_Serial_No, Area_ID, User_ID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [consumerId, address, province, municipality, barangay, meterSerialNo, areaId, userId]
    )

    return ok({ consumerId }, 'Consumer account created successfully')

  } catch (error) {
    logger.error('Create consumer error:', error)
    return handleApiError(error)
  }
}