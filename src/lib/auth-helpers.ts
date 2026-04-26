import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

export interface JwtPayload {
  userId: string
  role:   Role
  mustChangePassword?: boolean
}

// ─── Verify JWT from cookies ──────────────────────────────
export function verifyToken(req: NextRequest): JwtPayload | null {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return null;
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ─── Require auth + specific role ────────────────────────
export function requireRole(
  req: NextRequest,
  allowedRoles: Role[]
): { error: NextResponse | null; payload: JwtPayload | null } {
  const payload = verifyToken(req)

  if (!payload) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      ),
      payload: null,
    }
  }

  // Force password change check
  const isChangePasswordRoute = req.nextUrl.pathname === '/api/auth/change-password'
  const isLogoutRoute = req.nextUrl.pathname === '/api/auth/logout'

  if (payload.mustChangePassword && !isChangePasswordRoute && !isLogoutRoute) {
    return {
      error: NextResponse.json(
        { success: false, message: 'PASSWORD_CHANGE_REQUIRED' },
        { status: 403 }
      ),
      payload: null,
    }
  }

  if (!allowedRoles.includes(payload.role)) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      ),
      payload: null,
    }
  }

  return { error: null, payload }
}

// ─── Standard JSON responses ──────────────────────────────
export function ok(data: unknown, message = 'Success') {
  return NextResponse.json({ success: true, message, data })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}