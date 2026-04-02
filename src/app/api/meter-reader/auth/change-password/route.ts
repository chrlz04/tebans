import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface LoginRow extends RowDataPacket {
  Login_ID: string
  Password: string
}

export async function PUT(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return err('Current and new password are required', 400)
    }

    if (newPassword.length < 8) {
      return err('Password must be at least 8 characters', 400)
    }

    const loginRow = await queryOne<LoginRow>(
      `SELECT l.Login_ID, l.Password
       FROM Login l
       JOIN User u ON u.Login_ID = l.Login_ID
       WHERE u.User_ID = ?`,
      [payload!.userId]
    )

    if (!loginRow) {
      return err('User not found', 404)
    }

    const isMatch = await bcrypt.compare(currentPassword, loginRow.Password)
    if (!isMatch) {
      return err('Current password is incorrect', 400)
    }

    const hashed = await bcrypt.hash(newPassword, 10)

    await execute(
      'UPDATE Login SET Password = ? WHERE Login_ID = ?',
      [hashed, loginRow.Login_ID]
    )

    return ok(null, 'Password changed successfully')

  } catch (error) {
    console.error('Meter reader change password error:', error)
    return err('Internal server error', 500)
  }
}