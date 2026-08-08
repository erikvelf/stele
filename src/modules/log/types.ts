import type { Period } from '@/modules/types';

// Which layer sits outermost. Each resolution wraps the one below it rather
// than replacing it: a week view is the day view under a week divider.
export type Resolution = 'day' | 'week' | 'month';

export type Direction = 'newest' | 'oldest';

// The calendar span a page covers. Empty weeks inside it still render, so the
// span is what the layers are built across — not merely the entries' extent.
export interface Span {
  start: Date;
  end: Date;
}

// One highlight, already paired with the days its note occupies. The log
// module never touches a note or a highlight table; callers map into this.
export interface LayerEntry {
  id: string;
  noteId: string;
  text: string;
  tagId: string | null;
  start: Date;
  end: Date;
}

export interface TagCount {
  tagId: string | null;
  count: number;
}

export type HeaderVariant = 'medium' | 'small';

// The flattened display list. Two levels of header cannot be expressed by a
// SectionList, so grouping is resolved here into one array of tagged rows.
export type LayerRow =
  | { kind: 'header'; id: string; period: Period; variant: HeaderVariant }
  // A reflection is only writable once its period has closed: you reflect on
  // a week that finished, not on one still happening.
  | { kind: 'reflection'; id: string; period: Period; isPeriodOver: boolean }
  | {
      kind: 'scaglia';
      id: string;
      noteId: string;
      text: string;
      tagId: string | null;
    }
  | { kind: 'digest'; id: string; period: Period; counts: TagCount[] };
