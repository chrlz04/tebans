'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Upload, AlertCircle, FileSpreadsheet, Download, Table, X } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'

import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/shared/DataTable'

interface ParsedReading {
  consumerId: string
  currentReading: number
  amountWithTaxEvat: number
  readingDate: string
  dueDate: string
}

export default function BatchRecordMeterReadingPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')

  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedReading[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ row: number, errors: string[] }[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [smsQueuedCount, setSmsQueuedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: async (readings: ParsedReading[]) => {
      const res = await api.post('/meter-reader/readings/bulk', { readings })
      return res.data
    },
    onSuccess: (data) => {
      setSuccessCount(data.successCount || parsedData.length)
      setSmsQueuedCount(data.smsQueued || 0)
      setIsCompleted(true)
      setFile(null)
      setParsedData([])
      setValidationErrors([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (error: any) => {
      if (error.response?.data?.validationErrors) {
        setValidationErrors(error.response.data.validationErrors)
      } else {
        setParseError(error.response?.data?.message || 'Failed to upload readings. Please try again.')
      }
    }
  })

  const downloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Template')

    ws.columns = [
      { header: 'Account Number', key: 'accountNo', width: 18 },
      { header: 'Current Reading', key: 'currentReading', width: 15 },
      { header: 'Amount Due', key: 'amountDue', width: 12 },
      { header: 'Reading Date', key: 'readingDate', width: 14 },
      { header: 'Due Date', key: 'dueDate', width: 14 }
    ]

    ws.addRow({ accountNo: 'consumer-001', currentReading: 125.5, amountDue: 1500.00, readingDate: '2024-05-20', dueDate: '2024-06-05' })
    ws.addRow({ accountNo: 'consumer-002', currentReading: 45.2, amountDue: 800.50, readingDate: '2024-05-20', dueDate: '2024-06-05' })

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch-reading-template.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseError(null)
    setValidationErrors([])
    setParsedData([])
    setIsCompleted(false)

    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()

    if (fileExt === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedRows(results.data)
        },
        error: (error) => {
          setParseError(`Failed to parse CSV: ${error.message}`)
        }
      })
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer
          const ExcelJS = (await import('exceljs')).default
          const wb = new ExcelJS.Workbook()
          await wb.xlsx.load(arrayBuffer)
          const ws = wb.worksheets[0]

          if (!ws) {
            throw new Error('No worksheets found')
          }

          const data: any[] = []
          const headers: string[] = []

          ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              row.eachCell((cell, colNumber) => {
                headers[colNumber] = cell.text || String(cell.value || '')
              })
            } else {
              const rowData: any = {}
              headers.forEach((header, colNumber) => {
                if (!header) return
                let val = row.getCell(colNumber).value
                if (val && typeof val === 'object' && 'result' in val) {
                  val = (val as any).result
                }
                if (val instanceof Date) {
                  const offset = val.getTimezoneOffset() * 60000
                  const localDate = new Date(val.getTime() - offset)
                  val = localDate.toISOString().split('T')[0]
                }
                rowData[header] = val !== null && val !== undefined ? val : ''
              })
              data.push(rowData)
            }
          })

          processParsedRows(data)
        } catch (error: any) {
          setParseError(`Failed to parse Excel file: ${error.message}`)
        }
      }
      reader.readAsArrayBuffer(selectedFile)
    } else {
      setParseError('Unsupported file type. Please upload a .csv or .xlsx file.')
    }
  }

  const processParsedRows = (rows: any[]) => {
    const formattedData: ParsedReading[] = []
    let hasError = false
    const rowErrors: { row: number, errors: string[] }[] = []

    rows.forEach((row, index) => {
      const accountNo = row['Account Number'] || row['consumerId'] || row['Account_Number'] || ''
      const currentReading = parseFloat(row['Current Reading'] || row['currentReading'] || 0)
      const amountDue = parseFloat(row['Amount Due'] || row['amountWithTaxEvat'] || row['Amount_Due'] || 0)

      let readingDate = row['Reading Date'] || row['readingDate'] || row['Reading_Date'] || ''
      let dueDate = row['Due Date'] || row['dueDate'] || row['Due_Date'] || ''

      // Handle Excel date numbers if present
      if (typeof readingDate === 'number') {
        const date = new Date((readingDate - (25567 + 2)) * 86400 * 1000)
        readingDate = date.toISOString().split('T')[0]
      }
      if (typeof dueDate === 'number') {
        const date = new Date((dueDate - (25567 + 2)) * 86400 * 1000)
        dueDate = date.toISOString().split('T')[0]
      }

      const errors: string[] = []
      if (!accountNo) errors.push('Missing Account Number')
      if (isNaN(currentReading) || currentReading < 0) errors.push('Invalid Current Reading')
      if (isNaN(amountDue) || amountDue < 0) errors.push('Invalid Amount Due')
      if (!readingDate) errors.push('Missing Reading Date')
      if (!dueDate) errors.push('Missing Due Date')

      if (errors.length > 0) {
        hasError = true
        rowErrors.push({ row: index + 1, errors })
      } else {
        formattedData.push({
          consumerId: String(accountNo).trim(),
          currentReading,
          amountWithTaxEvat: amountDue,
          readingDate: String(readingDate).trim(),
          dueDate: String(dueDate).trim()
        })
      }
    })

    if (hasError) {
      setValidationErrors(rowErrors)
      setParseError('File contains formatting errors. Please fix them and re-upload.')
    } else if (formattedData.length === 0) {
      setParseError('The file is empty or missing required columns.')
    } else {
      setParsedData(formattedData)
    }
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSubmit = () => {
    if (parsedData.length > 0) {
      mutation.mutate(parsedData)
    }
  }

  const clearFile = () => {
    setFile(null)
    setParsedData([])
    setParseError(null)
    setValidationErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (authLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading batch processing...</div>
  }

  if (!hasAccess) return null

  // ── Completion screen ────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="max-w-lg mx-auto mt-12 flex flex-col items-center gap-6 text-center">
        <div className="bg-green-50 p-5 rounded-full">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Batch Processing Complete</h2>
          <p className="text-sm text-gray-600 mt-2">
            Successfully generated <b>{successCount}</b> bills.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {smsQueuedCount} SMS notifications have been queued and are sending in the background.
          </p>
        </div>
        <div className="flex gap-4 mt-2">
          <Button variant="secondary" onClick={() => setIsCompleted(false)}>
            Upload Another File
          </Button>
          <Button variant="primary" onClick={() => window.location.href = '/meter-reader/consumers'}>
            Back to Consumers
          </Button>
        </div>
      </div>
    )
  }

  const previewColumns: Column<ParsedReading>[] = [
    {
      key: 'consumerId',
      label: 'Account No.',
      render: (row) => <span className="font-mono text-xs">{row.consumerId}</span>,
    },
    {
      key: 'currentReading',
      label: 'Reading',
      render: (row) => row.currentReading.toFixed(2),
    },
    {
      key: 'amountWithTaxEvat',
      label: 'Amount Due',
      render: (row) => `₱${row.amountWithTaxEvat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'readingDate',
      label: 'Reading Date',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/meter-reader/consumers"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Meter Reading</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload an Excel or CSV file to process multiple readings at once.
            </p>
          </div>
        </div>
        <div>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download size={16} className="mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      {/* Main Upload Area */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Upload State */}
        {!file && (
          <div
            className="p-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 m-6 rounded-xl hover:border-primary-400 transition-colors cursor-pointer bg-gray-50"
            onClick={handleUploadClick}
          >
            <div className="bg-white p-4 rounded-full shadow-sm border border-gray-200 mb-4">
              <FileSpreadsheet size={32} className="text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Data File</h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              Select an .xlsx or .csv file containing your meter readings. Make sure to use the exact template format.
            </p>
            <Button variant="primary" type="button" onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}>
              <Upload size={16} className="mr-2" />
              Select File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />
          </div>
        )}

        {/* Selected File State */}
        {file && (
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FileSpreadsheet size={24} className="text-primary-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{file.name}</h3>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB • {parsedData.length} valid rows found
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Remove file"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Error Messages */}
        {parseError && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">{parseError}</h4>
              <p className="text-xs text-red-600 mt-1">Please fix the file and try again. No data was saved.</p>
            </div>
          </div>
        )}

        {/* Validation Errors List */}
        {validationErrors.length > 0 && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Validation Failed</h4>
                <p className="text-xs text-red-600 mt-1">
                  Found errors in {validationErrors.length} row{validationErrors.length !== 1 ? 's' : ''}. The entire file has been rejected.
                </p>
              </div>
            </div>
            <div className="bg-white border border-red-100 rounded-md max-h-60 overflow-y-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 w-20">Row</th>
                    <th className="px-4 py-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {validationErrors.map((err, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-600">#{err.row}</td>
                      <td className="px-4 py-2 text-red-600">
                        <ul className="list-disc pl-4 space-y-1">
                          {err.errors.map((msg, j) => (
                            <li key={j}>{msg}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview Data */}
        {parsedData.length > 0 && !parseError && validationErrors.length === 0 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Table size={18} className="text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900">Data Preview</h3>
            </div>

            <DataTable
              columns={previewColumns}
              data={parsedData}
              keyExtractor={(row) => row.consumerId}
              emptyMessage="No data to preview."
            />

            <div className="mt-8 flex justify-end gap-3 border-t pt-6 border-gray-100">
              <Button variant="secondary" onClick={clearFile} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={mutation.isPending}
              >
                Submit {parsedData.length} Readings
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
