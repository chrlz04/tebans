import { NextResponse } from 'next/server'

export interface AppError extends Error {
  status?: number
  code?:   string
}

// ── Standardized error response ───────────────────────────
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]:', error)

  // Known app error
  if (error instanceof Error) {
    // MySQL duplicate entry
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, message: 'A record with that value already exists' },
        { status: 409 }
      )
    }

    // MySQL foreign key constraint
    if ((error as any).code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json(
        { success: false, message: 'Referenced record does not exist' },
        { status: 400 }
      )
    }

    // MySQL connection error
    if (
      (error as any).code === 'ECONNREFUSED' ||
      (error as any).code === 'PROTOCOL_CONNECTION_LOST'
    ) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 503 }
      )
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, message: 'Token has expired' },
        { status: 401 }
      )
    }
  }

  // Generic fallback
  return NextResponse.json(
    { success: false, message: 'Internal server error' },
    { status: 500 }
  )
}