import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

export interface JwtPayload {
  userId: string
  role:   Role
}

// ─── Verify JWT from request header ──────────────────────
export function verifyToken(req: NextRequest): JwtPayload | null {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload
    return decoded
  } catch {
    return null
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