import DashboardLayout from '@/components/layout/DashboardLayout'

export default function MeterReaderLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="meter_reader">{children}</DashboardLayout>
}