import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryOne } from '@/lib/db-helpers'
import { ok, err } from '@/lib/auth-helpers'
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
  try {
    const { username, password } = await req.json()

    // ── Validate inputs ──
    if (!username || !password) {
      return err('Username and password are required', 400)
    }

    // ── Find user by username ──
    const user = await queryOne<LoginRow>(`
      SELECT
        l.Login_ID,
        l.User_name,
        l.Password,
        u.User_ID,
        u.User_Type,
        u.Account_Status
      FROM Login l
      JOIN User u ON u.Login_ID = l.Login_ID
      WHERE l.User_name = ?
    `, [username])

    // ── Also check if consumer ──
    let consumerUser = null
    if (!user) {
      consumerUser = await queryOne<LoginRow>(`
        SELECT
          l.Login_ID,
          l.User_name,
          l.Password,
          c.Consumer_ID AS User_ID,
          'consumer'    AS User_Type,
          c.Account_Status
        FROM Login l
        JOIN Consumer c ON c.Login_ID = l.Login_ID
        WHERE l.User_name = ?
      `, [username])
    }

    const account = user || consumerUser

    if (!account) {
      return err('Invalid username or password', 401)
    }

    // ── Check account status ──
    if (account.Account_Status !== 'Active') {
      return err('Your account is inactive. Please contact the administrator.', 403)
    }

    // ── Verify password ──
    const isMatch = await bcrypt.compare(password, account.Password)
    if (!isMatch) {
      return err('Invalid username or password', 401)
    }

    // ── Generate JWT ──
    const token = jwt.sign(
    {
        userId: account.User_ID,
        role:   account.User_Type,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' } as jwt.SignOptions
    )

    return ok({
      token,
      role:   account.User_Type,
      userId: account.User_ID,
    }, 'Login successful')

  } catch (error) {
    console.error('Login error:', error)
    return err('Internal server error', 500)
  }
}