import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { query, execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface StaffRow extends RowDataPacket {
  User_ID:           string
  First_Name:        string
  Last_Name:         string
  Contact_No:        string
  User_Type:         string
  Account_Status:    string
  Registration_Date: string
  Assigned_Area_ID:  string
  Assigned_Area_Name: string
}

// ── GET /api/admin/staff ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const search = req.nextUrl.searchParams.get('search') || ''
    const searchParam = `%${search}%`

    const staff = await query<StaffRow>(
      `SELECT
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        u.User_Type,
        u.Account_Status,
        u.Registration_Date,
        COALESCE(mr.Assigned_Area_ID, c.Assigned_Area_ID) AS Assigned_Area_ID,
        a.Name AS Assigned_Area_Name
       FROM User u
       LEFT JOIN MeterReader mr ON mr.User_ID = u.User_ID
       LEFT JOIN Cashier c ON c.User_ID = u.User_ID
       LEFT JOIN Area a ON a.Area_ID = COALESCE(mr.Assigned_Area_ID, c.Assigned_Area_ID)
       WHERE u.User_Type IN ('meter_reader','cashier','admin')
         AND (
           u.First_Name  LIKE ? OR
           u.Last_Name   LIKE ? OR
           u.User_ID     LIKE ? OR
           u.User_Type   LIKE ? OR
           a.Name        LIKE ?
         )
       ORDER BY u.Registration_Date DESC`,
      [searchParam, searchParam, searchParam, searchParam, searchParam]
    )

    return ok(staff.map((s) => ({
      userId:             s.User_ID,
      firstName:          s.First_Name,
      lastName:           s.Last_Name,
      contactNo:          s.Contact_No,
      userType:           s.User_Type,
      accountStatus:      s.Account_Status,
      registrationDate:   s.Registration_Date,
      assignedAreaId:     s.Assigned_Area_ID,
      assignedAreaName:   s.Assigned_Area_Name,
    })))

  } catch (error) {
    logger.error('Get staff error:', error)
    return handleApiError(error)
  }
}

// ── POST /api/admin/staff ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    let {
      firstName,
      lastName,
      contactNo,
      username,
      userType,
      assignedAreaId,
      password,
    } = await req.json()

    // Capitalize first character of each word in names
    const capitalize = (s: string) => s ? s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s;
    firstName = capitalize(firstName);
    lastName = capitalize(lastName);

    // Validate required fields

    const reqError = validateRequired({
      firstName, lastName, contactNo, username, userType, password
    }, ['firstName', 'lastName', 'contactNo', 'username', 'userType', 'password'])

    if (reqError) {
      return err(reqError, 400)
    }

    if (!['meter_reader', 'cashier'].includes(userType)) {
      return err('Invalid user type', 400)
    }

    // Check one active meter reader / cashier per service area
    if (assignedAreaId) {
      const activeCount = await queryOne<{ count: number } & RowDataPacket>(
        `SELECT COUNT(*) as count FROM User u
         LEFT JOIN MeterReader mr ON mr.User_ID = u.User_ID
         LEFT JOIN Cashier c ON c.User_ID = u.User_ID
         WHERE u.User_Type = ?
           AND u.Account_Status = 'Active'
           AND (mr.Assigned_Area_ID = ? OR c.Assigned_Area_ID = ?)`,
        [userType, assignedAreaId, assignedAreaId]
      );
      if (activeCount && activeCount.count > 0) {
        return err(`This Service Area already has an active ${userType === 'meter_reader' ? 'Meter Reader' : 'Cashier'}.`, 409)
      }
    }

    // Check if username already exists
    const existing = await queryOne(
      'SELECT Login_ID FROM Login WHERE User_name = ?',
      [username]
    )
    if (existing) {
      let suggestedName = username + '01';
      let index = 1;
      while (true) {
        const check = await queryOne('SELECT Login_ID FROM Login WHERE User_name = ?', [suggestedName]);
        if (!check) break;
        index++;
        suggestedName = username + index.toString().padStart(2, '0');
      }
      return err(`Username already exists. Suggested: ${suggestedName}`, 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate IDs based on userType
    let loginId = ''
    let userId = ''
    let roleId = ''
    let prefix = ''

    if (userType === 'meter_reader') {
      prefix = 'mr'
    } else if (userType === 'cashier') {
      prefix = 'cashier'
    }

    // Get highest existing sequence number for this type
    const highestUser = await queryOne<{ User_ID: string } & RowDataPacket>(
      `SELECT User_ID FROM User WHERE User_ID LIKE ? ORDER BY LENGTH(User_ID) DESC, User_ID DESC LIMIT 1`,
      [`user-${prefix}-%`]
    )

    let nextSeq = 1
    if (highestUser && highestUser.User_ID) {
      const match = highestUser.User_ID.match(new RegExp(`^user-${prefix}-(\\d+)$`))
      if (match && match[1]) {
        nextSeq = parseInt(match[1], 10) + 1
      }
    }

    const seqStr = nextSeq.toString().padStart(3, '0')

    loginId = `login-${prefix}-${seqStr}`
    userId = `user-${prefix}-${seqStr}`
    roleId = `${prefix}-${seqStr}`

    // Insert Login
    await execute(
      'INSERT INTO Login (Login_ID, User_name, Password, Must_Change_Password) VALUES (?, ?, ?, TRUE)',
      [loginId, username, hashedPassword]
    )

    // Insert User
    await execute(
      `INSERT INTO User
        (User_ID, First_Name, Last_Name, Contact_No, User_Type, Account_Status, Login_ID)
       VALUES (?, ?, ?, ?, ?, 'Active', ?)`,
      [userId, firstName, lastName, contactNo, userType, loginId]
    )

    // Insert role-specific record
    if (userType === 'meter_reader') {
      await execute(
        'INSERT INTO MeterReader (MeterReader_ID, Assigned_Area_ID, User_ID) VALUES (?, ?, ?)',
        [roleId, assignedAreaId || null, userId]
      )
    } else if (userType === 'cashier') {
      await execute(
        'INSERT INTO Cashier (Cashier_ID, Assigned_Area_ID, User_ID) VALUES (?, ?, ?)',
        [roleId, assignedAreaId || null, userId]
      )
    }

    return ok({ userId }, 'Staff account created successfully')

  } catch (error) {
    logger.error('Create staff error:', error)
    return handleApiError(error)
  }
}