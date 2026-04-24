'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import clsx from 'clsx'

const smsSettingsSchema = z.object({
  SMS_PROVIDER: z.enum(['', 'httpsms', 'textbee', 'android-sms-gateway', 'semaphore', 'custom']),
  SMS_API_URL: z.string().url('Must be a valid URL').or(z.literal('')),
  SMS_API_KEY: z.string().optional(),
  SMS_PHONE_NUMBER: z.string().min(1, 'Phone Number is required'),
  SMS_DEVICE_ID: z.string().optional(),
  SMS_USERNAME: z.string().optional(),
  SMS_PASSWORD: z.string().optional(),
  SMS_CUSTOM_AUTH_TYPE: z.string().optional(),
  SMS_CUSTOM_AUTH_HEADER: z.string().optional(),
  SMS_CUSTOM_PAYLOAD: z.string().optional(),
}).refine(
  (data) => data.SMS_PROVIDER !== '',
  {
    message: 'SMS Provider is required',
    path: ['SMS_PROVIDER'],
  }
).refine(
  (data) => {
    // API URL is required for all
    if (!data.SMS_API_URL) return false;
    return true;
  },
  {
    message: 'Must be a valid URL',
    path: ['SMS_API_URL'],
  }
).refine(
  (data) => {
    // conditionally require API Key
    if (['textbee', 'semaphore'].includes(data.SMS_PROVIDER)) {
      if (!data.SMS_API_KEY || data.SMS_API_KEY.trim() === '') {
        return false;
      }
    }
    return true;
  },
  {
    message: 'API Key is required for this provider',
    path: ['SMS_API_KEY'],
  }
)

type SmsSettingsFormData = z.infer<typeof smsSettingsSchema>

export default function SmsSettingsForm() {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SmsSettingsFormData>({
    resolver: zodResolver(smsSettingsSchema),
    defaultValues: {
      SMS_PROVIDER: '',
      SMS_API_URL: '',
      SMS_API_KEY: '',
      SMS_PHONE_NUMBER: '',
      SMS_DEVICE_ID: '',
      SMS_USERNAME: '',
      SMS_PASSWORD: '',
      SMS_CUSTOM_AUTH_TYPE: '',
      SMS_CUSTOM_AUTH_HEADER: '',
      SMS_CUSTOM_PAYLOAD: '',
    }
  })

  const selectedProvider = watch('SMS_PROVIDER')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/sms-settings')
        reset(response.data as any) // Need to match form keys
      } catch (err: any) {
        setErrorMsg('Failed to load SMS settings.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [reset])

  const onSubmit = async (data: SmsSettingsFormData) => {
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await api.put('/admin/sms-settings', data)
      setSuccessMsg('SMS settings updated successfully')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update SMS settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-gray-500 text-sm py-4 animate-pulse">Loading settings...</div>
  }

  return (
    <div className="bg-white">
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-start gap-2 text-sm border border-green-200">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMS Provider
          </label>
          <select
            {...register('SMS_PROVIDER')}
            className={clsx(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
              errors.SMS_PROVIDER ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
            )}
          >
            <option value="">-- Select Provider --</option>
            <option value="httpsms">HttpSms</option>
            <option value="textbee">Textbee</option>
            <option value="android-sms-gateway">Android SMS Gateway</option>
            <option value="semaphore">Semaphore</option>
            <option value="custom">Custom</option>
          </select>
          {errors.SMS_PROVIDER && (
            <p className="mt-1 text-sm text-red-600">{errors.SMS_PROVIDER.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API URL
          </label>
          <input
            {...register('SMS_API_URL')}
            type="text"
            placeholder="https://api.httpsms.com/v1/messages/send"
            className={clsx(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
              errors.SMS_API_URL ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
            )}
          />
          {errors.SMS_API_URL && (
            <p className="mt-1 text-sm text-red-600">{errors.SMS_API_URL.message}</p>
          )}
        </div>

        {['httpsms', 'textbee', 'android-sms-gateway', 'semaphore', 'custom'].includes(selectedProvider) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              {...register('SMS_API_KEY')}
              type="password"
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                errors.SMS_API_KEY ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
              )}
            />
            {errors.SMS_API_KEY && (
              <p className="mt-1 text-sm text-red-600">{errors.SMS_API_KEY.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sender Phone Number
          </label>
          <input
            {...register('SMS_PHONE_NUMBER')}
            type="text"
            placeholder="+639123456789"
            className={clsx(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
              errors.SMS_PHONE_NUMBER ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
            )}
          />
          {errors.SMS_PHONE_NUMBER && (
            <p className="mt-1 text-sm text-red-600">{errors.SMS_PHONE_NUMBER.message}</p>
          )}
        </div>

        {['textbee', 'custom'].includes(selectedProvider) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device ID
            </label>
            <input
              {...register('SMS_DEVICE_ID')}
              type="text"
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                errors.SMS_DEVICE_ID ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
              )}
            />
            {errors.SMS_DEVICE_ID && (
              <p className="mt-1 text-sm text-red-600">{errors.SMS_DEVICE_ID.message}</p>
            )}
          </div>
        )}

        {['android-sms-gateway', 'semaphore', 'custom'].includes(selectedProvider) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username {selectedProvider === 'semaphore' && '(Sender Name)'}
            </label>
            <input
              {...register('SMS_USERNAME')}
              type="text"
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                errors.SMS_USERNAME ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
              )}
            />
            {errors.SMS_USERNAME && (
              <p className="mt-1 text-sm text-red-600">{errors.SMS_USERNAME.message}</p>
            )}
          </div>
        )}

        {['android-sms-gateway', 'custom'].includes(selectedProvider) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register('SMS_PASSWORD')}
              type="password"
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                errors.SMS_PASSWORD ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
              )}
            />
            {errors.SMS_PASSWORD && (
              <p className="mt-1 text-sm text-red-600">{errors.SMS_PASSWORD.message}</p>
            )}
          </div>
        )}

        {selectedProvider === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Auth Type
              </label>
              <input
                {...register('SMS_CUSTOM_AUTH_TYPE')}
                type="text"
                placeholder="e.g. Bearer, Basic"
                className={clsx(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                  errors.SMS_CUSTOM_AUTH_TYPE ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                )}
              />
              {errors.SMS_CUSTOM_AUTH_TYPE && (
                <p className="mt-1 text-sm text-red-600">{errors.SMS_CUSTOM_AUTH_TYPE.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Auth Header
              </label>
              <input
                {...register('SMS_CUSTOM_AUTH_HEADER')}
                type="text"
                placeholder="e.g. Authorization, x-api-key"
                className={clsx(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                  errors.SMS_CUSTOM_AUTH_HEADER ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                )}
              />
              {errors.SMS_CUSTOM_AUTH_HEADER && (
                <p className="mt-1 text-sm text-red-600">{errors.SMS_CUSTOM_AUTH_HEADER.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Payload (JSON)
              </label>
              <textarea
                {...register('SMS_CUSTOM_PAYLOAD')}
                placeholder='{"to": "{{to}}", "message": "{{content}}"}'
                className={clsx(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]",
                  errors.SMS_CUSTOM_PAYLOAD ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                )}
                rows={3}
              />
              {errors.SMS_CUSTOM_PAYLOAD && (
                <p className="mt-1 text-sm text-red-600">{errors.SMS_CUSTOM_PAYLOAD.message}</p>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
