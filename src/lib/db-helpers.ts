import mysql from "mysql2/promise"; import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// ─── Run a SELECT query ───────────────────────────────────
export async function query<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute<T[]>(sql, params)
  return rows
}

// ─── Run INSERT / UPDATE / DELETE ────────────────────────
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params)
  return result
}

// ─── Get a single row ─────────────────────────────────────
export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}
// ─── Execute inside a transaction ─────────────────────────
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection()
  await connection.beginTransaction()
  try {
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
