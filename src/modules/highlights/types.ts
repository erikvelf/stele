import type { DayHighlight, DayHighlightPosition, Tag } from './schema';

// Every row the highlights domain owns, across its three tables.
export interface HighlightTables {
  tags: Tag[];
  highlights: DayHighlight[];
  positions: DayHighlightPosition[];
}
