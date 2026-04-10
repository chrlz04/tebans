import { queryOne, execute } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillRow extends RowDataPacket {
  Bill_ID:        string
  Consumer_ID:    string
  Amount:         number
  Payment_Status: string
}

// ── Generate a receipt number ─────────────────────────────
export async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear()

  const last = await queryOne<RowDataPacket & { id: string }>(
    `SELECT Receipt_Number as id
     FROM Payment
     ORDER BY LENGTH(Receipt_Number) DESC, Receipt_Number DESC
     LIMIT 1`
  )

  let nextNum = 1

  if (last?.id) {
    const parts  = last.id.split('-')
    const parsed = parseInt(parts[parts.length - 1])
    if (!isNaN(parsed)) nextNum = parsed + 1
  }

  const paddedNum = String(nextNum).padStart(3, '0')
  return `RCP-${year}-${paddedNum}`
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