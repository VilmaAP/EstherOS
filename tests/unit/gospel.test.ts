// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  CHAPTER_COUNTS,
  GOSPEL_BOOKS,
  PLAN_LENGTH,
  chapterLabel,
  countReadings,
  getTodayGospel,
  listRecentReadings,
  markRead,
  nextInPlan,
  planIndex,
  unmarkReading,
} from "@/features/gospel";
import { chapterVerses, loadGospelText } from "@/features/gospel/text";
import { useMemoryDb } from "./helpers/memoryDb";

beforeEach(() => {
  useMemoryDb();
});

describe("gospel plan", () => {
  it("covers the 89 chapters of the four gospels in order and wraps around", () => {
    expect(PLAN_LENGTH).toBe(89);
    expect(nextInPlan(null)).toEqual({ book: "mateo", chapter: 1 });
    expect(nextInPlan({ book: "mateo", chapter: 28 })).toEqual({ book: "marcos", chapter: 1 });
    expect(nextInPlan({ book: "juan", chapter: 21 })).toEqual({ book: "mateo", chapter: 1 });
    expect(planIndex({ book: "lucas", chapter: 1 })).toBe(28 + 16);
    expect(chapterLabel({ book: "juan", chapter: 3 })).toBe("Juan 3");
  });

  it("bundles every verse of every planned chapter", async () => {
    const text = await loadGospelText();
    for (const book of GOSPEL_BOOKS) {
      expect(text.books.find((b) => b.id === book)?.chapters).toHaveLength(CHAPTER_COUNTS[book]);
    }
    expect(chapterVerses(text, { book: "mateo", chapter: 1 })).toHaveLength(25);
    expect(chapterVerses(text, { book: "juan", chapter: 3 })[15]).toMatch(/^Porque de tal manera/);
    expect(text.books.flatMap((b) => b.chapters.flat())).toHaveLength(3779);
  });
});

describe("gospel readings", () => {
  it("starts with Mateo 1 and stays on it until it is read", async () => {
    expect(await getTodayGospel("2026-10-19")).toMatchObject({
      ref: { book: "mateo", chapter: 1 },
      reading: null,
      position: 1,
    });
    // A day without reading does not skip the chapter.
    expect((await getTodayGospel("2026-10-20")).ref).toEqual({ book: "mateo", chapter: 1 });
  });

  it("keeps today's chapter as read and moves on the next day", async () => {
    await markRead("2026-10-19", { book: "mateo", chapter: 1 });

    const today = await getTodayGospel("2026-10-19");
    expect(today.ref).toEqual({ book: "mateo", chapter: 1 });
    expect(today.reading).not.toBeNull();

    const tomorrow = await getTodayGospel("2026-10-20");
    expect(tomorrow).toMatchObject({ ref: { book: "mateo", chapter: 2 }, reading: null });
    expect(tomorrow.position).toBe(2);
  });

  it("marking twice on the same day keeps one reading, and unmarking undoes it", async () => {
    const first = await markRead("2026-10-19", { book: "mateo", chapter: 1 });
    const again = await markRead("2026-10-19", { book: "mateo", chapter: 1 });
    expect(again.id).toBe(first.id);
    expect(await countReadings()).toBe(1);

    await unmarkReading(first.id);
    expect(await countReadings()).toBe(0);
    expect(await getTodayGospel("2026-10-19")).toMatchObject({ reading: null, position: 1 });
  });

  it("lists recent readings newest day first", async () => {
    await markRead("2026-10-17", { book: "mateo", chapter: 1 });
    await markRead("2026-10-18", { book: "mateo", chapter: 2 });
    await markRead("2026-10-19", { book: "mateo", chapter: 3 });

    const recent = await listRecentReadings(2);
    expect(recent.map((r) => `${r.date} ${r.chapter}`)).toEqual(["2026-10-19 3", "2026-10-18 2"]);
    expect((await getTodayGospel("2026-10-20")).ref).toEqual({ book: "mateo", chapter: 4 });
  });
});
