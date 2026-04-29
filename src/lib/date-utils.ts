export function getCycleBoundsForDate(
  dateStr: string,
  startDay: number,
  endDay: number
): { cycleStartDate: string; cycleEndDate: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const m = month - 1 // 0-indexed

  const isCrossMonth = startDay > endDay
  let startDateObj: Date
  let endDateObj: Date

  if (isCrossMonth) {
    if (day >= startDay) {
      startDateObj = new Date(year, m, startDay)
      endDateObj   = new Date(year, m + 1, endDay)
    } else {
      startDateObj = new Date(year, m - 1, startDay)
      endDateObj   = new Date(year, m, endDay)
    }
  } else {
    startDateObj = new Date(year, m, startDay)
    endDateObj   = new Date(year, m, endDay)
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  return { cycleStartDate: fmt(startDateObj), cycleEndDate: fmt(endDateObj) }
}

export function getManilaDateParts() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value) - 1; // 0-indexed
  const day = parseInt(parts.find((p) => p.type === 'day')!.value);
  return { year, month, day };
}

export function getManilaDateStr() {
  const { year, month, day } = getManilaDateParts();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getDueDateStr(daysToAdd: number) {
  const { year, month, day } = getManilaDateParts();
  const date = new Date(year, month, day);
  let addedDays = 0;
  while (addedDays < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const wday = date.getDay();
    if (wday !== 0 && wday !== 6) {
      addedDays++;
    }
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getFixedDueDateStr(targetDay: number) {
  const { year, month } = getManilaDateParts();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}
