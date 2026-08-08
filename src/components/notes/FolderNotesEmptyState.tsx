import { EmptyState } from '@/components/shared';
import { useTranslation } from '@/hooks/useTranslation';

export function FolderNotesEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      emoji="📜"
      title={t('folderNotes.empty.title')}
      subtitle={t('folderNotes.empty.subtitle')}
    />
  );
}
