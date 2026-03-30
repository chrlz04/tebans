import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rolePermissions: Record<string, string[]> = {
  admin:        ['/admin'],
  consumer:     ['/consumer'],
  meter_reader: ['/meter-reader'],
  cashier:      ['/cashier'],
}

const roleHomePages: Record<string, string> = {
  admin:        '/admin/dashboard',
  consumer:     '/consumer/bills',
  meter_reader: '/meter-reader/consumers',
  cashier:      '/cashier/dashboard',
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow API routes to handle their own auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value
  const role  = req.cookies.get('role')?.value

  // Allow public routes
  if (pathname === '/login' || pathname === '/') {
    if (token && role && roleHomePages[role]) {
      return NextResponse.redirect(new URL(roleHomePages[role], req.url))
    }
    return NextResponse.next()
  }

  // No token — redirect to login
  if (!token || !role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check role permissions
  const allowedPaths = rolePermissions[role] || []
  const isAllowed = allowedPaths.some((path) => pathname.startsWith(path))

  if (!isAllowed) {
    return NextResponse.redirect(new URL(roleHomePages[role], req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}