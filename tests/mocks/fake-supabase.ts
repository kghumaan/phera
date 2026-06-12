/**
 * Minimal chainable Supabase stub for agent tests. Configure per-table
 * results; every query-builder method chains, awaiting resolves the
 * configured result, and inserts/updates are recorded for assertions.
 */
export interface TableResult {
  data?: unknown;
  count?: number | null;
  error?: { message: string } | null;
}

export interface FakeSupabase {
  client: { from: (table: string) => unknown };
  inserts: Record<string, unknown[]>;
  updates: Record<string, unknown[]>;
}

export function createFakeSupabase(tableResults: Record<string, TableResult>): FakeSupabase {
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};

  function from(table: string) {
    const result: TableResult = tableResults[table] ?? { data: [], count: 0, error: null };
    const resolved = {
      data: result.data ?? null,
      count: result.count ?? null,
      error: result.error ?? null,
    };
    const singleData = Array.isArray(resolved.data) ? (resolved.data[0] ?? null) : resolved.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proxy: any = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'then') {
            return (resolve: (v: unknown) => void) => resolve(resolved);
          }
          if (prop === 'single' || prop === 'maybeSingle') {
            return () => Promise.resolve({ data: singleData, error: resolved.error });
          }
          if (prop === 'insert') {
            return (row: unknown) => {
              (inserts[table] ??= []).push(row);
              return proxy;
            };
          }
          if (prop === 'update') {
            return (row: unknown) => {
              (updates[table] ??= []).push(row);
              return proxy;
            };
          }
          return () => proxy;
        },
      }
    );
    return proxy;
  }

  return { client: { from }, inserts, updates };
}
