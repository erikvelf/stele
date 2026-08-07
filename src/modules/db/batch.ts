import { chunk } from '@/lib/chunk';

import { INSERT_BATCH_ROWS } from './constants';

// Batches run one after another. They are chained rather than looped because
// a loop that awaits is banned, and SQLite gains nothing from parallel writes.
export async function insertInBatches<T>(
  rows: readonly T[],
  insert: (batch: T[]) => Promise<unknown>
): Promise<void> {
  await chunk(rows, INSERT_BATCH_ROWS).reduce<Promise<unknown>>(
    (previous, batch) => previous.then(() => insert(batch)),
    Promise.resolve()
  );
}
