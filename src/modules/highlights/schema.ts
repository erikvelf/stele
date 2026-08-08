import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { journalNoteTable } from '@/modules/journal/schema';

export const tagTable = sqliteTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const tagSchema = createSelectSchema(tagTable);
export type Tag = z.infer<typeof tagSchema>;

export const dayHighlightTable = sqliteTable('day_highlight', {
  id: text('id').primaryKey(),
  journal_note_id: text('journal_note_id')
    .notNull()
    .references(() => journalNoteTable.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  tag_id: text('tag_id').references(() => tagTable.id, {
    onDelete: 'set null',
  }),
});

export const dayHighlightSchema = createSelectSchema(dayHighlightTable);
export type DayHighlight = z.infer<typeof dayHighlightSchema>;

export const dayHighlightPositionTable = sqliteTable('day_highlight_position', {
  highlight_id: text('highlight_id')
    .primaryKey()
    .references(() => dayHighlightTable.id, { onDelete: 'cascade' }),
  journal_note_id: text('journal_note_id').notNull(),
  position: integer('position').notNull(),
});

export const dayHighlightPositionSchema = createSelectSchema(
  dayHighlightPositionTable
);
export type DayHighlightPosition = z.infer<typeof dayHighlightPositionSchema>;
