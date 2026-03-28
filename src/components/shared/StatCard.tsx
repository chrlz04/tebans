import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: 'bg-white border-gray-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger:  'bg-red-50 border-red-200',
}

const valueStyles = {
  default: 'text-gray-900',
  success: 'text-green-700',
  warning: 'text-yellow-700',
  danger:  'text-red-700',
}

export default function StatCard({
  label,
  value,
  icon,
  variant = 'default',
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-5 flex items-center gap-4',
        variantStyles[variant]
      )}
    >
      {icon && (
        <div className="text-gray-400 shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className={clsx('text-2xl font-semibold mt-0.5', valueStyles[variant])}>
          {value}
        </p>
      </div>
    </div>
  )
}