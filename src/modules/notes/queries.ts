import { desc, eq } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db, insertInBatches } from '@/modules/db';
import type { Transaction } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { noteTable } from './schema';
import type { Note } from './schema';

export async function readNote(id: string): Promise<Result<Note | null>> {
  try {
    const [row] = await db.select().from(noteTable).where(eq(noteTable.id, id));
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
      .onConflictDoUpdate({
        target: noteTable.id,
        set: { text: note.text, folder_id: note.folder_id },
      });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function moveNoteToFolder(
  id: string,
  folderId: string
): Promise<Result<void>> {
  try {
    await db
      .update(noteTable)
      .set({ folder_id: folderId })
      .where(eq(noteTable.id, id));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function deleteNote(id: string): Promise<Result<void>> {
  try {
    await db.delete(noteTable).where(eq(noteTable.id, id));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function listFolderNotes(
  folderId: string
): Promise<Result<Note[]>> {
  try {
    const rows = await db
      .select()
      .from(noteTable)
      .where(eq(noteTable.folder_id, folderId))
      .orderBy(desc(noteTable.created_at));
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function deleteFolderNotes(
  folderId: string
): Promise<Result<void>> {
  try {
    await db.delete(noteTable).where(eq(noteTable.folder_id, folderId));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function exportNotes(): Promise<Result<Note[]>> {
  try {
    const rows = await db.select().from(noteTable);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function replaceNotes(
  notes: readonly Note[],
  tx: Transaction
): Promise<void> {
  await tx.delete(noteTable);
  await insertInBatches(notes, batch => tx.insert(noteTable).values(batch));
}
