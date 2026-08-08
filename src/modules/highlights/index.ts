export {
  tagSchema,
  dayHighlightSchema,
  dayHighlightPositionSchema,
} from './schema';
export type { Tag, DayHighlight, DayHighlightPosition } from './schema';
export {
  assignTag,
  countHighlights,
  countHighlightsByJournalNote,
  deleteHighlight,
  deleteTag,
  exportHighlightTables,
  listHighlights,
  listHighlightsForJournalNotes,
  listTags,
  reorderHighlights,
  replaceHighlightTables,
  writeHighlight,
  writeTag,
} from './queries';
export type { HighlightTables } from './types';
