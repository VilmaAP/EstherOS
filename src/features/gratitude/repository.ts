import { z } from "zod";
import { emitDbChanged, execute, select } from "@/shared/db";
import { nowUTC, type DateISO } from "@/shared/lib/dates";
import { newId } from "@/shared/lib/ids";
import {
  GratitudeEntryRowSchema,
  NewGratitudeEntrySchema,
  gratitudeTextSchema,
  type GratitudeEntry,
  type NewGratitudeEntry,
} from "./model";

const COLUMNS = "id, date, text, created_at, updated_at";

/** Entries of one day, in the order they were written. */
export function listEntriesForDate(date: DateISO): Promise<GratitudeEntry[]> {
  return select(
    `SELECT ${COLUMNS} FROM gratitude_entry WHERE date = ? ORDER BY created_at, rowid`,
    [date],
    GratitudeEntryRowSchema,
  );
}

/** Entries of the latest `days` days that have any, newest day first. */
export function listRecentEntries(days: number): Promise<GratitudeEntry[]> {
  return select(
    `SELECT ${COLUMNS} FROM gratitude_entry
     WHERE date IN (SELECT DISTINCT date FROM gratitude_entry ORDER BY date DESC LIMIT ?)
     ORDER BY date DESC, created_at, rowid`,
    [days],
    GratitudeEntryRowSchema,
  );
}

/** Every day with at least one entry, for the streak. */
export async function listEntryDates(): Promise<DateISO[]> {
  const rows = await select(
    "SELECT DISTINCT date FROM gratitude_entry ORDER BY date DESC",
    [],
    z.object({ date: z.string() }),
  );
  return rows.map((row) => row.date);
}

export async function createEntry(input: NewGratitudeEntry): Promise<GratitudeEntry> {
  const data = NewGratitudeEntrySchema.parse(input);
  const now = nowUTC();
  const entry: GratitudeEntry = { id: newId(), ...data, createdAt: now, updatedAt: now };
  await execute(
    "INSERT INTO gratitude_entry (id, date, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    [entry.id, entry.date, entry.text, now, now],
  );
  emitDbChanged("gratitude_entry");
  return entry;
}

export async function updateEntryText(id: string, text: string): Promise<void> {
  const clean = gratitudeTextSchema.parse(text);
  await execute("UPDATE gratitude_entry SET text = ?, updated_at = ? WHERE id = ?", [
    clean,
    nowUTC(),
    id,
  ]);
  emitDbChanged("gratitude_entry");
}

export async function deleteEntry(id: string): Promise<void> {
  await execute("DELETE FROM gratitude_entry WHERE id = ?", [id]);
  emitDbChanged("gratitude_entry");
}
