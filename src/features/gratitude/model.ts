import { z } from "zod";
import { dateISOSchema, utcTimestampSchema } from "@/shared/db";
import { t } from "@/shared/i18n";

export const GRATITUDE_TEXT_MAX = 500;
/** How many things the day invites to write; more are allowed. */
export const DAILY_GOAL = 3;

export const GratitudeEntrySchema = z.object({
  id: z.string(),
  date: dateISOSchema,
  text: z.string().min(1).max(GRATITUDE_TEXT_MAX),
  createdAt: utcTimestampSchema,
  updatedAt: utcTimestampSchema,
});
export type GratitudeEntry = z.infer<typeof GratitudeEntrySchema>;

export const GratitudeEntryRowSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    text: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    date: row.date,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
  .pipe(GratitudeEntrySchema);

export const gratitudeTextSchema = z.string().trim().min(1).max(GRATITUDE_TEXT_MAX);

export const NewGratitudeEntrySchema = z.object({
  date: dateISOSchema,
  text: gratitudeTextSchema,
});
export type NewGratitudeEntry = z.input<typeof NewGratitudeEntrySchema>;

export interface GratitudeDay {
  date: string;
  entries: GratitudeEntry[];
}

/** Groups entries (already sorted newest day first) by day, keeping their order. */
export function groupByDay(entries: readonly GratitudeEntry[]): GratitudeDay[] {
  const days: GratitudeDay[] = [];
  for (const entry of entries) {
    const last = days.at(-1);
    if (last?.date === entry.date) last.entries.push(entry);
    else days.push({ date: entry.date, entries: [entry] });
  }
  return days;
}

/** "3 días seguidos dando gracias". */
export function streakText(days: number): string {
  if (days === 0) return t("gratitude.streakNone");
  if (days === 1) return t("gratitude.streakOne");
  return t("gratitude.streak", { count: days });
}
