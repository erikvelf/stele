export type MarkdownFormat =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'quote';

export interface TextSelection {
  start: number;
  end: number;
}

export interface FormattedText {
  text: string;
  selection: TextSelection;
}

const WRAP_MARKERS = new Map<MarkdownFormat, string>([
  ['bold', '**'],
  ['italic', '_'],
  ['strikethrough', '~~'],
  ['code', '`'],
]);

const LINE_PREFIXES = new Map<MarkdownFormat, string>([
  ['heading1', '# '],
  ['heading2', '## '],
  ['heading3', '### '],
  ['bullet', '- '],
  ['quote', '> '],
]);

// One heading level replaces another, so the longest match is stripped first.
const HEADING_PREFIXES = ['### ', '## ', '# '];

export const MARKDOWN_FORMATS: readonly MarkdownFormat[] = [
  ...WRAP_MARKERS.keys(),
  ...LINE_PREFIXES.keys(),
];

interface LineBounds {
  start: number;
  end: number;
}

interface WrappedSpan {
  openStart: number;
  innerStart: number;
  innerEnd: number;
  closeEnd: number;
}

function lineBoundsAt(text: string, index: number): LineBounds {
  const previousBreak = index > 0 ? text.lastIndexOf('\n', index - 1) : -1;
  const nextBreak = text.indexOf('\n', index);

  return {
    start: previousBreak + 1,
    end: nextBreak < 0 ? text.length : nextBreak,
  };
}

function wrappedSpans(line: string, marker: string): WrappedSpan[] {
  const spans: WrappedSpan[] = [];
  let cursor = 0;

  for (;;) {
    const openStart = line.indexOf(marker, cursor);
    if (openStart < 0) {
      return spans;
    }

    const innerStart = openStart + marker.length;
    const innerEnd = line.indexOf(marker, innerStart);
    if (innerEnd < 0) {
      return spans;
    }

    const closeEnd = innerEnd + marker.length;
    spans.push({ openStart, innerStart, innerEnd, closeEnd });
    cursor = closeEnd;
  }
}

// A span counts as the one that holds the selection when the selection sits
// inside its markers, or when it covers the span together with them.
function enclosingSpan(
  line: string,
  marker: string,
  start: number,
  end: number
): WrappedSpan | null {
  const holds = (span: WrappedSpan) =>
    (start >= span.innerStart && end <= span.innerEnd) ||
    (start === span.openStart && end === span.closeEnd);

  return wrappedSpans(line, marker).find(holds) ?? null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function removeWrap(
  text: string,
  selection: TextSelection,
  lineStart: number,
  span: WrappedSpan,
  markerLength: number
): FormattedText {
  const openStart = lineStart + span.openStart;
  const innerStart = lineStart + span.innerStart;
  const innerEnd = lineStart + span.innerEnd;
  const closeEnd = lineStart + span.closeEnd;

  const stripped =
    text.slice(0, openStart) +
    text.slice(innerStart, innerEnd) +
    text.slice(closeEnd);
  const shift = (offset: number) =>
    clamp(offset - markerLength, openStart, innerEnd - markerLength);

  return {
    text: stripped,
    selection: { start: shift(selection.start), end: shift(selection.end) },
  };
}

function insertWrap(
  text: string,
  selection: TextSelection,
  marker: string
): FormattedText {
  const wrapped =
    text.slice(0, selection.start) +
    marker +
    text.slice(selection.start, selection.end) +
    marker +
    text.slice(selection.end);

  return {
    text: wrapped,
    selection: {
      start: selection.start + marker.length,
      end: selection.end + marker.length,
    },
  };
}

function applyWrap(
  text: string,
  selection: TextSelection,
  marker: string
): FormattedText {
  const bounds = lineBoundsAt(text, selection.start);
  const line = text.slice(bounds.start, bounds.end);
  const span = enclosingSpan(
    line,
    marker,
    selection.start - bounds.start,
    selection.end - bounds.start
  );

  if (span === null) {
    return insertWrap(text, selection, marker);
  }
  return removeWrap(text, selection, bounds.start, span, marker.length);
}

function selectedLines(text: string, selection: TextSelection): LineBounds {
  return {
    start: lineBoundsAt(text, selection.start).start,
    end: lineBoundsAt(text, selection.end).end,
  };
}

function withoutHeading(line: string): string {
  const heading = HEADING_PREFIXES.find(prefix => line.startsWith(prefix));
  return heading === undefined ? line : line.slice(heading.length);
}

function prefixLine(line: string, prefix: string): string {
  const bare = HEADING_PREFIXES.includes(prefix) ? withoutHeading(line) : line;
  return bare.startsWith(prefix) ? bare : prefix + bare;
}

function applyPrefix(
  text: string,
  selection: TextSelection,
  prefix: string
): FormattedText {
  const bounds = selectedLines(text, selection);
  const block = text.slice(bounds.start, bounds.end);
  const lines = block.split('\n');
  const strip = lines.every(line => line.startsWith(prefix));
  const prefixed = lines.map(line =>
    strip ? line.slice(prefix.length) : prefixLine(line, prefix)
  );

  const nextBlock = prefixed.join('\n');
  const firstLineDelta = (prefixed[0]?.length ?? 0) - (lines[0]?.length ?? 0);
  const blockDelta = nextBlock.length - block.length;

  return {
    text: text.slice(0, bounds.start) + nextBlock + text.slice(bounds.end),
    selection: {
      start: Math.max(bounds.start, selection.start + firstLineDelta),
      end: Math.max(bounds.start, selection.end + blockDelta),
    },
  };
}

export function applyFormat(
  text: string,
  selection: TextSelection,
  format: MarkdownFormat
): FormattedText {
  const marker = WRAP_MARKERS.get(format);
  if (marker !== undefined) {
    return applyWrap(text, selection, marker);
  }

  const prefix = LINE_PREFIXES.get(format);
  if (prefix !== undefined) {
    return applyPrefix(text, selection, prefix);
  }

  return { text, selection };
}

function isWrapActive(
  text: string,
  selection: TextSelection,
  marker: string
): boolean {
  const bounds = lineBoundsAt(text, selection.start);

  return (
    enclosingSpan(
      text.slice(bounds.start, bounds.end),
      marker,
      selection.start - bounds.start,
      selection.end - bounds.start
    ) !== null
  );
}

function isPrefixActive(
  text: string,
  selection: TextSelection,
  prefix: string
): boolean {
  const bounds = selectedLines(text, selection);

  return text
    .slice(bounds.start, bounds.end)
    .split('\n')
    .every(line => line.startsWith(prefix));
}

export function activeFormats(
  text: string,
  selection: TextSelection
): readonly MarkdownFormat[] {
  const wrapped = [...WRAP_MARKERS].filter(([, marker]) =>
    isWrapActive(text, selection, marker)
  );
  const prefixed = [...LINE_PREFIXES].filter(([, prefix]) =>
    isPrefixActive(text, selection, prefix)
  );

  return [...wrapped, ...prefixed].map(([format]) => format);
}
