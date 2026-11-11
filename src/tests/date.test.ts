import { describe, expect, it } from "vitest";
import { currentYearInZone, DEFAULT_TIME_ZONE, formatInZone, formatRangeInZone } from "@/lib/date";

describe("date helpers", () => {
  it("defaults to Orange County time", () => {
    expect(DEFAULT_TIME_ZONE).toBe("America/Los_Angeles");
  });

  it("formats UTC instants in Pacific time, including across midnight", () => {
    // 03:30 UTC on Nov 15 is still the evening of Nov 14 in Los Angeles (PST, UTC-8).
    expect(formatInZone("2026-11-15T03:30:00Z", "yyyy-MM-dd HH:mm")).toBe("2026-11-14 19:30");
  });

  it("handles daylight saving time", () => {
    // July is PDT (UTC-7); January is PST (UTC-8).
    expect(formatInZone("2026-07-04T19:00:00Z", "h:mm a")).toBe("12:00 PM");
    expect(formatInZone("2026-01-10T20:00:00Z", "h:mm a")).toBe("12:00 PM");
  });

  it("can format in another zone when asked", () => {
    expect(formatInZone("2026-11-15T03:30:00Z", "yyyy-MM-dd HH:mm", "UTC")).toBe("2026-11-15 03:30");
  });

  it("collapses same-day ranges and keeps multi-day ranges explicit", () => {
    expect(formatRangeInZone("2026-11-14T17:00:00Z", "2026-11-14T19:30:00Z")).toBe("Sat, Nov 14, 2026, 9:00 AM – 11:30 AM");
    expect(formatRangeInZone("2026-11-14T17:00:00Z", "2026-11-15T19:30:00Z")).toBe("Sat, Nov 14, 2026, 9:00 AM – Sun, Nov 15, 2026, 11:30 AM");
  });

  it("rejects invalid input and reversed ranges", () => {
    expect(() => formatInZone("not a date")).toThrow(RangeError);
    expect(() => formatRangeInZone("2026-11-14T19:00:00Z", "2026-11-14T17:00:00Z")).toThrow(/End must not be before start/);
  });

  it("reports the year in Pacific time on New Year's boundary", () => {
    // 05:00 UTC on Jan 1 is still Dec 31 in Los Angeles.
    expect(currentYearInZone("2027-01-01T05:00:00Z")).toBe(2026);
    expect(currentYearInZone("2027-01-01T09:00:00Z")).toBe(2027);
  });
});
