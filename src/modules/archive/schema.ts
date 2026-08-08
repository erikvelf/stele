import { z } from 'zod';

import { REFLECTION_KINDS } from '@/modules/reflections';
import { allSettingsSchema } from '@/modules/settings';

// The published shape of an export file. It is written out by hand rather than
// derived from the database tables, so that renaming a column breaks the
// mapping in serialize.ts instead of silently changing the format.

const identifierSchema = z.string().min(1);

export const archiveFolderSchema = z.object({
  id: identifierSchema,
  name: z.string(),
  color: z.string(),
  emoji: z.string(),
});

export const archiveTagSchema = z.object({
  id: identifierSchema,
  name: z.string().min(1),
  color: z.string(),
});

export const archiveHighlightSchema = z.object({
  id: identifierSchema,
  text: z.string(),
  tagId: identifierSchema.nullish(),
  // Absent means "use the order of the array".
  position: z.number().int().nonnegative().optional(),
});

export const archiveDateRangeSchema = z
  .object({
    start: z.number().int(),
    end: z.number().int(),
  })
  .refine(range => range.end >= range.start, {
    message: 'end must not precede start',
    path: ['end'],
  });

// A folder note. It carries no date and no highlights — those belong to the
// diario, which the file keeps in its own array.
export const archiveNoteSchema = z.object({
  id: identifierSchema,
  text: z.string(),
  folderId: identifierSchema,
  createdAt: z.number().int(),
});

// A diario entry. It names no folder: the day it covers is what places it.
export const archiveJournalNoteSchema = z.object({
  id: identifierSchema,
  text: z.string(),
  createdAt: z.number().int(),
  dateRange: archiveDateRangeSchema,
  highlights: z.array(archiveHighlightSchema).default([]),
});

export const archiveReflectionSchema = z.object({
  id: identifierSchema,
  kind: z.enum(REFLECTION_KINDS),
  periodStart: z.number().int(),
  text: z.string(),
});

export const archiveSchema = z.object({
  schemaVersion: z.number().int(),
  // Written for the reader; ignored on import.
  exportedAt: z.number().int().optional(),
  folders: z.array(archiveFolderSchema),
  tags: z.array(archiveTagSchema),
  notes: z.array(archiveNoteSchema),
  journalNotes: z.array(archiveJournalNoteSchema),
  reflections: z.array(archiveReflectionSchema).default([]),
});

export const settingsArchiveSchema = z.object({
  schemaVersion: z.number().int(),
  exportedAt: z.number().int().optional(),
  settings: allSettingsSchema,
});

export type ArchiveFolder = z.infer<typeof archiveFolderSchema>;
export type ArchiveTag = z.infer<typeof archiveTagSchema>;
export type ArchiveHighlight = z.infer<typeof archiveHighlightSchema>;
export type ArchiveNote = z.infer<typeof archiveNoteSchema>;
export type ArchiveJournalNote = z.infer<typeof archiveJournalNoteSchema>;
export type ArchiveReflection = z.infer<typeof archiveReflectionSchema>;
export type Archive = z.infer<typeof archiveSchema>;
export type SettingsArchive = z.infer<typeof settingsArchiveSchema>;
