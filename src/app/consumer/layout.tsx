import DashboardLayout from '@/components/layout/DashboardLayout'

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="consumer">{children}</DashboardLayout>
}