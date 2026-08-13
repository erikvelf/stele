import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

export const REFLECTION_KINDS = ['week', 'month', 'year'] as const;

// A free-text note about a period rather than about a day — the first shape
// in the app keyed to a stretch of calendar instead of to a note. The start
// timestamp is always a period boundary (start of week, month or year), and
// the id is built from the pair, so the primary key is the only rule needed
// to give a period exactly one reflection.
export const reflectionTable = sqliteTable('reflection', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: REFLECTION_KINDS }).notNull(),
  period_start: integer('period_start').notNull(),
  text: text('text').notNull(),
});

export const reflectionSchema = createSelectSchema(reflectionTable);
export type Reflection = z.infer<typeof reflectionSchema>;
export type ReflectionKind = (typeof REFLECTION_KINDS)[number];
