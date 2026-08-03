import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

// A label a highlight can carry. Unique by name: two tags with the same
// name and different colours would leave no way to say which is "the" tag.
export const tagTable = sqliteTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const tagSchema = createSelectSchema(tagTable);
export type Tag = z.infer<typeof tagSchema>;

// One line struck off a note. Carries at most one tag — deleting that tag
// clears the reference rather than the highlight.
export const dayHighlightTable = sqliteTable('day_highlight', {
  id: text('id').primaryKey(),
  note_id: text('note_id').notNull(),
  text: text('text').notNull(),
  tag_id: text('tag_id').references(() => tagTable.id, {
    onDelete: 'set null',
  }),
});

export const dayHighlightSchema = createSelectSchema(dayHighlightTable);
export type DayHighlight = z.infer<typeof dayHighlightSchema>;

// Where a highlight sits among its note's highlights.
export const dayHighlightPositionTable = sqliteTable('day_highlight_position', {
  highlight_id: text('highlight_id')
    .primaryKey()
    .references(() => dayHighlightTable.id, { onDelete: 'cascade' }),
  note_id: text('note_id').notNull(),
  position: integer('position').notNull(),
});

export const dayHighlightPositionSchema = createSelectSchema(dayHighlightPositionTable);
export type DayHighlightPosition = z.infer<typeof dayHighlightPositionSchema>;
