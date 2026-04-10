import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface LastReadingRow extends RowDataPacket {
  Current_Reading: number
}

// ── Get previous reading for a consumer ──────────────────
export async function getPreviousReading(
  consumerId: string
): Promise<number> {
  const last = await queryOne<LastReadingRow>(
    `SELECT Current_Reading
     FROM MeterReading
     WHERE Consumer_ID = ?
     ORDER BY Date_Recorded DESC
     LIMIT 1`,
    [consumerId]
  )
  return last?.Current_Reading ?? 0
}

// ── Get billing month from reading date ───────────────────
export function getBillingMonth(readingDate: string): string {
  const date = new Date(readingDate)
  return date.toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
  })
}

// ── Generate next sequential ID ───────────────────────────
export async function generateSequentialId(
  table:     string,
  column:    string,
  prefix:    string,
  separator: string = '-'
): Promise<string> {
  const year = new Date().getFullYear()

  const last = await queryOne<RowDataPacket & { id: string }>(
    `SELECT ${column} as id
     FROM ${table}
     ORDER BY ${column} DESC
     LIMIT 1`
  )

  let nextNum = 1

  if (last?.id) {
    const parts  = last.id.split(separator)
    const parsed = parseInt(parts[parts.length - 1])
    if (!isNaN(parsed)) nextNum = parsed + 1
  }

  const paddedNum = String(nextNum).padStart(3, '0')
  return `${prefix}${separator}${year}${separator}${paddedNum}`
}