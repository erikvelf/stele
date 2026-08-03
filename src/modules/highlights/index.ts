export { tagSchema, dayHighlightSchema, dayHighlightPositionSchema } from './schema';
export type { Tag, DayHighlight, DayHighlightPosition } from './schema';
export {
  assignTag,
  countHighlights,
  deleteHighlight,
  deleteTag,
  listHighlights,
  listTags,
  reorderHighlights,
  writeHighlight,
  writeTag,
} from './queries';
