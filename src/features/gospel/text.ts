import type { ChapterRef, GospelBook } from "./plan";

export interface GospelText {
  translation: string;
  license: string;
  source: string;
  books: { id: GospelBook; name: string; chapters: string[][] }[];
}

let textPromise: Promise<GospelText> | null = null;

/** Loads the bundled text once (~430 KB, split from the main bundle). */
export function loadGospelText(): Promise<GospelText> {
  if (!textPromise) {
    textPromise = import("./data/gospels.json")
      .then((module) => module.default as GospelText)
      .catch((error: unknown) => {
        textPromise = null;
        throw error;
      });
  }
  return textPromise;
}

/** Verses of a chapter, in order (verse 1 first). Empty if the chapter does not exist. */
export function chapterVerses(text: GospelText, ref: ChapterRef): string[] {
  return text.books.find((book) => book.id === ref.book)?.chapters[ref.chapter - 1] ?? [];
}
