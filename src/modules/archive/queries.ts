import { COMMON_ERRORS } from '@/constants/error-codes';
import { db } from '@/modules/db';
import { listFolders, replaceFolders } from '@/modules/folders';
import {
  exportHighlightTables,
  replaceHighlightTables,
} from '@/modules/highlights';
import { exportNoteTables, replaceNoteTables } from '@/modules/notes';
import { listAllReflections, replaceReflections } from '@/modules/reflections';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import type { ArchiveTables } from './serialize';

export async function readArchiveTables(): Promise<Result<ArchiveTables>> {
  const folders = await listFolders();
  if (!folders.success) {
    return folders;
  }

  const notes = await exportNoteTables();
  if (!notes.success) {
    return notes;
  }

  const highlights = await exportHighlightTables();
  if (!highlights.success) {
    return highlights;
  }

  const reflections = await listAllReflections();
  if (!reflections.success) {
    return reflections;
  }

  return ok({
    folders: folders.data,
    notes: notes.data,
    highlights: highlights.data,
    reflections: reflections.data,
  });
}

// One transaction: either the whole archive lands or the database is untouched.
export async function writeArchiveTables(
  tables: ArchiveTables
): Promise<Result<void>> {
  try {
    await db.transaction(async tx => {
      await replaceFolders(tables.folders, tx);
      await replaceNoteTables(tables.notes, tx);
      await replaceHighlightTables(tables.highlights, tx);
      await replaceReflections(tables.reflections, tx);
    });
    return ok(undefined);
  } catch (cause) {
    return err(COMMON_ERRORS.UNDEFINED, String(cause));
  }
}
