import { z } from "zod";
import { emitDbChanged, execute, select, selectOne } from "@/shared/db";
import { nowUTC, type DateISO } from "@/shared/lib/dates";
import { newId } from "@/shared/lib/ids";
import {
  GospelReadingRowSchema,
  pickTodayGospel,
  type GospelReading,
  type TodayGospel,
} from "./model";
import { sameChapter, type ChapterRef } from "./plan";

const COLUMNS = "id, date, book, chapter, created_at";

/** Readings marked on `date`, oldest first. */
export function listReadingsForDate(date: DateISO): Promise<GospelReading[]> {
  return select(
    `SELECT ${COLUMNS} FROM gospel_reading WHERE date = ? ORDER BY created_at, rowid`,
    [date],
    GospelReadingRowSchema,
  );
}

/** Latest readings, newest first. */
export function listRecentReadings(limit: number): Promise<GospelReading[]> {
  return select(
    `SELECT ${COLUMNS} FROM gospel_reading ORDER BY date DESC, created_at DESC, rowid DESC LIMIT ?`,
    [limit],
    GospelReadingRowSchema,
  );
}

export function getLastReading(): Promise<GospelReading | null> {
  return selectOne(
    `SELECT ${COLUMNS} FROM gospel_reading ORDER BY date DESC, created_at DESC, rowid DESC LIMIT 1`,
    [],
    GospelReadingRowSchema,
  );
}

export async function countReadings(): Promise<number> {
  const row = await selectOne(
    "SELECT COUNT(*) AS total FROM gospel_reading",
    [],
    z.object({ total: z.number() }),
  );
  return row?.total ?? 0;
}

/** Every day with at least one reading, for the streak. */
export async function listReadingDates(): Promise<DateISO[]> {
  const rows = await select(
    "SELECT DISTINCT date FROM gospel_reading ORDER BY date DESC",
    [],
    z.object({ date: z.string() }),
  );
  return rows.map((row) => row.date);
}

/** Chapter for `date` and whether it was already read that day. */
export async function getTodayGospel(date: DateISO): Promise<TodayGospel> {
  const [readToday, last] = await Promise.all([listReadingsForDate(date), getLastReading()]);
  return pickTodayGospel(readToday, last);
}

/** Marks `ref` as read on `date`. Marking the same chapter twice on one day is a no-op. */
export async function markRead(date: DateISO, ref: ChapterRef): Promise<GospelReading> {
  const existing = (await listReadingsForDate(date)).find((reading) => sameChapter(reading, ref));
  if (existing) return existing;
  const reading: GospelReading = { id: newId(), date, ...ref, createdAt: nowUTC() };
  await execute(
    "INSERT INTO gospel_reading (id, date, book, chapter, created_at) VALUES (?, ?, ?, ?, ?)",
    [reading.id, reading.date, reading.book, reading.chapter, reading.createdAt],
  );
  emitDbChanged("gospel_reading");
  return reading;
}

export async function unmarkReading(id: string): Promise<void> {
  await execute("DELETE FROM gospel_reading WHERE id = ?", [id]);
  emitDbChanged("gospel_reading");
}
