import axios from 'axios'

interface SmsPayload {
  to:      string
  content: string
}

interface SmsResult {
  success: boolean
  message: string
}

// ── Send a single SMS via httpSMS ─────────────────────────
export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  try {
    const apiKey     = process.env.HTTPSMS_API_KEY
    const fromNumber = process.env.HTTPSMS_PHONE_NUMBER

    if (!apiKey || !fromNumber) {
      console.warn('SMS credentials not configured — skipping SMS')
      return {
        success: false,
        message: 'SMS credentials not configured',
      }
    }

    await axios.post(
      'https://api.httpsms.com/v1/messages/send',
      {
        from:    fromNumber,
        to:      payload.to,
        content: payload.content,
      },
      {
        headers: {
          'x-api-key':    apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    return { success: true, message: 'SMS sent successfully' }

  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, message: 'Failed to send SMS' }
  }
}

// ── Build billing alert message ───────────────────────────
export function buildBillingAlertMessage({
  consumerName,
  billAmount,
  dueDate,
  billingMonth,
}: {
  consumerName:  string
  billAmount:    number
  dueDate:       string
  billingMonth:  string
}): string {
  const formattedAmount = billAmount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })
  const formattedDate = new Date(dueDate).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })

  return (
    `Dear ${consumerName}, your electricity bill for ` +
    `${billingMonth} is ₱${formattedAmount}. ` +
    `Please pay on or before ${formattedDate}. ` +
    `- Tubod Electric Cooperative`
  )
}

// ── Build payment receipt message ──────────────────────────
export function buildPaymentReceiptMessage({
  consumerName,
  amountPaid,
  receiptNumber,
}: {
  consumerName:  string
  amountPaid:    number
  receiptNumber: string
}): string {
  const formattedAmount = amountPaid.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })

  return (
    `Dear ${consumerName}, your payment of ₱${formattedAmount} has been received. ` +
    `Receipt No: ${receiptNumber}. ` +
    `- Tubod Electric Cooperative`
  )
}

// ── Build disconnection alert message ────────────────────
export function buildDisconnectionMessage({
  consumerName,
  scheduledDate,
  reason,
}: {
  consumerName:  string
  scheduledDate: string
  reason:        string
}): string {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })

  return (
    `Dear ${consumerName}, your electricity service is scheduled ` +
    `for disconnection on ${formattedDate} due to: ${reason}. ` +
    `Please settle your account immediately. ` +
    `- Tubod Electric Cooperative`
  )
}