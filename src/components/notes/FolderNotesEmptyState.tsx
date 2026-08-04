import { EmptyState } from '@/components/shared';

export function FolderNotesEmptyState() {
  return (
    <EmptyState
      emoji="📜"
      title="This tavola is empty"
      subtitle="Tap the pencil to add its first nota."
    />
  );
}
