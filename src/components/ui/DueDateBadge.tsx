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
          <div className="bg-[#f2efe6] text-foreground text-sm font-medium px-4 py-1.5 rounded-full inline-block animate-pulse w-32 h-7" />
      )
  }

  if (!cycle) return null

  const now = new Date()
  // Convert to Manila timezone explicitly for calculation
  const manilaString = now.toLocaleString("en-US", {timeZone: "Asia/Manila"})
  const manilaDate = new Date(manilaString)

  const year = manilaDate.getFullYear()
  const month = manilaDate.getMonth()
  const currentDay = manilaDate.getDate()

  const targetEndDay = cycle.endDay

  const dueDate = new Date(year, month, targetEndDay)
  const monthName = dueDate.toLocaleString('default', { month: 'long' })
  const baseText = `Due: ${monthName} ${targetEndDay}`

  let dueDateText = ''
  if (currentDay < targetEndDay) {
    dueDateText = `${baseText} · ${targetEndDay - currentDay} days left`
  } else if (currentDay === targetEndDay) {
    dueDateText = `${baseText} · Due today`
  } else {
    dueDateText = `${baseText} · ${currentDay - targetEndDay} days overdue`
  }

  return (
    <div className="bg-[#f2efe6] text-foreground text-sm font-medium px-4 py-1.5 rounded-full inline-block">
      {dueDateText}
    </div>
  )
}
