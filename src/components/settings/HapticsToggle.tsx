import { useState } from 'react';
import { List, Switch } from 'react-native-paper';

import { useTranslation } from '@/hooks/useTranslation';
import { haptics } from '@/modules/haptics';
import { readHaptics, writeHaptics } from '@/modules/settings';

export function HapticsToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(() => readHaptics().enabled);

  const toggle = (next: boolean) => {
    setEnabled(next);
    writeHaptics({ enabled: next });
    haptics.commit();
  };

  return (
    <List.Item
      title={t('appearance.haptics.title')}
      description={t('appearance.haptics.description')}
      left={props => <List.Icon {...props} icon="vibrate" />}
      right={({ style }) => (
        <Switch style={style} value={enabled} onValueChange={toggle} />
      )}
    />
  );
}
