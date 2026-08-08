import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

export const REFLECTION_KINDS = ['week', 'month', 'year'] as const;

// A free-text note about a period rather than about a day — the first shape
// in the app keyed to a stretch of calendar instead of to a note. The start
// timestamp is always a period boundary (start of week, month or year), so a
// period has exactly one reflection and the pair identifies it.
export const reflectionTable = sqliteTable(
  'reflection',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: REFLECTION_KINDS }).notNull(),
    period_start: integer('period_start').notNull(),
    text: text('text').notNull(),
  },
  table => [
    uniqueIndex('reflection_kind_period_start').on(
      table.kind,
      table.period_start
    ),
  ]
);

export const reflectionSchema = createSelectSchema(reflectionTable);
export type Reflection = z.infer<typeof reflectionSchema>;
export type ReflectionKind = (typeof REFLECTION_KINDS)[number];
