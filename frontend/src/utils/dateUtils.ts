import { format, subDays, startOfDay, endOfDay } from "date-fns";

export function getDateRangePresets() {
  const now = new Date();
  return {
    today: {
      start: startOfDay(now),
      end: endOfDay(now),
    },
    last7Days: {
      start: startOfDay(subDays(now, 7)),
      end: endOfDay(now),
    },
    last30Days: {
      start: startOfDay(subDays(now, 30)),
      end: endOfDay(now),
    },
    last90Days: {
      start: startOfDay(subDays(now, 90)),
      end: endOfDay(now),
    },
  };
}

export function formatDateForInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function isDateInRange(
  date: Date | string,
  start: Date | null,
  end: Date | null,
): boolean {
  const checkDate = typeof date === "string" ? new Date(date) : date;

  if (start && checkDate < start) return false;
  if (end && checkDate > end) return false;

  return true;
}
