import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function DueDateBadge() {
  const { data: cycle, isLoading } = useQuery({
    queryKey: ['billing-cycle'],
    queryFn: async () => {
      const res = await api.get('/settings/billing-cycle')
      return res.data
    }
  })

  if (isLoading) {
    return (
      <div className="bg-muted text-foreground text-sm font-medium px-4 py-1.5 rounded-full inline-block animate-pulse w-32 h-7" />
    )
  }

  if (!cycle) return null

  const now = new Date()
  const manilaString = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  const manilaDate = new Date(manilaString)

  const year = manilaDate.getFullYear()
  const month = manilaDate.getMonth()
  const currentDay = manilaDate.getDate()

  const targetEndDay = cycle.endDay

  const dueDate = new Date(year, month, targetEndDay)
  const monthName = dueDate.toLocaleString('default', { month: 'long' })
  const baseText = `Due: ${monthName} ${targetEndDay}`

  let dueDateText = ''
  let urgencyClass = ''

  if (currentDay < targetEndDay) {
    dueDateText = `${baseText} · ${targetEndDay - currentDay} days left`
    urgencyClass = 'bg-muted text-foreground'
  } else if (currentDay === targetEndDay) {
    dueDateText = `${baseText} · Due today`
    urgencyClass = 'bg-muted text-primary-600 dark:text-primary-400'
  } else {
    dueDateText = `${baseText} · ${currentDay - targetEndDay} days overdue`
    urgencyClass = 'bg-muted text-red-700 dark:text-red-400'
  }

  return (
    <div className={`${urgencyClass} text-sm font-medium px-4 py-1.5 rounded-full inline-block transition-colors`}>
      {dueDateText}
    </div>
  )
}