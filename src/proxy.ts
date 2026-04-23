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

  const response = NextResponse.next()

  // Add Cache-Control headers to protected routes to prevent BFCache (back button) access after logout
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.ico$).*)',
  ],
}