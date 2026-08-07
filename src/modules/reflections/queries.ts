import { and, between, eq } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db, insertInBatches } from '@/modules/db';
import type { Transaction } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { periodStartOf } from './periods';
import { reflectionTable } from './schema';
import type { Reflection, ReflectionKind } from './schema';

// A period owns at most one reflection, so its identity is derivable rather
// than generated — no read is needed before a write.
export function reflectionIdFor(kind: ReflectionKind, periodStart: number): string {
  return `${kind}-${periodStart}`;
}

export async function listReflections(
  kind: ReflectionKind,
  from: number,
  to: number
): Promise<Result<Reflection[]>> {
  try {
    const rows = await db
      .select()
      .from(reflectionTable)
      .where(
        and(
          eq(reflectionTable.kind, kind),
          // Snapped back to a boundary: a period the caller's range only
          // overlaps still begins before it, and would otherwise be missed.
          between(reflectionTable.period_start, periodStartOf(kind, from).getTime(), to)
        )
      );
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Blank is not a reflection: clearing the field removes the row rather than
// storing an empty string, so an untouched period leaves no trace.
export async function writeReflection(
  kind: ReflectionKind,
  periodStart: number,
  text: string
): Promise<Result<void>> {
  const id = reflectionIdFor(kind, periodStart);

  try {
    if (text.trim().length === 0) {
      await db.delete(reflectionTable).where(eq(reflectionTable.id, id));
      return ok(undefined);
    }

    await db
      .insert(reflectionTable)
      .values({ id, kind, period_start: periodStart, text })
      .onConflictDoUpdate({ target: reflectionTable.id, set: { text } });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function listAllReflections(): Promise<Result<Reflection[]>> {
  try {
    const rows = await db.select().from(reflectionTable);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Throws instead of returning a Result: the caller supplies the transaction,
// and a throw is what rolls it back.
export async function replaceReflections(
  reflections: readonly Reflection[],
  tx: Transaction
): Promise<void> {
  await tx.delete(reflectionTable);
  await insertInBatches(reflections, batch =>
    tx.insert(reflectionTable).values(batch)
  );
}
