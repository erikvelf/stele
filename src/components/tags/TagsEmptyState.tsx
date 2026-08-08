import { EmptyState } from '@/components/shared';
import { useTranslation } from '@/hooks/useTranslation';

export function TagsEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      emoji="🏷️"
      title={t('tags.empty.title')}
      subtitle={t('tags.empty.subtitle')}
    />
  );
}
