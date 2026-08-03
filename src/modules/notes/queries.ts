import { isAfter, startOfDay, subDays } from 'date-fns';
import { and, desc, eq, lt } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { NOTES_LIST_PAGE_SIZE } from './constants';
import {
  dateDayRangesSchema,
  dateDayRangeTable,
  noteFolderTable,
  noteTable,
} from './schema';
import type { DateDayRange, DateDayRanges, Note, NoteFolder } from './schema';
import type { FreeRun, NoteEntry } from './types';

export async function readNote(id: string): Promise<Result<Note | null>> {
  try {
    const [row] = await db
      .select()
      .from(noteTable)
      .where(eq(noteTable.id, id));
    return ok(row ?? null);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeNote(note: Note): Promise<Result<void>> {
  try {
    await db
      .insert(noteTable)
      .values(note)
      .onConflictDoUpdate({ target: noteTable.id, set: { text: note.text } });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Deletes the note's range and folder rows first; neither cascades.
export async function deleteNote(id: string): Promise<Result<void>> {
  try {
    await db.transaction(async tx => {
      await tx
        .delete(dateDayRangeTable)
        .where(eq(dateDayRangeTable.note_id, id));
      await tx.delete(noteFolderTable).where(eq(noteFolderTable.note_id, id));
      await tx.delete(noteTable).where(eq(noteTable.id, id));
    });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeNoteFolder(
  noteFolder: NoteFolder
): Promise<Result<void>> {
  try {
    await db
      .insert(noteFolderTable)
      .values(noteFolder)
      .onConflictDoUpdate({
        target: noteFolderTable.note_id,
        set: { folder_id: noteFolder.folder_id },
      });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function readDateDayRange(
  noteId: string
): Promise<Result<DateDayRange | null>> {
  try {
    const [row] = await db
      .select()
      .from(dateDayRangeTable)
      .where(eq(dateDayRangeTable.note_id, noteId));
    return ok(row ?? null);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeDateDayRange(
  range: DateDayRange
): Promise<Result<void>> {
  try {
    await db
      .insert(dateDayRangeTable)
      .values(range)
      .onConflictDoUpdate({
        target: dateDayRangeTable.id,
        set: {
          start_timestamp: range.start_timestamp,
          end_timestamp: range.end_timestamp,
        },
      });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function readDateDayRanges(): Promise<Result<DateDayRanges>> {
  try {
    const rows = await db.select().from(dateDayRangeTable);
    return ok(dateDayRangesSchema.parse(rows));
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// A page of a folder's dated notes, newest first. `before` is the exclusive
// cursor (an entry's start_timestamp) for fetching the next older page.
export async function listNoteEntries(
  folderId: string,
  before?: number,
  limit: number = NOTES_LIST_PAGE_SIZE
): Promise<Result<NoteEntry[]>> {
  try {
    const rows = await db
      .select({ note: noteTable, range: dateDayRangeTable })
      .from(dateDayRangeTable)
      .innerJoin(noteTable, eq(dateDayRangeTable.note_id, noteTable.id))
      .innerJoin(
        noteFolderTable,
        eq(noteFolderTable.note_id, noteTable.id)
      )
      .where(
        and(
          eq(noteFolderTable.folder_id, folderId),
          before === undefined
            ? undefined
            : lt(dateDayRangeTable.start_timestamp, before)
        )
      )
      .orderBy(desc(dateDayRangeTable.start_timestamp))
      .limit(limit);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Pure: how far a range starting at `day` may extend before it would cover a
// day another note already occupies. `end: null` means nothing is in the way.
export function findFreeRunFrom(day: Date, ranges: DateDayRanges): FreeRun {
  const start = startOfDay(day);

  const nextOccupiedStart = ranges
    .map(range => startOfDay(new Date(range.start_timestamp)))
    .filter(occupiedStart => isAfter(occupiedStart, start))
    .sort((a, b) => a.getTime() - b.getTime())
    .at(0);

  return {
    start,
    end: nextOccupiedStart ? subDays(nextOccupiedStart, 1) : null,
  };
}
