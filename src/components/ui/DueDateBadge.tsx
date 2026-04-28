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

  const { startDay, endDay } = cycle
  const isCrossMonth = startDay > endDay

  // For cross-month cycles (e.g. 28→27): if today is on or after startDay,
  // the current cycle just started and its end falls in the next calendar month.
  const dueDate =
    isCrossMonth && currentDay >= startDay
      ? new Date(year, month + 1, endDay)
      : new Date(year, month, endDay)

  const monthName = dueDate.toLocaleString('default', { month: 'long' })
  const baseText = `Due: ${monthName} ${endDay}`

  const todayDate = new Date(year, month, currentDay)
  const diffDays = Math.round(
    (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  let dueDateText = ''
  let urgencyClass = ''

  if (diffDays > 0) {
    dueDateText = `${baseText} · ${diffDays} days left`
    urgencyClass = 'bg-muted text-foreground'
  } else if (diffDays === 0) {
    dueDateText = `${baseText} · Due today`
    urgencyClass = 'bg-muted text-primary-600 dark:text-primary-400'
  } else {
    dueDateText = `${baseText} · ${Math.abs(diffDays)} days overdue`
    urgencyClass = 'bg-muted text-red-700 dark:text-red-400'
  }

  return (
    <div className={`${urgencyClass} text-sm font-medium px-4 py-1.5 rounded-full inline-block transition-colors`}>
      {dueDateText}
    </div>
  )
}