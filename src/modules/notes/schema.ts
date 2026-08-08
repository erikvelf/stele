import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { folderTable } from '@/modules/folders/schema';

export const noteTable = sqliteTable('note', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  folder_id: text('folder_id')
    .notNull()
    .references(() => folderTable.id, { onDelete: 'cascade' }),
  created_at: integer('created_at').notNull(),
});

export const noteSchema = createSelectSchema(noteTable);
export type Note = z.infer<typeof noteSchema>;
