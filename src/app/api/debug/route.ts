import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface LoginRow extends RowDataPacket {
  Login_ID:       string
  User_name:      string
  Password:       string
  User_ID:        string
  User_Type:      string
  Account_Status: string
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  // Step 1: Find login record
  const loginRecord = await queryOne<LoginRow & RowDataPacket>(
    'SELECT * FROM Login WHERE User_name = ?',
    [username]
  )

  if (!loginRecord) {
    return Response.json({
      step: 1,
      error: 'No login record found with that username',
      username,
    })
  }

  // Step 2: Find user via JOIN
  const userRecord = await queryOne<LoginRow>(
    `SELECT
      l.Login_ID,
      l.User_name,
      l.Password,
      u.User_ID,
      u.User_Type,
      u.Account_Status
    FROM Login l
    JOIN User u ON u.Login_ID = l.Login_ID
    WHERE l.User_name = ?`,
    [username]
  )

  if (!userRecord) {
    return Response.json({
      step: 2,
      error: 'Login record exists but JOIN with User failed',
      loginRecord: {
        Login_ID:  loginRecord.Login_ID,
        User_name: loginRecord.User_name,
      },
    })
  }

  // Step 3: Check account status
  if (userRecord.Account_Status !== 'Active') {
    return Response.json({
      step: 3,
      error: 'Account is not Active',
      Account_Status: userRecord.Account_Status,
    })
  }

  // Step 4: Check password
  const isMatch = await bcrypt.compare(password, userRecord.Password)

  return Response.json({
    step: 4,
    usernameFound:  true,
    joinSuccess:    true,
    accountStatus:  userRecord.Account_Status,
    passwordMatch:  isMatch,
    storedHash:     userRecord.Password,
  })
}