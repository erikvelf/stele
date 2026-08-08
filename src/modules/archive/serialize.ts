import type { Folder } from '@/modules/folders';
import type { DayHighlight, HighlightTables } from '@/modules/highlights';
import type { JournalNote } from '@/modules/journal';
import type { Note } from '@/modules/notes';
import type { Reflection } from '@/modules/reflections';

import { ARCHIVE_SCHEMA_VERSION } from './constants';
import type {
  Archive,
  ArchiveHighlight,
  ArchiveJournalNote,
  ArchiveNote,
} from './schema';

export interface ArchiveTables {
  folders: Folder[];
  notes: Note[];
  journalNotes: JournalNote[];
  highlights: HighlightTables;
  reflections: Reflection[];
}

function groupHighlightsByNote(
  highlights: readonly DayHighlight[],
  positionByHighlight: ReadonlyMap<string, number>
): Map<string, ArchiveHighlight[]> {
  const byNote = new Map<string, ArchiveHighlight[]>();

  for (const highlight of highlights) {
    const forNote = byNote.get(highlight.journal_note_id) ?? [];
    forNote.push({
      id: highlight.id,
      text: highlight.text,
      tagId: highlight.tag_id,
      position: positionByHighlight.get(highlight.id) ?? forNote.length,
    });
    byNote.set(highlight.journal_note_id, forNote);
  }

  for (const forNote of byNote.values()) {
    forNote.sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
  }

  return byNote;
}

function toArchiveNote(note: Note): ArchiveNote {
  return {
    id: note.id,
    text: note.text,
    folderId: note.folder_id,
    createdAt: note.created_at,
  };
}

function toArchiveJournalNote(
  note: JournalNote,
  highlights: ArchiveHighlight[]
): ArchiveJournalNote {
  return {
    id: note.id,
    text: note.text,
    createdAt: note.created_at,
    dateRange: { start: note.start_timestamp, end: note.end_timestamp },
    highlights,
  };
}

export function toArchive(tables: ArchiveTables, exportedAt: number): Archive {
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
    notes: tables.notes.map(toArchiveNote),
    journalNotes: tables.journalNotes.map(note =>
      toArchiveJournalNote(note, highlightsByNote.get(note.id) ?? [])
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
  const { journalNotes } = archive;

  return {
    folders: archive.folders,
    notes: archive.notes.map(note => ({
      id: note.id,
      text: note.text,
      folder_id: note.folderId,
      created_at: note.createdAt,
    })),
    journalNotes: journalNotes.map(note => ({
      id: note.id,
      text: note.text,
      created_at: note.createdAt,
      start_timestamp: note.dateRange.start,
      end_timestamp: note.dateRange.end,
    })),
    highlights: {
      tags: archive.tags,
      highlights: journalNotes.flatMap(note =>
        note.highlights.map(highlight => ({
          id: highlight.id,
          journal_note_id: note.id,
          text: highlight.text,
          tag_id: highlight.tagId ?? null,
        }))
      ),
      positions: journalNotes.flatMap(note =>
        note.highlights.map((highlight, index) => ({
          highlight_id: highlight.id,
          journal_note_id: note.id,
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
