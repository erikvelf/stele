import type { LayerEntry, TagCount } from './types';

const UNTAGGED = '';

function keyOf(tagId: string | null): string {
  return tagId ?? UNTAGGED;
}

// How often each tag appears across the given highlights, most frequent
// first. Untagged highlights are counted together under a null tag so the
// digest can report them rather than silently dropping them.
export function countByTag(entries: readonly LayerEntry[]): TagCount[] {
  const totals = new Map<string, number>();

  entries.forEach(entry => {
    const key = keyOf(entry.tagId);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  });

  return [...totals.entries()]
    .map(([key, count]) => ({ tagId: key === UNTAGGED ? null : key, count }))
    .sort((a, b) => b.count - a.count);
}
