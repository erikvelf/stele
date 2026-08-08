import { startOfDay } from 'date-fns';
import { and, count, desc, eq, gte, lt, lte } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db, insertInBatches } from '@/modules/db';
import type { Transaction } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { JOURNAL_LIST_PAGE_SIZE } from './constants';
import { dayRangesSchema, journalNoteTable } from './schema';
import type { DayRanges, JournalNote } from './schema';

export async function readJournalNote(
  id: string
): Promise<Result<JournalNote | null>> {
  try {
    const [row] = await db
      .select()
      .from(journalNoteTable)
      .where(eq(journalNoteTable.id, id));
    return ok(row ?? null);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeJournalNote(
  note: JournalNote
): Promise<Result<void>> {
  try {
    await db
      .insert(journalNoteTable)
      .values(note)
      .onConflictDoUpdate({
        target: journalNoteTable.id,
        set: {
          text: note.text,
          start_timestamp: note.start_timestamp,
          end_timestamp: note.end_timestamp,
        },
      });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function deleteJournalNote(id: string): Promise<Result<void>> {
  try {
    await db.delete(journalNoteTable).where(eq(journalNoteTable.id, id));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function readDayRanges(): Promise<Result<DayRanges>> {
  try {
    const rows = await db
      .select({
        id: journalNoteTable.id,
        start_timestamp: journalNoteTable.start_timestamp,
        end_timestamp: journalNoteTable.end_timestamp,
      })
      .from(journalNoteTable);
    return ok(dayRangesSchema.parse(rows));
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

interface JournalNoteCounts {
  year: number;
  total: number;
}

export async function countJournalNotes(
  yearStart: number
): Promise<Result<JournalNoteCounts>> {
  try {
    const [totalRow] = await db
      .select({ value: count() })
      .from(journalNoteTable);

    const [yearRow] = await db
      .select({ value: count() })
      .from(journalNoteTable)
      .where(gte(journalNoteTable.start_timestamp, yearStart));

    return ok({
      year: yearRow?.value ?? 0,
      total: totalRow?.value ?? 0,
    });
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// `before` is an exclusive start_timestamp cursor for the next older page.
export async function listJournalNotes(
  before?: number,
  limit: number = JOURNAL_LIST_PAGE_SIZE
): Promise<Result<JournalNote[]>> {
  try {
    const rows = await db
      .select()
      .from(journalNoteTable)
      .where(
        before === undefined
          ? undefined
          : lt(journalNoteTable.start_timestamp, before)
      )
      .orderBy(desc(journalNoteTable.start_timestamp))
      .limit(limit);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function readJournalNoteForDate(
  timestamp: number
): Promise<Result<JournalNote | null>> {
  try {
    const dayStart = startOfDay(new Date(timestamp)).getTime();
    const [row] = await db
      .select()
      .from(journalNoteTable)
      .where(
        and(
          lte(journalNoteTable.start_timestamp, dayStart),
          gte(journalNoteTable.end_timestamp, dayStart)
        )
      );
    return ok(row ?? null);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function exportJournalNotes(): Promise<Result<JournalNote[]>> {
  try {
    const rows = await db.select().from(journalNoteTable);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function replaceJournalNotes(
  notes: readonly JournalNote[],
  tx: Transaction
): Promise<void> {
  await tx.delete(journalNoteTable);
  await insertInBatches(notes, batch =>
    tx.insert(journalNoteTable).values(batch)
  );
}
