import { EmptyState } from '@/components/shared';

export function TagsEmptyState() {
  return (
    <EmptyState
      emoji="🏷️"
      title="Nessun tag ancora"
      subtitle="Tocca più per creare il tuo primo tag."
    />
  );
}
