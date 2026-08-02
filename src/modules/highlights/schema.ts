import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
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

// One line struck off a note.
export const dayHighlightTable = sqliteTable('day_highlight', {
  id: text('id').primaryKey(),
  note_id: text('note_id').notNull(),
  text: text('text').notNull(),
});

export const dayHighlightSchema = createSelectSchema(dayHighlightTable);
export type DayHighlight = z.infer<typeof dayHighlightSchema>;

// A highlight can carry more than one tag, and a tag can label more than
// one highlight.
export const dayHighlightTagTable = sqliteTable(
  'day_highlight_tag',
  {
    day_highlight_id: text('day_highlight_id')
      .notNull()
      .references(() => dayHighlightTable.id),
    tag_id: text('tag_id')
      .notNull()
      .references(() => tagTable.id),
  },
  table => [primaryKey({ columns: [table.day_highlight_id, table.tag_id] })]
);

export const dayHighlightTagSchema = createSelectSchema(dayHighlightTagTable);
export type DayHighlightTag = z.infer<typeof dayHighlightTagSchema>;
