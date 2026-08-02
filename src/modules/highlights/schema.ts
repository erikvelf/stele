import { z } from 'zod';

// A label a highlight can carry. Unique by name: two tags with the same
// name and different colours would leave no way to say which is "the" tag.
export const tagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
});

export type Tag = z.infer<typeof tagSchema>;

// One line struck off a note.
export const dayHighlightSchema = z.object({
  id: z.string().min(1),
  note_id: z.string().min(1),
  text: z.string().min(1),
});

export type DayHighlight = z.infer<typeof dayHighlightSchema>;

// A highlight can carry more than one tag, and a tag can label more than
// one highlight.
export const dayHighlightTagSchema = z.object({
  day_highlight_id: z.string().min(1),
  tag_id: z.string().min(1),
});

export type DayHighlightTag = z.infer<typeof dayHighlightTagSchema>;
