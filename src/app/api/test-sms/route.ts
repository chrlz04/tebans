import { NextRequest } from 'next/server'
import { sendSms, formatPhoneNumber } from '@/lib/services/sms.service'
import { ok, err } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, message } = await req.json()

    if (!phoneNumber || !message) {
      return err('phoneNumber and message are required', 400)
    }

    const formatted = formatPhoneNumber(phoneNumber)

    const result = await sendSms({
      to:      formatted,
      content: message,
    })

    return ok({
      ...result,
      formattedNumber: formatted,
    })

  } catch (error) {
    return err('Failed to send test SMS', 500)
  }
}
