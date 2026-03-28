'use client'

import Input from '@/components/ui/Input'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-end gap-3">
      <Input
        label="From"
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <Input
        label="To"
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        min={startDate}
      />
    </div>
  )
}