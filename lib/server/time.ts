export function toDateKey(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${String(year).padStart(2, "0")}`;
}

export function deadlineFromParts(date: string, hours = "10", minutes = "00"): string | null {
  const [dd, mm, yy] = date.split(".");
  if (!dd || !mm || !yy) {
    return null;
  }

  const fullYear = Number(yy) < 100 ? 2000 + Number(yy) : Number(yy);
  const d = Number(dd);
  const m = Number(mm);
  const h = Number(hours);
  const min = Number(minutes);

  if ([fullYear, d, m, h, min].some((n) => Number.isNaN(n))) {
    return null;
  }

  const utc = new Date(Date.UTC(fullYear, m - 1, d, h, min, 0));
  return utc.toISOString();
}
