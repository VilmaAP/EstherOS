import { useEffect, useState } from "react";
import { computeStreak, type Streak } from "@/features/journal";
import type { DbTable } from "@/shared/db";
import { useDbQuery, type DbQuery } from "@/shared/db/useDbQuery";
import type { DateISO } from "@/shared/lib/dates";
import { log } from "@/shared/lib/log";
import type { GospelReading, TodayGospel } from "./model";
import { PLAN, type ChapterRef } from "./plan";
import { countReadings, getTodayGospel, listReadingDates, listRecentReadings } from "./repository";
import { chapterVerses, loadGospelText, type GospelText } from "./text";

const TABLES: readonly DbTable[] = ["gospel_reading"];
const NO_READINGS: GospelReading[] = [];
const NO_STREAK: Streak = { days: 0, writtenToday: false };
const FIRST: TodayGospel = { ref: PLAN[0], reading: null, position: 1 };

export function useTodayGospel(today: DateISO): DbQuery<TodayGospel> {
  return useDbQuery(`today:${today}`, () => getTodayGospel(today), TABLES, FIRST);
}

export function useRecentReadings(limit: number): DbQuery<GospelReading[]> {
  return useDbQuery(`recent:${limit}`, () => listRecentReadings(limit), TABLES, NO_READINGS);
}

export function useReadingCount(): number {
  return useDbQuery("count", countReadings, TABLES, 0).data;
}

/** Consecutive days reading, ending today (or yesterday while today is still pending). */
export function useGospelStreak(today: DateISO): Streak {
  return useDbQuery(
    `streak:${today}`,
    async () => computeStreak(await listReadingDates(), today),
    TABLES,
    NO_STREAK,
  ).data;
}

export interface ChapterText {
  verses: string[];
  translation: string;
  loading: boolean;
  error: unknown;
}

/** Verses of `ref` from the bundled text, loaded on first use. */
export function useChapterText(ref: ChapterRef): ChapterText {
  const [state, setState] = useState<{ text: GospelText | null; error: unknown }>({
    text: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    loadGospelText().then(
      (text) => {
        if (!cancelled) setState({ text, error: null });
      },
      (error: unknown) => {
        log.error("gospel: text load failed", error);
        if (!cancelled) setState({ text: null, error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    verses: state.text ? chapterVerses(state.text, ref) : [],
    translation: state.text?.translation ?? "",
    loading: !state.text && !state.error,
    error: state.error,
  };
}
