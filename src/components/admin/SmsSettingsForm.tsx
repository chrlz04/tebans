'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import clsx from 'clsx'

const smsSettingsSchema = z.object({
  SMS_API_URL: z.string().url('Must be a valid URL'),
  SMS_API_KEY: z.string().min(1, 'API Key is required'),
  SMS_PHONE_NUMBER: z.string().min(1, 'Phone Number is required'),
})

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
    formState: { errors },
  } = useForm<SmsSettingsFormData>({
    resolver: zodResolver(smsSettingsSchema),
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/admin/sms-settings')
        reset(data as any) // Need to match form keys
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
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-4">SMS API Provider Settings</h2>

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
