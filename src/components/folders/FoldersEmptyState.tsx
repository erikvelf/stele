import { EmptyState } from '@/components/shared';
import { useTranslation } from '@/hooks/useTranslation';

export function FoldersEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      emoji="🏛️"
      title={t('folders.empty.title')}
      subtitle={t('folders.empty.subtitle')}
    />
  );
}
