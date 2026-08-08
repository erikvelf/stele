import { isBefore, startOfDay } from 'date-fns';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const journalNoteTable = sqliteTable('journal_note', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  created_at: integer('created_at').notNull(),
  start_timestamp: integer('start_timestamp').notNull(),
  end_timestamp: integer('end_timestamp').notNull(),
});

export const journalNoteSchema = createSelectSchema(journalNoteTable).refine(
  note => note.end_timestamp >= note.start_timestamp,
  {
    message: 'end_timestamp must not precede start_timestamp',
    path: ['end_timestamp'],
  }
);

export type JournalNote = z.infer<typeof journalNoteSchema>;

// `id` is the journal note's id.
export const dayRangeSchema = z
  .object({
    id: z.string(),
    start_timestamp: z.number().int(),
    end_timestamp: z.number().int(),
  })
  .refine(range => range.end_timestamp >= range.start_timestamp, {
    message: 'end_timestamp must not precede start_timestamp',
    path: ['end_timestamp'],
  });

export type DayRange = z.infer<typeof dayRangeSchema>;

export const dayRangesSchema = z
  .array(dayRangeSchema)
  .superRefine((ranges, ctx) => {
    const ordered = [...ranges].sort(
      (a, b) => a.start_timestamp - b.start_timestamp
    );

    ordered.forEach((range, index) => {
      const previous = ordered.at(index - 1);
      if (index === 0 || !previous) {
        return;
      }
      const startsAfter = isBefore(
        startOfDay(new Date(previous.end_timestamp)),
        startOfDay(new Date(range.start_timestamp))
      );
      if (!startsAfter) {
        ctx.addIssue({
          code: 'custom',
          message: `entries ${previous.id} and ${range.id} cover the same day`,
          path: [ranges.indexOf(range), 'start_timestamp'],
        });
      }
    });
  })
  .brand<'DayRanges'>();

export type DayRanges = z.infer<typeof dayRangesSchema>;
