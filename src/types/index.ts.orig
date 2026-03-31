// ─── Auth ───────────────────────────────────────────────
export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  role: 'admin' | 'consumer' | 'meter_reader' | 'cashier'
  userId: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── User ────────────────────────────────────────────────
export type UserRole = 'admin' | 'meter_reader' | 'cashier'
export type AccountStatus = 'Active' | 'Inactive' | 'Pending'

export interface User {
  userId: string
  firstName: string
  lastName: string
  contactNo: string
  userType: UserRole
  accountStatus: AccountStatus
  registrationDate: string
}

// ─── Consumer ────────────────────────────────────────────
export interface Consumer {
  consumerId: string
  firstName: string
  lastName: string
  address: string
  meterSerialNo: string
  areaName: string
  contactNo: string
  accountStatus: AccountStatus
}

// ─── Meter Reading ───────────────────────────────────────
export interface MeterReading {
  meterReadingId: string
  consumerId: string
  meterReaderId: string
  previousReading: number
  currentReading: number
  consumptionKwh: number
  dateRecorded: string
  amountWithTaxEvat: number
  vatPassThroughTaxes: number
  totalKwh: number
  proRatedKwhLoss: number
  billingMonth: string
}

// ─── Bill ────────────────────────────────────────────────
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial'

export interface Bill {
  billId: string
  consumerId: string
  meterReadingId: string
  dueDate: string
  paymentStatus: PaymentStatus
  amount: number
  billingMonth: string
}

// ─── Payment ─────────────────────────────────────────────
export type PaymentMethod = 'Cash'

export interface Payment {
  paymentId: string
  billId: string
  cashierId: string
  consumerId: string
  amountPaid: number
  datePaid: string
  paymentMethod: PaymentMethod
  receiptNumber: string
}

// ─── Disconnection Request ───────────────────────────────
export type DisconnectionStatus = 'Pending' | 'Executed' | 'Cancelled'

export interface DisconnectionRequest {
  disconnectionRequestId: string
  consumerId: string
  meterReaderId: string
  reasonForDisconnection: string
  scheduledDate: string
  requestStatus: DisconnectionStatus
  dateRequested: string
}

// ─── Notification ────────────────────────────────────────
export type AlertType = 'Billing' | 'Disconnection'
export type ReferenceType = 'MeterReading' | 'DisconnectionRequest'

export interface Notification {
  notificationId: string
  consumerId: string
  meterReadingId?: string
  disconnectionRequestId?: string
  alertType: AlertType
  messageContent: string
  dateSent: string
  referenceType: ReferenceType
}

// ─── Dashboard ───────────────────────────────────────────
export interface AdminDashboardStats {
  totalActiveConsumers: number
  pendingDisconnections: number
  recentRegistrations: User[]
}

export interface CashierDashboardStats {
  totalCollectionsToday: number
  transactionsProcessed: number
  pendingCashRemittance: number
  pendingConsumersToPay: number
  recentTransactions: Payment[]
}

// ─── Shared ──────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface DateRangeFilter {
  startDate: string
  endDate: string
}