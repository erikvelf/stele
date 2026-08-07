import { and, asc, count, eq, inArray, max } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db, insertInBatches } from '@/modules/db';
import type { Transaction } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { dayHighlightPositionTable, dayHighlightTable, tagTable } from './schema';
import type { DayHighlight, Tag } from './schema';
import type { HighlightTables } from './types';

export async function listHighlights(
  noteId: string
): Promise<Result<DayHighlight[]>> {
  try {
    const rows = await db
      .select({
        id: dayHighlightTable.id,
        note_id: dayHighlightTable.note_id,
        text: dayHighlightTable.text,
        tag_id: dayHighlightTable.tag_id,
      })
      .from(dayHighlightTable)
      .innerJoin(
        dayHighlightPositionTable,
        eq(dayHighlightPositionTable.highlight_id, dayHighlightTable.id)
      )
      .where(eq(dayHighlightTable.note_id, noteId))
      .orderBy(asc(dayHighlightPositionTable.position));
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Every highlight belonging to any of the given notes, ordered within each
// note. An empty tag filter means no filter; several tags widen the result
// rather than narrowing it, since a highlight carries at most one.
export async function listHighlightsForNotes(
  noteIds: readonly string[],
  tagIds: readonly string[] = []
): Promise<Result<DayHighlight[]>> {
  if (noteIds.length === 0) {
    return ok([]);
  }

  const byNote = inArray(dayHighlightTable.note_id, [...noteIds]);
  const filter =
    tagIds.length === 0
      ? byNote
      : and(byNote, inArray(dayHighlightTable.tag_id, [...tagIds]));

  try {
    const rows = await db
      .select({
        id: dayHighlightTable.id,
        note_id: dayHighlightTable.note_id,
        text: dayHighlightTable.text,
        tag_id: dayHighlightTable.tag_id,
      })
      .from(dayHighlightTable)
      .innerJoin(
        dayHighlightPositionTable,
        eq(dayHighlightPositionTable.highlight_id, dayHighlightTable.id)
      )
      .where(filter)
      .orderBy(asc(dayHighlightPositionTable.position));
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Every highlight ever struck, across all notes. Used for the home screen's
// creation stats.
export async function countHighlights(): Promise<Result<number>> {
  try {
    const [row] = await db.select({ value: count() }).from(dayHighlightTable);
    return ok(row?.value ?? 0);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeHighlight(
  highlight: DayHighlight
): Promise<Result<void>> {
  try {
    await db.transaction(async tx => {
      await tx
        .insert(dayHighlightTable)
        .values(highlight)
        .onConflictDoUpdate({
          target: dayHighlightTable.id,
          set: { text: highlight.text, tag_id: highlight.tag_id },
        });

      const [existing] = await tx
        .select({ highlightId: dayHighlightPositionTable.highlight_id })
        .from(dayHighlightPositionTable)
        .where(eq(dayHighlightPositionTable.highlight_id, highlight.id));
      if (existing) {
        return;
      }

      const [row] = await tx
        .select({ maxPosition: max(dayHighlightPositionTable.position) })
        .from(dayHighlightPositionTable)
        .where(eq(dayHighlightPositionTable.note_id, highlight.note_id));
      const nextPosition =
        row?.maxPosition === null || row?.maxPosition === undefined
          ? 0
          : row.maxPosition + 1;

      await tx.insert(dayHighlightPositionTable).values({
        highlight_id: highlight.id,
        note_id: highlight.note_id,
        position: nextPosition,
      });
    });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function reorderHighlights(
  orderedIds: string[]
): Promise<Result<void>> {
  try {
    await db.transaction(async tx => {
      await Promise.all(
        orderedIds.map((highlightId, index) =>
          tx
            .update(dayHighlightPositionTable)
            .set({ position: index })
            .where(eq(dayHighlightPositionTable.highlight_id, highlightId))
        )
      );
    });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function deleteHighlight(id: string): Promise<Result<void>> {
  try {
    await db.delete(dayHighlightTable).where(eq(dayHighlightTable.id, id));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function assignTag(
  highlightId: string,
  tagId: string | null
): Promise<Result<void>> {
  try {
    await db
      .update(dayHighlightTable)
      .set({ tag_id: tagId })
      .where(eq(dayHighlightTable.id, highlightId));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function listTags(): Promise<Result<Tag[]>> {
  try {
    const rows = await db.select().from(tagTable);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeTag(tag: Tag): Promise<Result<void>> {
  try {
    await db
      .insert(tagTable)
      .values(tag)
      .onConflictDoUpdate({
        target: tagTable.id,
        set: { name: tag.name, color: tag.color },
      });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function deleteTag(id: string): Promise<Result<void>> {
  try {
    await db.delete(tagTable).where(eq(tagTable.id, id));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// One transaction, so a write between reads cannot tear the three tables apart.
export async function exportHighlightTables(): Promise<
  Result<HighlightTables>
> {
  try {
    const tables = await db.transaction(async tx => {
      const tags = await tx.select().from(tagTable);
      const highlights = await tx.select().from(dayHighlightTable);
      const positions = await tx.select().from(dayHighlightPositionTable);
      return { tags, highlights, positions };
    });
    return ok(tables);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Throws instead of returning a Result: the caller supplies the transaction,
// and a throw is what rolls it back. Tags go in first because a highlight
// references one.
export async function replaceHighlightTables(
  tables: HighlightTables,
  tx: Transaction
): Promise<void> {
  await tx.delete(dayHighlightPositionTable);
  await tx.delete(dayHighlightTable);
  await tx.delete(tagTable);

  await insertInBatches(tables.tags, batch =>
    tx.insert(tagTable).values(batch)
  );
  await insertInBatches(tables.highlights, batch =>
    tx.insert(dayHighlightTable).values(batch)
  );
  await insertInBatches(tables.positions, batch =>
    tx.insert(dayHighlightPositionTable).values(batch)
  );
}
