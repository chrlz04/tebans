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
  const mustChangePassword = req.cookies.get('mustChangePassword')?.value === 'true'

  // If token, role, and mustChangePassword is true, force redirect to /change-password
  // unless they are already on /change-password.
  if (token && role && mustChangePassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', req.url))
  }

  // If mustChangePassword is false/not set but they try to access /change-password,
  // redirect them to their home page.
  if (token && role && !mustChangePassword && pathname === '/change-password') {
    return NextResponse.redirect(new URL(roleHomePages[role] || '/', req.url))
  }

  // Allow public routes
  if (pathname === '/login' || pathname === '/') {
    if (token && role && roleHomePages[role]) {
      return NextResponse.redirect(new URL(roleHomePages[role], req.url))
    }
    return NextResponse.next()
  }

  // No token — redirect to login
  if (!token || !role) {
    // If they were trying to access /change-password without token, send to /login
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // At this point, we know they have token and role, and are not forced to change password (unless they are on /change-password, which is handled).
  // If they are on /change-password, let them pass.
  if (pathname === '/change-password') {
    return NextResponse.next()
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