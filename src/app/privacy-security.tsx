import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { List, SegmentedButtons, Surface, Switch } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import {
  applyPrivacyProtection,
  readAppLock,
  readPrivacy,
  writeAppLock,
  writePrivacy,
} from '@/modules/settings';
import type { RelockIntervalMs } from '@/modules/settings';

const RELOCK_INTERVAL_OPTIONS: { value: RelockIntervalMs; label: string }[] = [
  { value: '0', label: 'Immediate' },
  { value: '60000', label: '1 min' },
  { value: '120000', label: '2 min' },
  { value: '180000', label: '3 min' },
  { value: '300000', label: '5 min' },
];

export default function PrivacySecurityScreen() {
  const [appLock, setAppLock] = useState(readAppLock);
  const [privacy, setPrivacy] = useState(readPrivacy);

  const toggleHideInRecents = (hideInRecents: boolean) => {
    const next = { ...privacy, hideInRecents };
    setPrivacy(next);
    writePrivacy(next);
    applyPrivacyProtection(hideInRecents);
  };

  const toggleAppLock = (enabled: boolean) => {
    const next = { ...appLock, enabled };
    setAppLock(next);
    writeAppLock(next);
  };

  const setRelockInterval = (relockIntervalMs: RelockIntervalMs) => {
    const next = { ...appLock, relockIntervalMs };
    setAppLock(next);
    writeAppLock(next);
  };

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Item
        title="App lock"
        description="Require biometric or device auth to open the app"
        left={props => <List.Icon {...props} icon="lock-outline" />}
        right={() => <Switch value={appLock.enabled} onValueChange={toggleAppLock} />}
      />
      {appLock.enabled ? (
        <SegmentedButtons
          style={styles.relockInterval}
          value={appLock.relockIntervalMs}
          onValueChange={value => setRelockInterval(value as RelockIntervalMs)}
          buttons={RELOCK_INTERVAL_OPTIONS}
        />
      ) : null}
      <List.Item
        title="Hide in recents"
        description="Cover the app with a blank screen while switching apps"
        left={props => <List.Icon {...props} icon="eye-off-outline" />}
        right={() => <Switch value={privacy.hideInRecents} onValueChange={toggleHideInRecents} />}
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
