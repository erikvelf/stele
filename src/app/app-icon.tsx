import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { AppIconPicker } from '@/components/settings/AppIconPicker';
import { SPACING } from '@/constants/layout';
import { applyAppIcon } from '@/modules/app-icon';
import { haptics } from '@/modules/haptics';
import { readAppIcon, writeAppIcon } from '@/modules/settings';
import type { AppError, StoneId } from '@/modules/types';

function useAppIcon() {
  const [stoneId, setSelected] = useState<StoneId>(() => readAppIcon().stoneId);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const setStoneId = useCallback(
    (next: StoneId) => {
      if (next === stoneId) {
        return;
      }

      const previous = stoneId;
      setError(null);
      setIsApplying(true);
      setSelected(next);
      writeAppIcon({ stoneId: next });

      void applyAppIcon(next).then(result => {
        setIsApplying(false);
        if (!result.success) {
          setError(result.error);
          setSelected(previous);
          writeAppIcon({ stoneId: previous });
          haptics.fail();
        }
      });
    },
    [stoneId]
  );

  return { stoneId, isApplying, error, setStoneId };
}

export default function AppIconScreen() {
  const { stoneId, isApplying, error, setStoneId } = useAppIcon();

  return (
    <Surface elevation={0} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <AppIconPicker
          value={stoneId}
          onChange={setStoneId}
          isApplying={isApplying}
          error={error}
        />
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
  },
});
