const MSK_OFFSET_MINUTES = 3 * 60;

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

  // Input values are treated as Moscow time (UTC+3), then converted to UTC.
  const utc = new Date(Date.UTC(fullYear, m - 1, d, h, min - MSK_OFFSET_MINUTES, 0));
  return utc.toISOString();
}

export function mskPartsFromUtcIso(iso: string): { date: string; hours: string; minutes: string } | null {
  const utcDate = new Date(iso);
  if (Number.isNaN(utcDate.getTime())) {
    return null;
  }

  const mskDate = new Date(utcDate.getTime() + MSK_OFFSET_MINUTES * 60 * 1000);
  const date = `${String(mskDate.getUTCDate()).padStart(2, "0")}.${String(mskDate.getUTCMonth() + 1).padStart(2, "0")}.${String(mskDate.getUTCFullYear()).slice(-2)}`;
  const hours = String(mskDate.getUTCHours()).padStart(2, "0");
  const minutes = String(mskDate.getUTCMinutes()).padStart(2, "0");

  return { date, hours, minutes };
}
