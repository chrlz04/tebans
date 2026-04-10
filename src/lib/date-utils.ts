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
