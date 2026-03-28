import { useAuth } from './auth-context'

type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

// Use this inside any page/component to check
// if the current user has the required role
export function useRoleGuard(requiredRole: Role) {
  const { user, isLoading } = useAuth()

  const hasAccess = !isLoading && user?.role === requiredRole

  return { hasAccess, isLoading, user }
}