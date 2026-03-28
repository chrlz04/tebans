import clsx from 'clsx'

type BadgeVariant =
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Paid'
  | 'Unpaid'
  | 'Partial'
  | 'Overdue'
  | 'Executed'
  | 'Cancelled'

interface BadgeProps {
  status: BadgeVariant
  className?: string
}

const badgeStyles: Record<BadgeVariant, string> = {
  Active:    'bg-green-100 text-green-800',
  Inactive:  'bg-gray-100 text-gray-700',
  Pending:   'bg-yellow-100 text-yellow-800',
  Paid:      'bg-green-100 text-green-800',
  Unpaid:    'bg-red-100 text-red-800',
  Partial:   'bg-orange-100 text-orange-800',
  Overdue:   'bg-red-100 text-red-800',
  Executed:  'bg-blue-100 text-blue-800',
  Cancelled: 'bg-gray-100 text-gray-700',
}

export default function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        badgeStyles[status],
        className
      )}
    >
      {status}
    </span>
  )
}