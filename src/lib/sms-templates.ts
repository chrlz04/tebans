export function buildBillingAlertMessage({
  template,
  consumerName,
  billAmount,
  dueDate,
  billingMonth,
  accountNo,
  previousReading,
  currentReading,
}: {
  template:      string
  consumerName:  string
  billAmount:    number
  dueDate:       string
  billingMonth:  string
  accountNo:     string
  previousReading: number
  currentReading:  number
}): string {
  const formattedAmount = billAmount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })
  const formattedDate = new Date(dueDate).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })

  let msg = template
  msg = msg.replace(/\{name\}/g, consumerName)
  msg = msg.replace(/\{amount\}/g, formattedAmount)
  msg = msg.replace(/\{month\}/g, billingMonth)
  msg = msg.replace(/\{due_date\}/g, formattedDate)
  msg = msg.replace(/\{account_no\}/g, accountNo)
  msg = msg.replace(/\{previous_reading\}/g, previousReading.toString())
  msg = msg.replace(/\{current_reading\}/g, currentReading.toString())

  const usage = Math.max(0, currentReading - previousReading)
  msg = msg.replace(/\{usage\}/g, usage.toString())

  return msg
}

export function buildDisconnectionMessage({
  consumerName,
  scheduledDate,
  reason,
}: {
  consumerName:  string
  scheduledDate: string
  reason:        string
}): string {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })

  return (
    `Dear ${consumerName}, your electricity service is scheduled ` +
    `for disconnection on ${formattedDate} due to: ${reason}. ` +
    `Please settle your account immediately. ` +
    `- TEBANS`
  )
}
