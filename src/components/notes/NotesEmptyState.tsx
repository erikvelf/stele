import { EmptyState } from '@/components/shared';
import { useTranslation } from '@/hooks/useTranslation';

export function NotesEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      emoji="🪨"
      title={t('notes.empty.title')}
      subtitle={t('notes.empty.subtitle')}
    />
  );
}
