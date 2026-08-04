import { isBefore, startOfDay } from 'date-fns';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// The primitive: source text. Everything else a note can have — a date, a
// folder — is a separate table linked by note_id, never a column here.
export const noteTable = sqliteTable('note', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
});

export const noteSchema = createSelectSchema(noteTable);
export type Note = z.infer<typeof noteSchema>;

// A note belongs to exactly one folder.
export const noteFolderTable = sqliteTable('note_folder', {
  note_id: text('note_id')
    .primaryKey()
    .references(() => noteTable.id),
  folder_id: text('folder_id').notNull(),
});

export const noteFolderSchema = createSelectSchema(noteFolderTable);
export type NoteFolder = z.infer<typeof noteFolderSchema>;

// When a note was created — separate from date_day_range, which only exists
// for notes the diario requires a date on. Every note gets one of these.
export const noteCreatedTable = sqliteTable('note_created', {
  note_id: text('note_id')
    .primaryKey()
    .references(() => noteTable.id),
  created_at: integer('created_at').notNull(),
});

export const noteCreatedSchema = createSelectSchema(noteCreatedTable);
export type NoteCreated = z.infer<typeof noteCreatedSchema>;

// A slot run in the journal: every note occupies a contiguous range of days,
// and a single-day note is just a range whose start and end share a day.
export const dateDayRangeTable = sqliteTable('date_day_range', {
  id: text('id').primaryKey(),
  note_id: text('note_id')
    .notNull()
    .unique()
    .references(() => noteTable.id),
  start_timestamp: integer('start_timestamp').notNull(),
  end_timestamp: integer('end_timestamp').notNull(),
});

export const dateDayRangeSchema = createSelectSchema(dateDayRangeTable).refine(
  range => range.end_timestamp >= range.start_timestamp,
  {
    message: 'end_timestamp must not precede start_timestamp',
    path: ['end_timestamp'],
  }
);

export type DateDayRange = z.infer<typeof dateDayRangeSchema>;

// Slots are exclusive: two notes never cover the same day. That is a property
// of the collection rather than of any single range, so it is checked here and
// the result is branded — a DateDayRanges can only come out of a parse.
export const dateDayRangesSchema = z
  .array(dateDayRangeSchema)
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
          message: `ranges ${previous.id} and ${range.id} cover the same day`,
          path: [ranges.indexOf(range), 'start_timestamp'],
        });
      }
    });
  })
  .brand<'DateDayRanges'>();

export type DateDayRanges = z.infer<typeof dateDayRangesSchema>;
