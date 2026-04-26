import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const iconBgStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-blue-100 text-blue-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger:  'bg-orange-100 text-orange-600',
}

export default function StatCard({
  label,
  value,
  icon,
  subtitle,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
      {icon && (
        <div className={clsx('p-3 rounded-xl shrink-0', iconBgStyles[variant])}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}