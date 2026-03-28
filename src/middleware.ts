import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which routes each role is allowed to access
const rolePermissions: Record<string, string[]> = {
  admin:        ['/admin'],
  consumer:     ['/consumer'],
  meter_reader: ['/meter-reader'],
  cashier:      ['/cashier'],
}

// Define the redirect destination after login per role
const roleHomePages: Record<string, string> = {
  admin: '/admin/dashboard',
  consumer: '/consumer/bills',
  meter_reader: '/meter-reader/consumers',
  cashier: '/cashier/dashboard',
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const role = req.cookies.get('role')?.value
  const { pathname } = req.nextUrl

  // Allow public routes
  if (pathname === '/login' || pathname === '/') {
    // If already logged in, redirect to their dashboard
    if (token && role && roleHomePages[role]) {
      return NextResponse.redirect(new URL(roleHomePages[role], req.url))
    }
    return NextResponse.next()
  }

  // No token — redirect to login
  if (!token || !role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check if the role is allowed to access the current path
  const allowedPaths = rolePermissions[role] || []
  const isAllowed = allowedPaths.some((path) => pathname.startsWith(path))

  if (!isAllowed) {
    // Redirect to their correct dashboard instead of showing 403
    return NextResponse.redirect(new URL(roleHomePages[role], req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}