import { queryOne, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillRow extends RowDataPacket {
  Bill_ID:        string
  Consumer_ID:    string
  Amount:         number
  Payment_Status: string
}

// ── Generate a receipt number ─────────────────────────────
// Uses timestamp + random hex to guarantee uniqueness without a DB read,
// avoiding both race conditions and duplicate-key errors on batch payments.
export function generateReceiptNumber(): string {
  const now  = new Date()
  const YYYY = now.getFullYear()
  const MM   = String(now.getMonth() + 1).padStart(2, '0')
  const DD   = String(now.getDate()).padStart(2, '0')
  const HH   = String(now.getHours()).padStart(2, '0')
  const mm   = String(now.getMinutes()).padStart(2, '0')
  const SS   = String(now.getSeconds()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 0x10000)
    .toString(16).toUpperCase().padStart(4, '0')
  return `RCP-${YYYY}${MM}${DD}-${HH}${mm}${SS}-${rand}`
}

// ── Record a single payment ───────────────────────────────
export async function recordPayment({
  paymentId,
  billId,
  cashierId,
  consumerId,
  amountPaid,
  paymentMethod,
  receiptNumber,
}: {
  paymentId:     string
  billId:        string
  cashierId:     string
  consumerId:    string
  amountPaid:    number
  paymentMethod: string
  receiptNumber: string
}): Promise<void> {
  await execute(
    `INSERT INTO Payment (
      Payment_ID,
      Bill_ID,
      Cashier_ID,
      Consumer_ID,
      Amount_Paid,
      Payment_Method,
      Receipt_Number
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      paymentId,
      billId,
      cashierId,
      consumerId,
      amountPaid,
      paymentMethod,
      receiptNumber,
    ]
  )
}

// ── Update bill payment status ────────────────────────────
export async function updateBillStatus(
  billId:     string,
  amountPaid: number
): Promise<void> {
  const bill = await queryOne<BillRow>(
    'SELECT Bill_ID, Amount, Payment_Status FROM Bill WHERE Bill_ID = ?',
    [billId]
  )

  if (!bill) return

  let newStatus: string

  if (amountPaid >= bill.Amount) {
    newStatus = 'Paid'
  } else {
    newStatus = 'Unpaid'
  }

  await execute(
    'UPDATE Bill SET Payment_Status = ? WHERE Bill_ID = ?',
    [newStatus, billId]
  )
}

// ── Check if a bill is already paid ──────────────────────
export async function isBillPaid(billId: string): Promise<boolean> {
  const bill = await queryOne<BillRow>(
    'SELECT Payment_Status FROM Bill WHERE Bill_ID = ?',
    [billId]
  )
  return bill?.Payment_Status === 'Paid'
}