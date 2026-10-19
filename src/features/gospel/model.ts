import { z } from "zod";
import { dateISOSchema, utcTimestampSchema } from "@/shared/db";
import { t, type I18nKey } from "@/shared/i18n";
import { GospelBookSchema, PLAN_LENGTH, nextInPlan, planIndex, type ChapterRef } from "./plan";

export const GospelReadingSchema = z.object({
  id: z.string(),
  date: dateISOSchema,
  book: GospelBookSchema,
  chapter: z.number().int().min(1),
  createdAt: utcTimestampSchema,
});
export type GospelReading = z.infer<typeof GospelReadingSchema>;

export const GospelReadingRowSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    book: z.string(),
    chapter: z.number(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    date: row.date,
    book: row.book,
    chapter: row.chapter,
    createdAt: row.created_at,
  }))
  .pipe(GospelReadingSchema);

export interface TodayGospel {
  /** Chapter to read today. */
  ref: ChapterRef;
  /** The reading that marked it as read today, or null while it is pending. */
  reading: GospelReading | null;
  /** 1-based position of `ref` in the plan. */
  position: number;
}

/**
 * Today's chapter: the one already read today if any (latest first), otherwise the chapter after
 * the last one ever read. Missing a day does not skip chapters.
 */
export function pickTodayGospel(
  readToday: readonly GospelReading[],
  lastReading: GospelReading | null,
): TodayGospel {
  const done = readToday.at(-1) ?? null;
  const ref: ChapterRef = done
    ? { book: done.book, chapter: done.chapter }
    : nextInPlan(lastReading ? { book: lastReading.book, chapter: lastReading.chapter } : null);
  return { ref, reading: done, position: planIndex(ref) + 1 };
}

/** "Mateo 5". */
export function chapterLabel(ref: ChapterRef): string {
  return t("gospel.chapterLabel", {
    book: t(`gospel.book.${ref.book}` as I18nKey),
    chapter: ref.chapter,
  });
}

/** "Capítulo 33 de 89". */
export function positionLabel(position: number): string {
  return t("gospel.position", { position, total: PLAN_LENGTH });
}

/** "3 días seguidos leyendo". */
export function streakText(days: number): string {
  if (days === 0) return t("gospel.streakNone");
  if (days === 1) return t("gospel.streakOne");
  return t("gospel.streak", { count: days });
}
