import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/**
 * All timestamps are stored as timestamptz (UTC instants) and displayed in
 * Orange County time unless a user or event specifies another zone.
 */
export const DEFAULT_TIME_ZONE = "America/Los_Angeles";

type DateInput = Date | string | number;

function toInstant(input: DateInput): Date {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${String(input)}`);
  }
  return date;
}

/** Formats an instant in the given time zone (Pacific time by default). */
export function formatInZone(input: DateInput, pattern = "MMMM d, yyyy", timeZone = DEFAULT_TIME_ZONE): string {
  return format(new TZDate(toInstant(input).getTime(), timeZone), pattern);
}

/** Formats a start/end range, collapsing the date when both fall on the same local day. */
export function formatRangeInZone(start: DateInput, end: DateInput, timeZone = DEFAULT_TIME_ZONE): string {
  const s = new TZDate(toInstant(start).getTime(), timeZone);
  const e = new TZDate(toInstant(end).getTime(), timeZone);
  if (e.getTime() < s.getTime()) throw new RangeError("End must not be before start.");
  const sameDay = format(s, "yyyy-MM-dd") === format(e, "yyyy-MM-dd");
  return sameDay
    ? `${format(s, "EEE, MMM d, yyyy, h:mm a")} – ${format(e, "h:mm a")}`
    : `${format(s, "EEE, MMM d, yyyy, h:mm a")} – ${format(e, "EEE, MMM d, yyyy, h:mm a")}`;
}

/**
 * The current year in Pacific time (used in the footer so it flips at local midnight).
 * Uses Intl directly so pages that only need the year don't load date-fns.
 */
export function currentYearInZone(now: DateInput = new Date(), timeZone = DEFAULT_TIME_ZONE): number {
  const year = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(toInstant(now));
  return Number(year);
}
