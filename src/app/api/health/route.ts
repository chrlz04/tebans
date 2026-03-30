import { NextResponse } from 'next/server'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface TableRow extends RowDataPacket {
  Tables_in_tebans_db: string
}

export async function GET() {
  try {
    const tables = await query<TableRow>('SHOW TABLES')
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      tables: tables.map((t) => t.Tables_in_tebans_db),
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