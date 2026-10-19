import { computeStreak, type Streak } from "@/features/journal";
import type { DbTable } from "@/shared/db";
import { useDbQuery, type DbQuery } from "@/shared/db/useDbQuery";
import type { DateISO } from "@/shared/lib/dates";
import type { GratitudeEntry } from "./model";
import { listEntriesForDate, listEntryDates, listRecentEntries } from "./repository";

const TABLES: readonly DbTable[] = ["gratitude_entry"];
const NO_ENTRIES: GratitudeEntry[] = [];
const NO_STREAK: Streak = { days: 0, writtenToday: false };

export function useGratitudeForDate(date: DateISO): DbQuery<GratitudeEntry[]> {
  return useDbQuery(`date:${date}`, () => listEntriesForDate(date), TABLES, NO_ENTRIES);
}

export function useRecentGratitude(days: number): DbQuery<GratitudeEntry[]> {
  return useDbQuery(`recent:${days}`, () => listRecentEntries(days), TABLES, NO_ENTRIES);
}

/** Consecutive days giving thanks, ending today (or yesterday while today is still blank). */
export function useGratitudeStreak(today: DateISO): Streak {
  return useDbQuery(
    `streak:${today}`,
    async () => computeStreak(await listEntryDates(), today),
    TABLES,
    NO_STREAK,
  ).data;
}
