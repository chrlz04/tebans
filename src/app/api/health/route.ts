import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const connection = await pool.getConnection()
    connection.release()
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: String(error),
      },
      { status: 500 }
    )
  }
}