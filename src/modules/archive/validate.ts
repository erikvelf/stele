import { dateDayRangesSchema } from '@/modules/notes';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import { ARCHIVE_ERRORS } from './constants';
import type { Archive, ArchiveNote } from './schema';
import { fromArchive } from './serialize';

export function formatIssues(error: { issues: readonly ZodIssue[] }): string {
  return error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
}

interface ZodIssue {
  path: readonly PropertyKey[];
  message: string;
}

function firstDuplicate(ids: readonly string[]): string | null {
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      return id;
    }
    seen.add(id);
  }

  return null;
}

function findDuplicateId(archive: Archive): string | null {
  const groups: [string, string[]][] = [
    ['folder', archive.folders.map(folder => folder.id)],
    ['tag', archive.tags.map(tag => tag.id)],
    ['note', archive.notes.map(note => note.id)],
    [
      'highlight',
      archive.notes.flatMap(note =>
        note.highlights.map(highlight => highlight.id)
      ),
    ],
    ['reflection', archive.reflections.map(reflection => reflection.id)],
  ];

  for (const [label, ids] of groups) {
    const duplicate = firstDuplicate(ids);
    if (duplicate !== null) {
      return `two ${label}s share the id "${duplicate}"`;
    }
  }

  return null;
}

function findDanglingTag(
  note: ArchiveNote,
  tagIds: ReadonlySet<string>
): string | null {
  for (const highlight of note.highlights) {
    const tagId = highlight.tagId ?? null;
    if (tagId !== null && !tagIds.has(tagId)) {
      return `highlight "${highlight.id}" points at missing tag "${tagId}"`;
    }
  }

  return null;
}

function findDanglingReference(archive: Archive): string | null {
  const folderIds = new Set(archive.folders.map(folder => folder.id));
  const tagIds = new Set(archive.tags.map(tag => tag.id));

  for (const note of archive.notes) {
    if (!folderIds.has(note.folderId)) {
      return `note "${note.id}" points at missing folder "${note.folderId}"`;
    }

    const danglingTag = findDanglingTag(note, tagIds);
    if (danglingTag !== null) {
      return danglingTag;
    }
  }

  return null;
}

// Runs before anything is written, so a bad file leaves the database untouched.
export function validateArchive(archive: Archive): Result<void> {
  const duplicate = findDuplicateId(archive);
  if (duplicate !== null) {
    return err(ARCHIVE_ERRORS.DUPLICATE_ID, duplicate);
  }

  const dangling = findDanglingReference(archive);
  if (dangling !== null) {
    return err(ARCHIVE_ERRORS.DANGLING_REFERENCE, dangling);
  }

  const { ranges } = fromArchive(archive).notes;
  const exclusive = dateDayRangesSchema.safeParse(ranges);
  if (!exclusive.success) {
    return err(ARCHIVE_ERRORS.OVERLAPPING_DAYS, formatIssues(exclusive.error));
  }

  return ok(undefined);
}
