import type { Folder } from '@/modules/folders';
import type { DayHighlight, HighlightTables } from '@/modules/highlights';
import type { Note, NoteTables } from '@/modules/notes';
import type { Reflection } from '@/modules/reflections';

import { ARCHIVE_SCHEMA_VERSION } from './constants';
import type { Archive, ArchiveHighlight, ArchiveNote } from './schema';

export interface ArchiveTables {
  folders: Folder[];
  notes: NoteTables;
  highlights: HighlightTables;
  reflections: Reflection[];
}

// A range row needs an id the file does not carry. Deriving it from the note
// keeps an export of unchanged data byte-identical between runs.
export function dateRangeIdFor(noteId: string): string {
  return `${noteId}-range`;
}

function groupHighlightsByNote(
  highlights: readonly DayHighlight[],
  positionByHighlight: ReadonlyMap<string, number>
): Map<string, ArchiveHighlight[]> {
  const byNote = new Map<string, ArchiveHighlight[]>();

  for (const highlight of highlights) {
    const forNote = byNote.get(highlight.note_id) ?? [];
    forNote.push({
      id: highlight.id,
      text: highlight.text,
      tagId: highlight.tag_id,
      position: positionByHighlight.get(highlight.id) ?? forNote.length,
    });
    byNote.set(highlight.note_id, forNote);
  }

  for (const forNote of byNote.values()) {
    forNote.sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
  }

  return byNote;
}

function toArchiveNote(
  note: Note,
  folderId: string | undefined,
  createdAt: number | undefined,
  range: { start_timestamp: number; end_timestamp: number } | undefined,
  highlights: ArchiveHighlight[]
): ArchiveNote {
  if (folderId === undefined || createdAt === undefined) {
    throw new Error(`note ${note.id} has no folder or no creation time`);
  }

  return {
    id: note.id,
    text: note.text,
    folderId,
    createdAt,
    dateRange:
      range === undefined
        ? undefined
        : { start: range.start_timestamp, end: range.end_timestamp },
    highlights,
  };
}

// Throws when the database contradicts itself, which the export must not hide.
export function toArchive(tables: ArchiveTables, exportedAt: number): Archive {
  const folderByNote = new Map(
    tables.notes.folders.map(row => [row.note_id, row.folder_id])
  );
  const createdByNote = new Map(
    tables.notes.created.map(row => [row.note_id, row.created_at])
  );
  const rangeByNote = new Map(
    tables.notes.ranges.map(row => [row.note_id, row])
  );
  const positionByHighlight = new Map(
    tables.highlights.positions.map(row => [row.highlight_id, row.position])
  );
  const highlightsByNote = groupHighlightsByNote(
    tables.highlights.highlights,
    positionByHighlight
  );

  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    exportedAt,
    folders: tables.folders,
    tags: tables.highlights.tags,
    notes: tables.notes.notes.map(note =>
      toArchiveNote(
        note,
        folderByNote.get(note.id),
        createdByNote.get(note.id),
        rangeByNote.get(note.id),
        highlightsByNote.get(note.id) ?? []
      )
    ),
    reflections: tables.reflections.map(reflection => ({
      id: reflection.id,
      kind: reflection.kind,
      periodStart: reflection.period_start,
      text: reflection.text,
    })),
  };
}

export function fromArchive(archive: Archive): ArchiveTables {
  return {
    folders: archive.folders,
    notes: {
      notes: archive.notes.map(note => ({ id: note.id, text: note.text })),
      folders: archive.notes.map(note => ({
        note_id: note.id,
        folder_id: note.folderId,
      })),
      created: archive.notes.map(note => ({
        note_id: note.id,
        created_at: note.createdAt,
      })),
      ranges: archive.notes.flatMap(note =>
        note.dateRange === undefined
          ? []
          : [
              {
                id: dateRangeIdFor(note.id),
                note_id: note.id,
                start_timestamp: note.dateRange.start,
                end_timestamp: note.dateRange.end,
              },
            ]
      ),
    },
    highlights: {
      tags: archive.tags,
      highlights: archive.notes.flatMap(note =>
        note.highlights.map(highlight => ({
          id: highlight.id,
          note_id: note.id,
          text: highlight.text,
          tag_id: highlight.tagId ?? null,
        }))
      ),
      positions: archive.notes.flatMap(note =>
        note.highlights.map((highlight, index) => ({
          highlight_id: highlight.id,
          note_id: note.id,
          position: highlight.position ?? index,
        }))
      ),
    },
    reflections: archive.reflections.map(reflection => ({
      id: reflection.id,
      kind: reflection.kind,
      period_start: reflection.periodStart,
      text: reflection.text,
    })),
  };
}
