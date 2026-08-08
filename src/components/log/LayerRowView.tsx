import { ScagliaRow, TagDigest } from '@/components/highlights';
import type { TagDigestEntry } from '@/components/highlights';
import { PeriodRollingNotice, ReflectionField } from '@/components/reflections';
import { Header } from '@/components/shared';
import type { Tag } from '@/modules/highlights';
import type { LayerRow, TagCount } from '@/modules/log';
import type { Period } from '@/modules/types';

interface LayerRowViewProps {
  row: LayerRow;
  tags: Map<string, Tag>;
  reflectionText: string;
  onChangeReflection: (text: string) => void;
  onOpenNote: (noteId: string) => void;
  onOpenPeriod: (period: Period) => void;
}

function resolve(tags: Map<string, Tag>, tagId: string | null): Tag | null {
  return tagId === null ? null : (tags.get(tagId) ?? null);
}

function toDigestEntries(
  counts: readonly TagCount[],
  tags: Map<string, Tag>
): TagDigestEntry[] {
  return counts.map(entry => ({
    tag: resolve(tags, entry.tagId),
    count: entry.count,
  }));
}

// One flattened layer row, drawn. The switch is the only place the display
// union is interpreted; every branch below it takes plain values.
export function LayerRowView({
  row,
  tags,
  reflectionText,
  onChangeReflection,
  onOpenNote,
  onOpenPeriod,
}: LayerRowViewProps) {
  if (row.kind === 'header') {
    // Only a month opens into something finer; a week is already at the
    // resolution its scaglie are listed at.
    const onPress =
      row.period.kind === 'month' ? () => onOpenPeriod(row.period) : undefined;
    return (
      <Header period={row.period} variant={row.variant} onPress={onPress} />
    );
  }

  if (row.kind === 'reflection') {
    if (!row.isPeriodOver) {
      return <PeriodRollingNotice kind={row.period.kind} />;
    }
    return (
      <ReflectionField
        value={reflectionText}
        onChangeText={onChangeReflection}
      />
    );
  }

  if (row.kind === 'digest') {
    return <TagDigest entries={toDigestEntries(row.counts, tags)} />;
  }

  return (
    <ScagliaRow
      text={row.text}
      tag={resolve(tags, row.tagId)}
      onPress={() => onOpenNote(row.noteId)}
    />
  );
}
