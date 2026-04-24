import { useEffect, useState } from 'react'

export default function DueDateBadge() {
  const [dueDateText, setDueDateText] = useState('')

  useEffect(() => {
    const now = new Date()
    // Convert to Manila timezone explicitly for calculation
    const manilaString = now.toLocaleString("en-US", {timeZone: "Asia/Manila"})
    const manilaDate = new Date(manilaString)

    const year = manilaDate.getFullYear()
    const month = manilaDate.getMonth()
    const currentDay = manilaDate.getDate()

    const dueDate = new Date(year, month, 27)
    const monthName = dueDate.toLocaleString('default', { month: 'long' })
    const baseText = `Due: ${monthName} 27`

    if (currentDay < 27) {
      setDueDateText(`${baseText} · ${27 - currentDay} days left`)
    } else if (currentDay === 27) {
      setDueDateText(`${baseText} · Due today`)
    } else {
      setDueDateText(`${baseText} · ${currentDay - 27} days overdue`)
    }
  }, [])

  if (!dueDateText) return null

  return (
    <div className="bg-[#f2efe6] text-gray-800 text-sm font-medium px-4 py-1.5 rounded-full inline-block">
      {dueDateText}
    </div>
  )
}
