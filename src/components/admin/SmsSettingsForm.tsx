'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, AlertCircle, CheckCircle2, MessageSquare, ListFilter, PenLine, Send, X } from 'lucide-react'
import api from '@/lib/api'
import clsx from 'clsx'

const smsSettingsSchema = z.object({
  SMS_PROVIDER: z.enum(['', 'httpsms', 'textbee', 'android-sms-gateway', 'semaphore', 'custom']),
  SMS_API_URL: z.string().url('Must be a valid URL').or(z.literal('')),
  SMS_API_KEY: z.string().optional(),
  SMS_PHONE_NUMBER: z.string().optional(),
  SMS_DEVICE_ID: z.string().optional(),
  SMS_USERNAME: z.string().optional(),
  SMS_PASSWORD: z.string().optional(),
  SMS_CUSTOM_AUTH_TYPE: z.string().optional(),
  SMS_CUSTOM_AUTH_HEADER: z.string().optional(),
  SMS_CUSTOM_PAYLOAD: z.string().optional(),
  SMS_BATCH_SENDING_ENABLED: z.boolean(),
  SMS_BATCH_SIZE_LIMIT: z.number().min(1, 'Must be at least 1').optional(),
  SMS_BATCH_DELAY: z.number().min(0, 'Cannot be negative').optional(),
  SMS_REQUIRE_CONFIRMATION: z.boolean(),
  SMS_AUTO_MARK_SENT: z.boolean(),
  SMS_MESSAGE_TEMPLATE: z.string().min(1, 'Template cannot be empty'),
  SMS_LAST_TEST_DATE: z.string().optional(),
  SMS_LAST_TEST_STATUS: z.string().optional(),
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Test SMS Modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
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
      SMS_BATCH_SENDING_ENABLED: false,
      SMS_BATCH_SIZE_LIMIT: 500,
      SMS_BATCH_DELAY: 1,
      SMS_REQUIRE_CONFIRMATION: false,
      SMS_AUTO_MARK_SENT: false,
      SMS_MESSAGE_TEMPLATE: 'Dear {name}, your water bill for {month} is P {amount}. Due date: {due_date}. Please pay at the nearest collection center. — TEBANS',
      SMS_LAST_TEST_DATE: '',
      SMS_LAST_TEST_STATUS: '',
    }
  })

  const selectedProvider = watch('SMS_PROVIDER')
  const batchSendingEnabled = watch('SMS_BATCH_SENDING_ENABLED')
  const lastTestDate = watch('SMS_LAST_TEST_DATE')
  const lastTestStatus = watch('SMS_LAST_TEST_STATUS')

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/sms-settings')
      const data = response.data as any

      reset({
        ...data,
        SMS_BATCH_SENDING_ENABLED: data.SMS_BATCH_SENDING_ENABLED === '1',
        SMS_BATCH_SIZE_LIMIT: data.SMS_BATCH_SIZE_LIMIT ? parseInt(data.SMS_BATCH_SIZE_LIMIT, 10) : 500,
        SMS_BATCH_DELAY: data.SMS_BATCH_DELAY ? parseInt(data.SMS_BATCH_DELAY, 10) : 1,
        SMS_REQUIRE_CONFIRMATION: data.SMS_REQUIRE_CONFIRMATION === '1',
        SMS_AUTO_MARK_SENT: data.SMS_AUTO_MARK_SENT === '1',
        SMS_MESSAGE_TEMPLATE: data.SMS_MESSAGE_TEMPLATE || 'Dear {name}, your water bill for {month} is P {amount}. Due date: {due_date}. Please pay at the nearest collection center. — TEBANS',
      })
    } catch (err: any) {
      setErrorMsg('Failed to load SMS settings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [reset])

  const openTestModal = async () => {
    try {
      const profileRes = await api.get('/admin/profile')
      if (profileRes.data?.contactNo) {
        setTestPhoneNumber(profileRes.data.contactNo)
      }
    } catch (e) {
      // ignore
    }
    setTestResult(null)
    setIsTestModalOpen(true)
  }

  const sendTestSms = async () => {
    if (!testPhoneNumber) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await api.post('/admin/sms-test', { to: testPhoneNumber })
      setTestResult({ success: true, message: res.data?.message || 'Test SMS sent successfully' })
      setValue('SMS_LAST_TEST_DATE', res.data.lastTestDate)
      setValue('SMS_LAST_TEST_STATUS', res.data.lastTestStatus)
    } catch (err: any) {
      const responseData = err.response?.data
      setTestResult({ success: false, message: responseData?.message || 'Failed to send test SMS' })
      if (responseData?.lastTestDate) {
        setValue('SMS_LAST_TEST_DATE', responseData.lastTestDate)
        setValue('SMS_LAST_TEST_STATUS', responseData.lastTestStatus)
      }
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: SmsSettingsFormData) => {
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    try {
      const payload = {
        ...data,
        SMS_BATCH_SENDING_ENABLED: data.SMS_BATCH_SENDING_ENABLED ? '1' : '0',
        SMS_BATCH_SIZE_LIMIT: data.SMS_BATCH_SIZE_LIMIT?.toString() || '500',
        SMS_BATCH_DELAY: data.SMS_BATCH_DELAY?.toString() || '1',
        SMS_REQUIRE_CONFIRMATION: data.SMS_REQUIRE_CONFIRMATION ? '1' : '0',
        SMS_AUTO_MARK_SENT: data.SMS_AUTO_MARK_SENT ? '1' : '0',
      }
      // Remove display-only fields from payload if necessary, but backend ignores extras

      await api.put('/admin/sms-settings', payload)
      setSuccessMsg('SMS settings updated successfully')
      timeoutRef.current = setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update SMS settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-gray-500 text-sm py-4 animate-pulse">Loading settings...</div>
  }

  const formatDate = (isoString?: string) => {
     if (!isoString) return ''
     try {
       const date = new Date(isoString)
       return new Intl.DateTimeFormat('en-US', {
         month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
       }).format(date)
     } catch (e) {
       return isoString
     }
  }

  return (
    <div className="bg-transparent -m-6 sm:-m-0 sm:bg-white">
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-start gap-3 text-sm border border-green-200 shadow-sm mx-6 sm:mx-0">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm border border-red-200 shadow-sm mx-6 sm:mx-0">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Provider Details Section */}
        <div className="bg-[#2D2D2D] rounded-xl border border-[#3E3E3E] overflow-hidden text-gray-200">
          <div className="p-6 border-b border-[#3E3E3E] flex items-start gap-4">
            <div className="p-2.5 bg-[#3E3E3E] rounded-lg shrink-0">
              <MessageSquare size={20} className="text-gray-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-white">Provider details</h2>
                <span className="px-3 py-1 bg-green-900/40 text-green-400 text-xs font-medium rounded-full border border-green-800">Connected</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">API credentials for your SMS gateway</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">SMS provider</label>
                <select
                  {...register('SMS_PROVIDER')}
                  className={clsx(
                    "w-full px-4 py-2.5 bg-[#3E3E3E] border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none",
                    errors.SMS_PROVIDER ? "border-red-500" : "border-transparent"
                  )}
                >
                  <option value="">-- Select Provider --</option>
                  <option value="httpsms">HttpSms</option>
                  <option value="textbee">Textbee</option>
                  <option value="android-sms-gateway">Android SMS Gateway</option>
                  <option value="semaphore">Semaphore</option>
                  <option value="custom">Custom</option>
                </select>
                {errors.SMS_PROVIDER && <p className="mt-1 text-sm text-red-400">{errors.SMS_PROVIDER.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Sender phone number</label>
                <input
                  {...register('SMS_PHONE_NUMBER')}
                  type="text"
                  placeholder="+639123456789"
                  className={clsx(
                    "w-full px-4 py-2.5 bg-[#3E3E3E] border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none placeholder-gray-500",
                    errors.SMS_PHONE_NUMBER ? "border-red-500" : "border-transparent"
                  )}
                />
                {errors.SMS_PHONE_NUMBER && <p className="mt-1 text-sm text-red-400">{errors.SMS_PHONE_NUMBER.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">API URL</label>
                <input
                  {...register('SMS_API_URL')}
                  type="text"
                  placeholder="https://api.httpsms.com/v1/messages/send"
                  className={clsx(
                    "w-full px-4 py-2.5 bg-[#3E3E3E] border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none placeholder-gray-500",
                    errors.SMS_API_URL ? "border-red-500" : "border-transparent"
                  )}
                />
                {errors.SMS_API_URL && <p className="mt-1 text-sm text-red-400">{errors.SMS_API_URL.message}</p>}
              </div>

              {['httpsms', 'textbee', 'android-sms-gateway', 'semaphore', 'custom'].includes(selectedProvider) && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">API key</label>
                  <input
                    {...register('SMS_API_KEY')}
                    type="password"
                    className={clsx(
                      "w-full px-4 py-2.5 bg-[#3E3E3E] border rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none",
                      errors.SMS_API_KEY ? "border-red-500" : "border-transparent"
                    )}
                  />
                  {errors.SMS_API_KEY && <p className="mt-1 text-sm text-red-400">{errors.SMS_API_KEY.message}</p>}
                </div>
              )}
            </div>

             {/* Extended config fields (hidden if not needed) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['textbee', 'custom'].includes(selectedProvider) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Device ID</label>
                    <input
                      {...register('SMS_DEVICE_ID')}
                      type="text"
                      className="w-full px-4 py-2.5 bg-[#3E3E3E] border border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none"
                    />
                  </div>
                )}
                {['android-sms-gateway', 'semaphore', 'custom'].includes(selectedProvider) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Username {selectedProvider === 'semaphore' && '(Sender Name)'}</label>
                    <input
                      {...register('SMS_USERNAME')}
                      type="text"
                      className="w-full px-4 py-2.5 bg-[#3E3E3E] border border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none"
                    />
                  </div>
                )}
                {['android-sms-gateway', 'custom'].includes(selectedProvider) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Password</label>
                    <input
                      {...register('SMS_PASSWORD')}
                      type="password"
                      className="w-full px-4 py-2.5 bg-[#3E3E3E] border border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none"
                    />
                  </div>
                )}
             </div>

              {selectedProvider === 'custom' && (
                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-[#3E3E3E]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Custom Auth Type</label>
                      <input
                        {...register('SMS_CUSTOM_AUTH_TYPE')}
                        type="text"
                        placeholder="e.g. Bearer, Basic"
                        className="w-full px-4 py-2.5 bg-[#3E3E3E] border border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Custom Auth Header</label>
                      <input
                        {...register('SMS_CUSTOM_AUTH_HEADER')}
                        type="text"
                        placeholder="e.g. Authorization, x-api-key"
                        className="w-full px-4 py-2.5 bg-[#3E3E3E] border border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Custom Payload (JSON)</label>
                    <textarea
                      {...register('SMS_CUSTOM_PAYLOAD')}
                      placeholder='{"to": "{{to}}", "message": "{{content}}"}'
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#3E3E3E] border border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              )}
          </div>

          {lastTestDate && (
            <div className="px-6 py-4 bg-[#232323] border-t border-[#3E3E3E] flex items-center gap-2 text-sm">
              <div className={clsx("w-2 h-2 rounded-full", lastTestStatus === 'connection successful' ? "bg-green-500" : "bg-red-500")}></div>
              <span className={lastTestStatus === 'connection successful' ? "text-green-500/80" : "text-red-500/80"}>
                Last tested: {formatDate(lastTestDate)} — {lastTestStatus}
              </span>
            </div>
          )}
        </div>

        {/* Batch SMS Sending Section */}
        <div className="bg-[#2D2D2D] rounded-xl border border-[#3E3E3E] overflow-hidden text-gray-200">
          <div className="p-6 border-b border-[#3E3E3E] flex items-start gap-4">
            <div className="p-2.5 bg-[#3E3E3E] rounded-lg shrink-0">
              <ListFilter size={20} className="text-gray-300" />
            </div>
            <div>
              <h2 className="text-base font-medium text-white">Batch SMS sending</h2>
              <p className="text-sm text-gray-400 mt-1">Configure how SMS are dispatched to the provider</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-white">Enable batch sending</p>
                 <p className="text-sm text-gray-400">Group selected recipients into one API call — faster and more efficient</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('SMS_BATCH_SENDING_ENABLED')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
               </label>
            </div>

            {batchSendingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#3E3E3E]">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Batch size limit</label>
                  <div className="flex items-center">
                    <input
                      {...register('SMS_BATCH_SIZE_LIMIT', { valueAsNumber: true })}
                      type="number"
                      min={1}
                      onKeyDown={(e) => { if(['e', 'E', '+', '-'].includes(e.key)) e.preventDefault() }}
                      className={clsx(
                        "w-full px-4 py-2.5 bg-[#3E3E3E] border rounded-lg rounded-r-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none",
                        errors.SMS_BATCH_SIZE_LIMIT ? "border-red-500" : "border-transparent"
                      )}
                    />
                    <span className="px-4 py-2.5 bg-[#232323] border border-transparent border-l-0 rounded-r-lg text-gray-400 min-h-[44px] flex items-center">recipients</span>
                  </div>
                  {errors.SMS_BATCH_SIZE_LIMIT && <p className="mt-1 text-sm text-red-400">{errors.SMS_BATCH_SIZE_LIMIT.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Send delay between batches</label>
                  <div className="flex items-center">
                    <input
                      {...register('SMS_BATCH_DELAY', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      onKeyDown={(e) => { if(['e', 'E', '+', '-'].includes(e.key)) e.preventDefault() }}
                      className={clsx(
                        "w-full px-4 py-2.5 bg-[#3E3E3E] border rounded-lg rounded-r-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-white outline-none",
                        errors.SMS_BATCH_DELAY ? "border-red-500" : "border-transparent"
                      )}
                    />
                    <span className="px-4 py-2.5 bg-[#232323] border border-transparent border-l-0 rounded-r-lg text-gray-400 min-h-[44px] flex items-center">seconds</span>
                  </div>
                  {errors.SMS_BATCH_DELAY && <p className="mt-1 text-sm text-red-400">{errors.SMS_BATCH_DELAY.message}</p>}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-[#3E3E3E] flex items-center justify-between">
               <div>
                 <p className="font-medium text-white">Require confirmation before sending</p>
                 <p className="text-sm text-gray-400">Show a review modal when meter reader taps "Send SMS"</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('SMS_REQUIRE_CONFIRMATION')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
               </label>
            </div>

            <div className="pt-6 border-t border-[#3E3E3E] flex items-center justify-between">
               <div>
                 <p className="font-medium text-white">Auto-mark as sent on success</p>
                 <p className="text-sm text-gray-400">Update bill SMS status automatically after a successful API response</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('SMS_AUTO_MARK_SENT')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
               </label>
            </div>

          </div>
        </div>

        {/* Message Template Section */}
        <div className="bg-[#2D2D2D] rounded-xl border border-[#3E3E3E] overflow-hidden text-gray-200">
          <div className="p-6 border-b border-[#3E3E3E] flex items-start gap-4">
            <div className="p-2.5 bg-[#3E3E3E] rounded-lg shrink-0">
              <PenLine size={20} className="text-gray-300" />
            </div>
            <div>
              <h2 className="text-base font-medium text-white">Message template</h2>
              <p className="text-sm text-gray-400 mt-1">SMS text sent to consumers — use placeholders below</p>
            </div>
          </div>

          <div className="p-6">
            <textarea
              {...register('SMS_MESSAGE_TEMPLATE')}
              rows={4}
              className={clsx(
                "w-full p-4 bg-[#3E3E3E] border rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[100px] text-white outline-none resize-y text-lg",
                errors.SMS_MESSAGE_TEMPLATE ? "border-red-500" : "border-transparent"
              )}
            />
            {errors.SMS_MESSAGE_TEMPLATE && <p className="mt-1 text-sm text-red-400">{errors.SMS_MESSAGE_TEMPLATE.message}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {['{name}', '{amount}', '{month}', '{due_date}', '{account_no}'].map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-[#232323] border border-[#4A4A4A] rounded-md text-sm text-gray-400 font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-10">
          <button
            type="button"
            onClick={openTestModal}
            className="w-full sm:w-auto px-6 py-2.5 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] font-medium"
          >
            Send test SMS
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 min-h-[44px] font-medium"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>

      {/* Test SMS Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Send Test SMS</h3>
              <button
                onClick={() => !isTesting && setIsTestModalOpen(false)}
                disabled={isTesting}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Enter a destination phone number to verify your SMS provider configuration.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Number</label>
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={e => setTestPhoneNumber(e.target.value)}
                  placeholder="+639123456789"
                  disabled={isTesting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none min-h-[44px] disabled:opacity-60"
                />
              </div>

              {testResult && (
                <div className={clsx(
                  "p-3 rounded-lg flex items-start gap-2 text-sm border",
                  testResult.success ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {testResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                  <span className="break-words flex-1">{testResult.message}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsTestModalOpen(false)}
                disabled={isTesting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={sendTestSms}
                disabled={isTesting || !testPhoneNumber}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
              >
                {isTesting ? (
                  <>Sending...</>
                ) : (
                  <><Send size={16} /> Send Test</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
