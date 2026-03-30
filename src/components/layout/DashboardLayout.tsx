import Sidebar from './Sidebar'
import TopBar from './TopBar'

type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

interface DashboardLayoutProps {
  role: Role
  children: React.ReactNode
}

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}