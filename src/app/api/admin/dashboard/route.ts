import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'
import type { AdminBillingProgress, MeterReaderProgress, AdminPaymentProgress, CashierProgress } from '@/types'
import { getBillingCycleSettings } from '@/lib/services/settings.service'

interface CountRow extends RowDataPacket {
  count: number
}

interface RecentUser extends RowDataPacket {
  User_ID:           string
  First_Name:        string
  Last_Name:         string
  User_Type:         string
  Account_Status:    string
  Registration_Date: string
}

interface MeterReaderAreaInfo extends RowDataPacket {
  User_ID: string
  First_Name: string
  Last_Name: string
  Assigned_Area_ID: string
  Area_Name: string
}

function formatCyclePeriod(start: Date, end: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const s = `${months[start.getMonth()]} ${start.getDate()}`
  const e = `${months[end.getMonth()]} ${end.getDate()}`
  return start.getFullYear() === end.getFullYear()
    ? `${s} – ${e}, ${end.getFullYear()}`
    : `${s}, ${start.getFullYear()} – ${e}, ${end.getFullYear()}`
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    // Total active consumers
    const activeConsumers = await queryOne<CountRow>(
      `SELECT COUNT(*) as count
       FROM User
       WHERE User_Type = 'consumer' AND Account_Status = 'Active'`
    )

    // Pending disconnections
    const pendingDisconnections = await queryOne<CountRow>(
      `SELECT COUNT(*) as count
       FROM DisconnectionRequest
       WHERE Request_Status = 'Pending'`
    )

    // Recent registrations (last 5)
    const recentRegistrations = await query<RecentUser>(
      `SELECT
        User_ID,
        First_Name,
        Last_Name,
        User_Type,
        Account_Status,
        Registration_Date
       FROM User
       ORDER BY Registration_Date DESC
       LIMIT 5`
    )

    // Calculate Billing Cycle Progress for current month
    const { year, month, day } = getManilaDateParts()
    const { startDay, endDay } = await getBillingCycleSettings()

    // For cross-month cycles (startDay > endDay, e.g. 28→27): if today is on or
    // after startDay the current cycle started this calendar month and ends in the
    // next; otherwise it started last month and ends this month.
    const isCrossMonth = startDay > endDay
    let startDateObj: Date, endDateObj: Date
    if (isCrossMonth) {
      if (day >= startDay) {
        startDateObj = new Date(year, month, startDay)
        endDateObj   = new Date(year, month + 1, endDay)
      } else {
        startDateObj = new Date(year, month - 1, startDay)
        endDateObj   = new Date(year, month, endDay)
      }
    } else {
      startDateObj = new Date(year, month, startDay)
      endDateObj   = new Date(year, month, endDay)
    }

    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`
    const endDate   = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`

    const prevStartDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth() - 1, startDateObj.getDate())
    const prevEndDateObj   = new Date(endDateObj.getFullYear(),   endDateObj.getMonth()   - 1, endDateObj.getDate())
    const prevCycleStartDate = `${prevStartDateObj.getFullYear()}-${String(prevStartDateObj.getMonth() + 1).padStart(2, '0')}-${String(prevStartDateObj.getDate()).padStart(2, '0')}`
    const prevCycleEndDate   = `${prevEndDateObj.getFullYear()}-${String(prevEndDateObj.getMonth() + 1).padStart(2, '0')}-${String(prevEndDateObj.getDate()).padStart(2, '0')}`

    const activeMeterReaders = await query<MeterReaderAreaInfo>(
      `SELECT
        mr.User_ID,
        u.First_Name,
        u.Last_Name,
        mr.Assigned_Area_ID,
        a.Name AS Area_Name
       FROM MeterReader mr
       JOIN User u ON u.User_ID = mr.User_ID
       JOIN Area a ON a.Area_ID = mr.Assigned_Area_ID
       WHERE u.Account_Status = 'Active'`
    )

    const meterReaderBreakdown: MeterReaderProgress[] = []
    let globalTotalConsumers = 0
    let globalBilledConsumers = 0

    for (const mr of activeMeterReaders) {
      const areaTotalRow = await queryOne<CountRow>(
        `SELECT COUNT(c.Consumer_ID) AS count
         FROM Consumer c
         JOIN User u ON u.User_ID = c.User_ID
         WHERE c.Area_ID = ? AND u.Account_Status = 'Active'`,
        [mr.Assigned_Area_ID]
      )

      const areaBilledRow = await queryOne<CountRow>(
        `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
         FROM Bill b
         JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
         JOIN User u ON u.User_ID = c.User_ID
         JOIN MeterReading mrd ON mrd.MeterReading_ID = b.MeterReading_ID
         WHERE c.Area_ID = ?
           AND u.Account_Status = 'Active'
           AND DATE(mrd.Date_Recorded) >= ?
           AND DATE(mrd.Date_Recorded) <= ?`,
        [mr.Assigned_Area_ID, startDate, endDate]
      )

      const totalAreaConsumers = areaTotalRow?.count ?? 0
      const billedAreaConsumers = areaBilledRow?.count ?? 0
      const unbilledAreaConsumers = Math.max(0, totalAreaConsumers - billedAreaConsumers)

      globalTotalConsumers += totalAreaConsumers
      globalBilledConsumers += billedAreaConsumers

      meterReaderBreakdown.push({
        meterReaderId: mr.User_ID,
        firstName: mr.First_Name,
        lastName: mr.Last_Name,
        assignedAreaName: mr.Area_Name,
        totalConsumers: totalAreaConsumers,
        billedConsumers: billedAreaConsumers,
        unbilledConsumers: unbilledAreaConsumers,
      })
    }

    const billingProgress: AdminBillingProgress = {
      totalConsumers: globalTotalConsumers,
      billedConsumers: globalBilledConsumers,
      unbilledConsumers: Math.max(0, globalTotalConsumers - globalBilledConsumers),
      overallCompletion: globalTotalConsumers > 0 ? Math.round((globalBilledConsumers / globalTotalConsumers) * 100) : 0,
      meterReaderBreakdown,
    }

    // Previous billing cycle progress
    const prevMeterReaderBreakdown: MeterReaderProgress[] = []
    let prevGlobalTotal = 0
    let prevGlobalBilled = 0

    for (const mr of activeMeterReaders) {
      const areaTotalRow = await queryOne<CountRow>(
        `SELECT COUNT(c.Consumer_ID) AS count
         FROM Consumer c
         JOIN User u ON u.User_ID = c.User_ID
         WHERE c.Area_ID = ? AND u.Account_Status = 'Active'`,
        [mr.Assigned_Area_ID]
      )

      const areaBilledRow = await queryOne<CountRow>(
        `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
         FROM Bill b
         JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
         JOIN User u ON u.User_ID = c.User_ID
         JOIN MeterReading mrd ON mrd.MeterReading_ID = b.MeterReading_ID
         WHERE c.Area_ID = ?
           AND u.Account_Status = 'Active'
           AND DATE(mrd.Date_Recorded) >= ?
           AND DATE(mrd.Date_Recorded) <= ?`,
        [mr.Assigned_Area_ID, prevCycleStartDate, prevCycleEndDate]
      )

      const total  = areaTotalRow?.count ?? 0
      const billed = areaBilledRow?.count ?? 0

      prevGlobalTotal  += total
      prevGlobalBilled += billed

      prevMeterReaderBreakdown.push({
        meterReaderId:    mr.User_ID,
        firstName:        mr.First_Name,
        lastName:         mr.Last_Name,
        assignedAreaName: mr.Area_Name,
        totalConsumers:   total,
        billedConsumers:  billed,
        unbilledConsumers: Math.max(0, total - billed),
      })
    }

    const previousBillingProgress: AdminBillingProgress = {
      totalConsumers:    prevGlobalTotal,
      billedConsumers:   prevGlobalBilled,
      unbilledConsumers: Math.max(0, prevGlobalTotal - prevGlobalBilled),
      overallCompletion: prevGlobalTotal > 0 ? Math.round((prevGlobalBilled / prevGlobalTotal) * 100) : 0,
      meterReaderBreakdown: prevMeterReaderBreakdown,
    }

    // Calculate Payment Collection Progress for current month
    const activeCashiers = await query<MeterReaderAreaInfo>(
      `SELECT
        c.User_ID,
        u.First_Name,
        u.Last_Name,
        c.Assigned_Area_ID,
        a.Name AS Area_Name
       FROM Cashier c
       JOIN User u ON u.User_ID = c.User_ID
       JOIN Area a ON a.Area_ID = c.Assigned_Area_ID
       WHERE u.Account_Status = 'Active'`
    )

    const cashierBreakdown: CashierProgress[] = []
    let globalPaymentTotalConsumers = 0
    let globalPaidConsumers = 0

    for (const c of activeCashiers) {
      const areaTotalRow = await queryOne<CountRow>(
        `SELECT COUNT(co.Consumer_ID) AS count
         FROM Consumer co
         JOIN User u ON u.User_ID = co.User_ID
         WHERE co.Area_ID = ? AND u.Account_Status = 'Active'`,
        [c.Assigned_Area_ID]
      )

      const areaPaidRow = await queryOne<CountRow>(
        `SELECT COUNT(DISTINCT p.Consumer_ID) AS count
         FROM Payment p
         JOIN Bill b ON p.Bill_ID = b.Bill_ID
         JOIN MeterReading mrd ON mrd.MeterReading_ID = b.MeterReading_ID
         JOIN Consumer co ON co.Consumer_ID = p.Consumer_ID
         JOIN User u ON u.User_ID = co.User_ID
         WHERE co.Area_ID = ?
           AND u.Account_Status = 'Active'
           AND DATE(p.Date_Paid) >= ?
           AND DATE(p.Date_Paid) <= ?
           AND DATE(mrd.Date_Recorded) >= ?
           AND DATE(mrd.Date_Recorded) <= ?`,
        [c.Assigned_Area_ID, startDate, endDate, startDate, endDate]
      )

      const totalAreaConsumers = areaTotalRow?.count ?? 0
      const paidAreaConsumers = areaPaidRow?.count ?? 0
      const notYetPaidConsumers = Math.max(0, totalAreaConsumers - paidAreaConsumers)

      globalPaymentTotalConsumers += totalAreaConsumers
      globalPaidConsumers += paidAreaConsumers

      cashierBreakdown.push({
        cashierId: c.User_ID,
        firstName: c.First_Name,
        lastName: c.Last_Name,
        assignedAreaName: c.Area_Name,
        totalConsumers: totalAreaConsumers,
        paidConsumers: paidAreaConsumers,
        notYetPaidConsumers: notYetPaidConsumers,
      })
    }

    const paymentProgress: AdminPaymentProgress = {
      totalConsumers: globalPaymentTotalConsumers,
      paidConsumers: globalPaidConsumers,
      notYetPaidConsumers: Math.max(0, globalPaymentTotalConsumers - globalPaidConsumers),
      overallCompletion: globalPaymentTotalConsumers > 0 ? Math.round((globalPaidConsumers / globalPaymentTotalConsumers) * 100) : 0,
      cashierBreakdown,
    }

    const prevCashierBreakdown: CashierProgress[] = []
    let prevPaymentTotal  = 0
    let prevPaymentPaid   = 0

    for (const c of activeCashiers) {
      const areaTotalRow = await queryOne<CountRow>(
        `SELECT COUNT(co.Consumer_ID) AS count
         FROM Consumer co
         JOIN User u ON u.User_ID = co.User_ID
         WHERE co.Area_ID = ? AND u.Account_Status = 'Active'`,
        [c.Assigned_Area_ID]
      )

      const areaPaidRow = await queryOne<CountRow>(
        `SELECT COUNT(DISTINCT p.Consumer_ID) AS count
         FROM Payment p
         JOIN Bill b ON p.Bill_ID = b.Bill_ID
         JOIN MeterReading mrd ON mrd.MeterReading_ID = b.MeterReading_ID
         JOIN Consumer co ON co.Consumer_ID = p.Consumer_ID
         JOIN User u ON u.User_ID = co.User_ID
         WHERE co.Area_ID = ?
           AND u.Account_Status = 'Active'
           AND DATE(p.Date_Paid) >= ?
           AND DATE(p.Date_Paid) <= ?
           AND DATE(mrd.Date_Recorded) >= ?
           AND DATE(mrd.Date_Recorded) <= ?`,
        [c.Assigned_Area_ID, prevCycleStartDate, prevCycleEndDate, prevCycleStartDate, prevCycleEndDate]
      )

      const total  = areaTotalRow?.count ?? 0
      const paid   = areaPaidRow?.count  ?? 0

      prevPaymentTotal += total
      prevPaymentPaid  += paid

      prevCashierBreakdown.push({
        cashierId:        c.User_ID,
        firstName:        c.First_Name,
        lastName:         c.Last_Name,
        assignedAreaName: c.Area_Name,
        totalConsumers:   total,
        paidConsumers:    paid,
        notYetPaidConsumers: Math.max(0, total - paid),
      })
    }

    const previousPaymentProgress: AdminPaymentProgress = {
      totalConsumers:    prevPaymentTotal,
      paidConsumers:     prevPaymentPaid,
      notYetPaidConsumers: Math.max(0, prevPaymentTotal - prevPaymentPaid),
      overallCompletion: prevPaymentTotal > 0 ? Math.round((prevPaymentPaid / prevPaymentTotal) * 100) : 0,
      cashierBreakdown:  prevCashierBreakdown,
    }

    return ok({
      totalActiveConsumers:  activeConsumers?.count ?? 0,
      pendingDisconnections: pendingDisconnections?.count ?? 0,
      recentRegistrations:   recentRegistrations.map((u) => ({
        userId:           u.User_ID,
        firstName:        u.First_Name,
        lastName:         u.Last_Name,
        userType:         u.User_Type,
        accountStatus:    u.Account_Status,
        registrationDate: u.Registration_Date,
      })),
      billingProgress,
      previousBillingProgress,
      paymentProgress,
      previousPaymentProgress,
      currentPeriodLabel:  formatCyclePeriod(startDateObj, endDateObj),
      previousPeriodLabel: formatCyclePeriod(prevStartDateObj, prevEndDateObj),
    })

  } catch (error) {
    logger.error('Admin dashboard error:', error)
    return handleApiError(error)
  }
}