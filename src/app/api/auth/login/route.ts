import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryOne } from '@/lib/db-helpers'
import { ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limiter'
import { RowDataPacket } from 'mysql2'

interface LoginRow extends RowDataPacket {
  Login_ID:       string
  User_name:      string
  Password:       string
  User_ID:        string
  User_Type:      string
  Account_Status: string
  First_Name:     string
  Last_Name:      string
}

export async function POST(req: NextRequest) {
  try {

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const { allowed } = checkRateLimit(ip)
    if (!allowed) {
      return err('Too many login attempts, please try again later', 429)
    }

    const { username, password } = await req.json()

    // ── Validate inputs ──
    const validationError = validateRequired({ username, password }, ['username', 'password'])
    if (validationError) {
      return err(validationError, 400)
    }

    // ── Find user by username ──
    const user = await queryOne<LoginRow & { Must_Change_Password?: boolean }>(`
      SELECT
        l.Login_ID,
        l.User_name,
        l.Password,
        l.Must_Change_Password,
        u.User_ID,
        u.User_Type,
        u.Account_Status,
        u.First_Name,
        u.Last_Name
      FROM Login l
      JOIN User u ON u.Login_ID = l.Login_ID
      WHERE l.User_name = ?
    `, [username])

    const account = user

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

    const fullName = `${account.First_Name} ${account.Last_Name}`.trim()

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        role: account.User_Type,
        userId: account.User_ID,
        name: fullName,
        mustChangePassword: !!account.Must_Change_Password,
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;

  } catch (error) {
    logger.error('Login error:', error)
    return handleApiError(error)
  }
}