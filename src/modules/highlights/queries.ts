import { asc, count, eq, max } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { dayHighlightPositionTable, dayHighlightTable, tagTable } from './schema';
import type { DayHighlight, Tag } from './schema';

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
