import { z } from 'zod';

// A named, coloured container of notes. The journal is a folder like any
// other; nothing here marks it as such — that flag lives with the domain
// rule that reads it, not on every row.
export const folderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  emoji: z.string().min(1),
});

export type Folder = z.infer<typeof folderSchema>;
