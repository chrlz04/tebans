import axios from 'axios'
import { logger } from '@/lib/logger'

interface SmsPayload {
  to:      string
  content: string
}

interface SmsResult {
  success:   boolean
  message:   string
  messageId?: string
}

// ── Format PH number to E.164 ─────────────────────────────
// Accepts: 09123456789, 9123456789, +639123456789
// Returns: +639123456789
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').trim()

  if (cleaned.startsWith('+63')) {
    return cleaned
  }

  if (cleaned.startsWith('0')) {
    return `+63${cleaned.slice(1)}`
  }

  if (cleaned.startsWith('63')) {
    return `+${cleaned}`
  }

  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return `+63${cleaned}`
  }

  return cleaned
}

// ── Send a single SMS via httpSMS ─────────────────────────
export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  try {
    const apiKey     = process.env.HTTPSMS_API_KEY
    const fromNumber = process.env.HTTPSMS_PHONE_NUMBER

    if (!apiKey || !fromNumber) {
      logger.warn('SMS credentials not configured — skipping SMS')
      return {
        success: false,
        message: 'SMS credentials not configured',
      }
    }

    // Format the recipient number
    const formattedTo = formatPhoneNumber(payload.to)

    logger.info('Sending SMS', {
      to:      formattedTo,
      length:  payload.content.length,
    })

    const response = await axios.post(
      'https://api.httpsms.com/v1/messages/send',
      {
        from:    fromNumber,
        to:      formattedTo,
        content: payload.content,
      },
      {
        headers: {
          'x-api-key':    apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    )

    logger.info('SMS sent successfully', {
      to:        formattedTo,
      messageId: response.data?.data?.id,
    })

    return {
      success:   true,
      message:   'SMS sent successfully',
      messageId: response.data?.data?.id,
    }

  } catch (error) {
    logger.error('SMS send failed', {
      to:    payload.to,
      error: String(error),
    })
    return {
      success: false,
      message: 'Failed to send SMS',
    }
  }
}

// ── Build billing alert message ───────────────────────────
export function buildBillingAlertMessage({
  consumerName,
  billAmount,
  dueDate,
  billingMonth,
  previousReading,
  currentReading,
}: {
  consumerName:  string
  billAmount:    number
  dueDate:       string
  billingMonth:  string
  previousReading: number
  currentReading:  number
}): string {
  const formattedAmount = billAmount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })
  const formattedDate = new Date(dueDate).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
  const totalKwh = currentReading - previousReading

  return (
    `Dear ${consumerName}, your electricity bill for ` +
    `${billingMonth} is P${formattedAmount} (Previous: ${previousReading} kWh, Present: ${currentReading} kWh) with a total of ${totalKwh} kWh used this month. ` +
    `Please pay on or before ${formattedDate}.\n\n` +
    `- TEBANS`
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
    `- TEBANS`
  )
}
