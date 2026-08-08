import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { contrastColor } from '@/lib/contrastColor';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface FoldersCarouselEmptyStateProps {
  size: number;
}

const ICON_SIZE = 28;
const BORDER_WIDTH = 1;

export function FoldersCarouselEmptyState({
  size,
}: FoldersCarouselEmptyStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const color = contrastColor(theme.colors.background);

  return (
    <View
      style={[styles.tile, { width: size, height: size, borderColor: color }]}
    >
      <MaterialCommunityIcons
        name="folder-plus-outline"
        size={ICON_SIZE}
        color={color}
      />
      <Text variant="labelLarge" style={[styles.label, { color }]}>
        {t('folders.carouselEmpty')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: RADIUS.lg,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  label: {
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
