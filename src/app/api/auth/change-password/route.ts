import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryOne, execute } from '@/lib/db-helpers'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { RowDataPacket } from 'mysql2'

interface LoginRow extends RowDataPacket {
  Login_ID: string
  Password: string
}

export async function PUT(req: NextRequest) {
  try {
    // ── Require any authenticated role ──
    const { error, payload } = requireRole(req, [
      'admin',
      'consumer',
      'meter_reader',
      'cashier',
    ])
    if (error) return error

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return err('Current and new password are required', 400)
    }

    if (newPassword.length < 8) {
      return err('Password must be at least 8 characters', 400)
    }

    // ── Get current password from DB ──
    let loginRow: LoginRow | null = null

    if (payload!.role === 'consumer') {
      loginRow = await queryOne<LoginRow>(`
        SELECT l.Login_ID, l.Password
        FROM Login l
        JOIN Consumer c ON c.Login_ID = l.Login_ID
        WHERE c.Consumer_ID = ?
      `, [payload!.userId])
    } else {
      loginRow = await queryOne<LoginRow>(`
        SELECT l.Login_ID, l.Password
        FROM Login l
        JOIN User u ON u.Login_ID = l.Login_ID
        WHERE u.User_ID = ?
      `, [payload!.userId])
    }

    if (!loginRow) {
      return err('User not found', 404)
    }

    // ── Verify current password ──
    const isMatch = await bcrypt.compare(currentPassword, loginRow.Password)
    if (!isMatch) {
      return err('Current password is incorrect', 400)
    }

    // ── Hash new password ──
    const hashed = await bcrypt.hash(newPassword, 10)

    // ── Update password ──
    await execute(
      'UPDATE Login SET Password = ? WHERE Login_ID = ?',
      [hashed, loginRow.Login_ID]
    )

    return ok(null, 'Password changed successfully')

  } catch (error) {
    console.error('Change password error:', error)
    return err('Internal server error', 500)
  }
}