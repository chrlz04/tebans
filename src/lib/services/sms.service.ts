import axios from 'axios'
import { logger } from '@/lib/logger'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface SmsPayload {
  to:      string
  content: string
}

interface SmsResult {
  success:   boolean
  message:   string
  messageId?: string
}

interface SettingRow extends RowDataPacket {
  Setting_Key: string
  Setting_Value: string
}

// ── Format PH number to E.164 ─────────────────────────────
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\s+/g, '').trim()

  if (cleaned.startsWith('+63')) return cleaned
  if (cleaned.startsWith('0')) return `+63${cleaned.slice(1)}`
  if (cleaned.startsWith('63')) return `+${cleaned}`
  if (cleaned.startsWith('9') && cleaned.length === 10) return `+63${cleaned}`
  return cleaned
}

// ── Provider Adapters ────────────────────────────────────

interface AdapterConfig {
  apiUrl: string
  apiKey: string
  phoneNumber: string
  deviceId: string
  username: string
  password?: string
  customAuthType?: string
  customAuthHeader?: string
  customPayload?: string
}

interface RequestConfig {
  url: string
  method?: string
  headers?: Record<string, string>
  data?: any
}

interface SmsAdapter {
  buildRequestConfig: (payload: SmsPayload, formattedTo: string, config: AdapterConfig) => RequestConfig
  parseMessageId: (responseData: any) => string | undefined
}

const adapters: Record<string, SmsAdapter> = {
  httpsms: {
    buildRequestConfig: (payload, formattedTo, config) => ({
      url: config.apiUrl,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        from: config.phoneNumber,
        to: formattedTo,
        content: payload.content,
      }
    }),
    parseMessageId: (data) => data?.data?.id
  },
  textbee: {
    buildRequestConfig: (payload, formattedTo, config) => ({
      url: config.apiUrl,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        to: formattedTo,
        message: payload.content,
        deviceId: config.deviceId
      }
    }),
    parseMessageId: (data) => data?.data?._id || data?._id
  },
  'android-sms-gateway': {
    buildRequestConfig: (payload, formattedTo, config) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (config.username) {
        const credentials = Buffer.from(`${config.username}:${config.password || ''}`).toString('base64')
        headers['Authorization'] = `Basic ${credentials}`
      } else if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`
      }

      return {
        url: config.apiUrl,
        headers,
        data: {
          phone: formattedTo,
          message: payload.content
        }
      }
    },
    parseMessageId: (data) => data?.id || data?.messageId
  },
  semaphore: {
    buildRequestConfig: (payload, formattedTo, config) => ({
      url: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        apikey: config.apiKey,
        number: formattedTo,
        message: payload.content,
        sendername: config.username || config.phoneNumber
      }
    }),
    parseMessageId: (data) => Array.isArray(data) ? data[0]?.message_id : data?.message_id
  },
  custom: {
    buildRequestConfig: (payload, formattedTo, config) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (config.customAuthType && config.customAuthHeader) {
         let authValue = config.apiKey;
         if (config.customAuthType.toLowerCase() === 'bearer') {
           authValue = `Bearer ${config.apiKey}`;
         } else if (config.customAuthType.toLowerCase() === 'basic' && config.username) {
           authValue = `Basic ${Buffer.from(`${config.username}:${config.password || ''}`).toString('base64')}`;
         }
         headers[config.customAuthHeader] = authValue;
      } else if (config.apiKey) {
         headers['Authorization'] = `Bearer ${config.apiKey}`
      }

      let data: any = {};
      try {
        if (config.customPayload) {
           let payloadStr = config.customPayload;
           // replace placeholders, escaping quotes in content
           payloadStr = payloadStr.replace(/\{\{to\}\}/g, formattedTo);
           // safely replace content placeholder
           payloadStr = payloadStr.replace(/\{\{content\}\}/g, payload.content.replace(/"/g, '\\"').replace(/\n/g, '\\n'));
           payloadStr = payloadStr.replace(/\{\{from\}\}/g, config.phoneNumber);
           data = JSON.parse(payloadStr);
        } else {
           data = { to: formattedTo, content: payload.content };
        }
      } catch (e) {
         logger.error('Failed to parse custom SMS payload template', { error: String(e) });
         data = { to: formattedTo, content: payload.content };
      }

      return {
        url: config.apiUrl,
        headers,
        data
      }
    },
    parseMessageId: (data) => data?.id || data?.messageId
  }
}

// ── Send a single SMS via configured Provider ─────────────────────────
export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  try {
    let providerName = 'httpsms'
    let apiUrl = process.env.HTTPSMS_API_URL || 'https://api.httpsms.com/v1/messages/send'
    let apiKey = process.env.HTTPSMS_API_KEY || ''
    let fromNumber = process.env.HTTPSMS_PHONE_NUMBER || ''
    let deviceId = ''
    let username = ''
    let password = ''
    let customAuthType = ''
    let customAuthHeader = ''
    let customPayload = ''

    try {
      const keys = [
        'SMS_PROVIDER', 'SMS_API_URL', 'SMS_API_KEY', 'SMS_PHONE_NUMBER',
        'SMS_DEVICE_ID', 'SMS_USERNAME', 'SMS_PASSWORD',
        'SMS_CUSTOM_AUTH_TYPE', 'SMS_CUSTOM_AUTH_HEADER', 'SMS_CUSTOM_PAYLOAD'
      ]

      const rows = await query<SettingRow>(
        `SELECT Setting_Key, Setting_Value FROM System_Settings WHERE Setting_Key IN (${keys.map(() => '?').join(', ')})`,
        keys
      )

      const dbSettings = rows.reduce((acc, row) => {
        acc[row.Setting_Key] = row.Setting_Value
        return acc
      }, {} as Record<string, string>)

      if (dbSettings['SMS_PROVIDER'] != null && dbSettings['SMS_PROVIDER'] !== '') providerName = dbSettings['SMS_PROVIDER']
      if (dbSettings['SMS_API_URL'] != null && dbSettings['SMS_API_URL'] !== '') apiUrl = dbSettings['SMS_API_URL']
      if (dbSettings['SMS_API_KEY'] != null && dbSettings['SMS_API_KEY'] !== '') apiKey = dbSettings['SMS_API_KEY']
      if (dbSettings['SMS_PHONE_NUMBER'] != null && dbSettings['SMS_PHONE_NUMBER'] !== '') fromNumber = dbSettings['SMS_PHONE_NUMBER']
      if (dbSettings['SMS_DEVICE_ID'] != null && dbSettings['SMS_DEVICE_ID'] !== '') deviceId = dbSettings['SMS_DEVICE_ID']
      if (dbSettings['SMS_USERNAME'] != null && dbSettings['SMS_USERNAME'] !== '') username = dbSettings['SMS_USERNAME']
      if (dbSettings['SMS_PASSWORD'] != null && dbSettings['SMS_PASSWORD'] !== '') password = dbSettings['SMS_PASSWORD']
      if (dbSettings['SMS_CUSTOM_AUTH_TYPE'] != null && dbSettings['SMS_CUSTOM_AUTH_TYPE'] !== '') customAuthType = dbSettings['SMS_CUSTOM_AUTH_TYPE']
      if (dbSettings['SMS_CUSTOM_AUTH_HEADER'] != null && dbSettings['SMS_CUSTOM_AUTH_HEADER'] !== '') customAuthHeader = dbSettings['SMS_CUSTOM_AUTH_HEADER']
      if (dbSettings['SMS_CUSTOM_PAYLOAD'] != null && dbSettings['SMS_CUSTOM_PAYLOAD'] !== '') customPayload = dbSettings['SMS_CUSTOM_PAYLOAD']

    } catch (dbError) {
      logger.warn('Failed to fetch SMS settings from database, falling back to env vars', { error: String(dbError) })
    }

    if (!apiUrl) {
      logger.warn('SMS API URL not configured — skipping SMS')
      return { success: false, message: 'SMS API URL not configured' }
    }

    // Some providers don't need API Key (e.g. basic auth via username/password)
    // but we generally expect at least some config. Allow adapters to decide.

    const adapter = adapters[providerName] || adapters['custom'];

    // Format the recipient number
    const formattedTo = formatPhoneNumber(payload.to)
    const formattedFrom = formatPhoneNumber(fromNumber)

    logger.info('Sending SMS', {
      provider: providerName,
      to:       formattedTo,
      length:   payload.content.length,
      apiUrl:   apiUrl
    })

    const requestConfig = adapter.buildRequestConfig(payload, formattedTo, {
       apiUrl, apiKey, phoneNumber: formattedFrom, deviceId, username, password,
       customAuthType, customAuthHeader, customPayload
    });

    const response = await axios.request({
      url: requestConfig.url,
      method: requestConfig.method || 'POST',
      headers: requestConfig.headers,
      data: requestConfig.data,
      timeout: 10000, // 10 second timeout
    })

    const messageId = adapter.parseMessageId(response.data);

    logger.info('SMS sent successfully', {
      provider:  providerName,
      to:        formattedTo,
      messageId: messageId,
    })

    return {
      success:   true,
      message:   'SMS sent successfully',
      messageId: messageId,
    }

  } catch (error: any) {
    logger.error('SMS send failed', {
      to:    payload.to,
      error: String(error),
      response: error.response?.data
    })
    return {
      success: false,
      message: 'Failed to send SMS',
    }
  }
}
