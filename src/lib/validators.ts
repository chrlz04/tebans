// ── Check if required fields are present ─────────────────
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    const value = body[field]
    if (value === undefined || value === null || value === '') {
      return `${field} is required`
    }
  }
  return null
}

// ── Validate password strength ────────────────────────────
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one symbol'
  }
  return null
}

// ── Validate payment method ───────────────────────────────
export function validatePaymentMethod(method: string): boolean {
  return ['Cash', 'Check', 'Online'].includes(method)
}

// ── Validate account status ───────────────────────────────
export function validateAccountStatus(status: string): boolean {
  return ['Active', 'Inactive', 'Pending'].includes(status)
}

// ── Validate date format (YYYY-MM-DD) ─────────────────────
export function validateDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

// ── Validate Philippine mobile number ────────────────────
export function validatePhoneNumber(phone: string): boolean {
  const regex = /^(09|\+639)\d{9}$/
  return regex.test(phone)
}

// ── Sanitize string input ─────────────────────────────────
export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '')
}