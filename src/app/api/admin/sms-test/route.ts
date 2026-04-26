import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { sendSms } from '@/lib/services/sms.service'
import { execute } from '@/lib/db-helpers'

export async function POST(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const body = await req.json()
    const { to } = body

    if (!to) {
      return err('Destination phone number is required', 400)
    }

    const testContent = "This is a test message from TEBANS SMS Configuration."

    const result = await sendSms({
      to,
      content: testContent
    })

    const currentDate = new Date().toISOString()
    const status = result.success ? 'connection successful' : 'connection failed'

    // Save test date and status to settings
    await execute(`INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`, ['SMS_LAST_TEST_DATE', currentDate, currentDate])
    await execute(`INSERT INTO System_Settings (Setting_Key, Setting_Value) VALUES (?, ?) ON DUPLICATE KEY UPDATE Setting_Value = ?`, ['SMS_LAST_TEST_STATUS', status, status])

    if (result.success) {
      return ok({
         message: result.message,
         messageId: result.messageId,
         lastTestDate: currentDate,
         lastTestStatus: status
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to send test SMS',
        lastTestDate: currentDate,
        lastTestStatus: status
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Test SMS error:', error)
    return err(error.message || 'Internal server error', 500)
  }
}
