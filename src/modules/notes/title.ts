const HEADING_PATTERN = /^#[ \t]+(.+)$/;
const FENCE_PATTERN = /^\s*(?:```|~~~)/;

interface Heading {
  text: string;
  line: number;
}

// A `#` inside a fenced code block is a comment, not a heading, so the scan
// tracks the fences it crosses.
function findHeading(lines: string[]): Heading | null {
  let insideFence = false;
  for (const [line, content] of lines.entries()) {
    if (FENCE_PATTERN.test(content)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) {
      continue;
    }
    const match = HEADING_PATTERN.exec(content);
    if (match) {
      return { text: match[1].trim(), line };
    }
  }
  return null;
}

export function titleOf(text: string): string | null {
  return findHeading(text.split('\n'))?.text ?? null;
}

export function bodyOf(text: string): string {
  const lines = text.split('\n');
  const heading = findHeading(lines);
  if (heading === null) {
    return text;
  }
  return lines.filter((_, line) => line !== heading.line).join('\n');
}
