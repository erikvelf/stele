import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

// A named, coloured container of notes.
export const folderTable = sqliteTable('folder', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  emoji: text('emoji').notNull(),
});

export const folderSchema = createSelectSchema(folderTable);
export type Folder = z.infer<typeof folderSchema>;
