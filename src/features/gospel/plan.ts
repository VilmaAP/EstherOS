import { z } from "zod";

/**
 * Reading plan: the four gospels one chapter a day, in canonical order (89 days), then again
 * from the start. The text itself is bundled in `data/gospels.json` (Reina-Valera 1909).
 */

export const GOSPEL_BOOKS = ["mateo", "marcos", "lucas", "juan"] as const;
export const GospelBookSchema = z.enum(GOSPEL_BOOKS);
export type GospelBook = z.infer<typeof GospelBookSchema>;

export const CHAPTER_COUNTS: Record<GospelBook, number> = {
  mateo: 28,
  marcos: 16,
  lucas: 24,
  juan: 21,
};

export interface ChapterRef {
  book: GospelBook;
  /** 1-based. */
  chapter: number;
}

export const PLAN: readonly ChapterRef[] = GOSPEL_BOOKS.flatMap((book) =>
  Array.from({ length: CHAPTER_COUNTS[book] }, (_, index) => ({ book, chapter: index + 1 })),
);

export const PLAN_LENGTH = PLAN.length;

/** Position of `ref` in the plan (0-based), or -1 if it does not exist. */
export function planIndex(ref: ChapterRef): number {
  return PLAN.findIndex((item) => item.book === ref.book && item.chapter === ref.chapter);
}

/** Chapter after `ref`, wrapping to Mateo 1 after Juan 21. Without `ref`, the first one. */
export function nextInPlan(ref: ChapterRef | null): ChapterRef {
  if (!ref) return PLAN[0];
  const index = planIndex(ref);
  return PLAN[(index + 1) % PLAN_LENGTH];
}

export function sameChapter(a: ChapterRef, b: ChapterRef): boolean {
  return a.book === b.book && a.chapter === b.chapter;
}
