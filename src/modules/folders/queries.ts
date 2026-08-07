import { eq } from 'drizzle-orm';

import { COMMON_ERRORS } from '@/constants/error-codes';
import { db, insertInBatches } from '@/modules/db';
import type { Transaction } from '@/modules/db';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { DEFAULT_JOURNAL_FOLDER } from './constants';
import { folderTable } from './schema';
import type { Folder } from './schema';

export async function readFolder(id: string): Promise<Result<Folder | null>> {
  try {
    const [row] = await db
      .select()
      .from(folderTable)
      .where(eq(folderTable.id, id));
    return ok(row ?? null);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function writeFolder(folder: Folder): Promise<Result<void>> {
  try {
    await db
      .insert(folderTable)
      .values(folder)
      .onConflictDoUpdate({
        target: folderTable.id,
        set: {
          name: folder.name,
          color: folder.color,
          emoji: folder.emoji,
        },
      });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function deleteFolder(id: string): Promise<Result<void>> {
  try {
    await db.delete(folderTable).where(eq(folderTable.id, id));
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function seedJournalFolder(): Promise<Result<void>> {
  try {
    await db
      .insert(folderTable)
      .values(DEFAULT_JOURNAL_FOLDER)
      .onConflictDoNothing({ target: folderTable.id });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

export async function listFolders(): Promise<Result<Folder[]>> {
  try {
    const rows = await db.select().from(folderTable);
    return ok(rows);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}

// Throws instead of returning a Result: the caller supplies the transaction,
// and a throw is what rolls it back.
export async function replaceFolders(
  folders: readonly Folder[],
  tx: Transaction
): Promise<void> {
  await tx.delete(folderTable);
  await insertInBatches(folders, batch => tx.insert(folderTable).values(batch));
}
