import { isBefore, startOfDay } from 'date-fns';
import { z } from 'zod';

// The primitive: source text. Everything else a note can have — a date, a
// folder — is a separate table linked by note_id, never a field here.
export const noteSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

// A note belongs to exactly one folder. Expressed as a link rather than a
// field on note so the primitive never grows a column for it.
export const noteFolderSchema = z.object({
  note_id: z.string().min(1),
  folder_id: z.string().min(1),
});

export type NoteFolder = z.infer<typeof noteFolderSchema>;

// A slot run in the journal: every note occupies a contiguous range of days,
// and a single-day note is just a range whose start and end share a day.
export const dateDayRangeSchema = z
  .object({
    id: z.string().min(1),
    note_id: z.string().min(1),
    start_timestamp: z.number().int(),
    end_timestamp: z.number().int(),
  })
  .refine(range => range.end_timestamp >= range.start_timestamp, {
    message: 'end_timestamp must not precede start_timestamp',
    path: ['end_timestamp'],
  });

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
