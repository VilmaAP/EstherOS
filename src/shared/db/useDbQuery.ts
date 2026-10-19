import { useEffect, useRef, useState } from "react";
import { log } from "@/shared/lib/log";
import { onDbChanged, type DbTable } from "./events";

export interface DbQuery<T> {
  data: T;
  /** True until the data for the current `key` has arrived (stale data is kept meanwhile). */
  loading: boolean;
  /** Why the last load for the current `key` failed, or null. */
  error: unknown;
}

/**
 * Loads data from a repository and reloads it whenever one of `tables` changes. `key` must
 * change whenever the inputs of `load` change. Kept out of the `@/shared/db` barrel so the data
 * layer stays free of React.
 */
export function useDbQuery<T>(
  key: string,
  load: () => Promise<T>,
  tables: readonly DbTable[],
  initial: T,
): DbQuery<T> {
  const [state, setState] = useState<{ key: string | null; data: T; error: unknown }>({
    key: null,
    data: initial,
    error: null,
  });
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const tablesKey = tables.join(",");
  useEffect(() => {
    const unsubscribe = tablesKey
      .split(",")
      .map((table) => onDbChanged(table as DbTable, () => setVersion((v) => v + 1)));
    return () => unsubscribe.forEach((off) => off());
  }, [tablesKey]);

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ key, data, error: null });
      },
      (error: unknown) => {
        log.error("db query failed", key, error);
        if (!cancelled) setState((current) => ({ ...current, key, error }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  const current = state.key === key;
  return { data: state.data, loading: !current, error: current ? state.error : null };
}
