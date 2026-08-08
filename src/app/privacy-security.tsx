import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { List, SegmentedButtons, Surface, Switch } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { haptics } from '@/modules/haptics';
import {
  applyPrivacyProtection,
  readAppLock,
  readPrivacy,
  writeAppLock,
  writePrivacy,
} from '@/modules/settings';
import type { RelockIntervalMs } from '@/modules/settings';

const MS_PER_MINUTE = 60000;

const RELOCK_INTERVALS: RelockIntervalMs[] = [
  '0',
  '60000',
  '120000',
  '180000',
  '300000',
];

export default function PrivacySecurityScreen() {
  const { t } = useTranslation();
  const [appLock, setAppLock] = useState(readAppLock);
  const [privacy, setPrivacy] = useState(readPrivacy);

  const toggleHideInRecents = (hideInRecents: boolean) => {
    const next = { ...privacy, hideInRecents };
    setPrivacy(next);
    writePrivacy(next);
    applyPrivacyProtection(hideInRecents);
    haptics.commit();
  };

  const toggleAppLock = (enabled: boolean) => {
    const next = { ...appLock, enabled };
    setAppLock(next);
    writeAppLock(next);
    haptics.commit();
  };

  const setRelockInterval = (relockIntervalMs: RelockIntervalMs) => {
    const next = { ...appLock, relockIntervalMs };
    setAppLock(next);
    writeAppLock(next);
  };

  const relockIntervalButtons = RELOCK_INTERVALS.map(value => ({
    value,
    label: t('privacySecurity.relockMinutes', {
      count: Number(value) / MS_PER_MINUTE,
    }),
  }));

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Item
        title={t('privacySecurity.appLock.title')}
        description={t('privacySecurity.appLock.description')}
        left={props => <List.Icon {...props} icon="lock-outline" />}
        right={({ style }) => (
          <Switch
            style={style}
            value={appLock.enabled}
            onValueChange={toggleAppLock}
          />
        )}
      />
      {appLock.enabled ? (
        <SegmentedButtons
          style={styles.relockInterval}
          value={appLock.relockIntervalMs}
          onValueChange={value => setRelockInterval(value as RelockIntervalMs)}
          buttons={relockIntervalButtons}
        />
      ) : null}
      <List.Item
        title={t('privacySecurity.hideInRecents.title')}
        description={t('privacySecurity.hideInRecents.description')}
        left={props => <List.Icon {...props} icon="eye-off-outline" />}
        right={({ style }) => (
          <Switch
            style={style}
            value={privacy.hideInRecents}
            onValueChange={toggleHideInRecents}
          />
        )}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  relockInterval: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
});
