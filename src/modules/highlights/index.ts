export { tagSchema, dayHighlightSchema, dayHighlightPositionSchema } from './schema';
export type { Tag, DayHighlight, DayHighlightPosition } from './schema';
export {
  assignTag,
  countHighlights,
  deleteHighlight,
  deleteTag,
  exportHighlightTables,
  listHighlights,
  listHighlightsForNotes,
  listTags,
  reorderHighlights,
  replaceHighlightTables,
  writeHighlight,
  writeTag,
} from './queries';
export type { HighlightTables } from './types';
