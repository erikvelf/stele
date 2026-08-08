import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { STONE_IDS } from '@/modules/types';
import type { AppError, StoneId } from '@/modules/types';

import { appIconPreviewFor } from './app-icon-previews';
import { stoneLabel } from './stone-labels';

export interface AppIconPickerProps {
  value: StoneId;
  onChange: (id: StoneId) => void;
  isApplying: boolean;
  error: AppError | null;
}

const COLUMN_WIDTH: DimensionValue = '33.33%';
const SELECTION_BORDER_WIDTH = 3;
const DISABLED_OPACITY = 0.5;

export function AppIconPicker({
  value,
  onChange,
  isApplying,
  error,
}: AppIconPickerProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text variant="titleLarge" style={styles.title}>
        {t('appearance.appIcon.title')}
      </Text>
      <Text
        variant="bodySmall"
        style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('appearance.appIcon.caption')}
      </Text>

      <View style={[styles.grid, isApplying ? styles.gridDisabled : null]}>
        {STONE_IDS.map(id => {
          const selected = id === value;

          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={stoneLabel(id, t)}
              accessibilityState={{ selected, disabled: isApplying }}
              disabled={isApplying}
              onPress={() => onChange(id)}
              style={styles.cell}
            >
              <Image
                source={appIconPreviewFor(id)}
                contentFit="cover"
                style={[
                  styles.preview,
                  {
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                  },
                ]}
              />
              <Text
                variant="labelSmall"
                numberOfLines={1}
                style={[
                  styles.label,
                  selected ? { color: theme.colors.primary } : null,
                ]}
              >
                {stoneLabel(id, t)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && (
        <Text
          variant="bodySmall"
          style={[styles.caption, { color: theme.colors.error }]}
        >
          {t('appearance.appIcon.error')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
  },
  title: {
    marginLeft: SPACING.xs,
  },
  caption: {
    marginLeft: SPACING.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridDisabled: {
    opacity: DISABLED_OPACITY,
  },
  cell: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    borderWidth: SELECTION_BORDER_WIDTH,
  },
  label: {
    textAlign: 'center',
  },
});
