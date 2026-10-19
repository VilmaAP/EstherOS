// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  createEntry,
  deleteEntry,
  groupByDay,
  listEntriesForDate,
  listEntryDates,
  listRecentEntries,
  updateEntryText,
} from "@/features/gratitude";
import { useMemoryDb } from "./helpers/memoryDb";

beforeEach(() => {
  useMemoryDb();
});

describe("gratitude", () => {
  it("keeps the day's entries in the order they were written, trimmed", async () => {
    await createEntry({ date: "2026-10-19", text: "  El café de la mañana " });
    await createEntry({ date: "2026-10-19", text: "Una llamada de mamá" });
    await createEntry({ date: "2026-10-18", text: "Ayer" });

    const today = await listEntriesForDate("2026-10-19");
    expect(today.map((e) => e.text)).toEqual(["El café de la mañana", "Una llamada de mamá"]);
  });

  it("rejects blank text", async () => {
    await expect(createEntry({ date: "2026-10-19", text: "   " })).rejects.toThrow();
    const entry = await createEntry({ date: "2026-10-19", text: "Algo" });
    await expect(updateEntryText(entry.id, "")).rejects.toThrow();
  });

  it("edits and deletes entries", async () => {
    const entry = await createEntry({ date: "2026-10-19", text: "Borrador" });
    await updateEntryText(entry.id, "El sol de la tarde");
    expect((await listEntriesForDate("2026-10-19"))[0].text).toBe("El sol de la tarde");

    await deleteEntry(entry.id);
    expect(await listEntriesForDate("2026-10-19")).toEqual([]);
  });

  it("loads the latest days with entries, grouped newest first", async () => {
    await createEntry({ date: "2026-10-01", text: "Uno" });
    await createEntry({ date: "2026-10-05", text: "Dos" });
    await createEntry({ date: "2026-10-05", text: "Tres" });
    await createEntry({ date: "2026-10-09", text: "Cuatro" });

    const days = groupByDay(await listRecentEntries(2));
    expect(days.map((d) => [d.date, d.entries.map((e) => e.text)])).toEqual([
      ["2026-10-09", ["Cuatro"]],
      ["2026-10-05", ["Dos", "Tres"]],
    ]);
    expect(await listEntryDates()).toEqual(["2026-10-09", "2026-10-05", "2026-10-01"]);
  });
});
