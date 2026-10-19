import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { setDbExecutor, type DbExecutor, type SqlValue } from "@/shared/db";

// Resolved from the project root (vitest runs there): under jsdom `import.meta.url` is not a
// file URL, so component tests could not use this helper.
const MIGRATIONS_DIR = join(process.cwd(), "src-tauri", "migrations");

export interface MemoryDb {
  raw: Database.Database;
  executor: DbExecutor;
}

/** In-memory SQLite running the real migrations, wired as the repositories' executor. */
export function useMemoryDb(): MemoryDb {
  const raw = new Database(":memory:");
  // The sqlx connection used by the app enables foreign keys by default.
  raw.pragma("foreign_keys = ON");
  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    raw.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }

  const run = (sql: string, params: SqlValue[]) => {
    const statement = raw.prepare(sql);
    if (statement.reader) return { rows: statement.all(...params), changes: 0 };
    return { rows: [], changes: statement.run(...params).changes };
  };

  const executor: DbExecutor = {
    async select(sql, params) {
      return run(sql, params).rows as Record<string, unknown>[];
    },
    async execute(sql, params) {
      return { rowsAffected: run(sql, params).changes };
    },
    async batch(statements) {
      raw.transaction(() => {
        for (const { sql, params } of statements) run(sql, params);
      })();
    },
  };

  setDbExecutor(executor);
  return { raw, executor };
}
