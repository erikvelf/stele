import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';

interface InfoSwatchProps {
  size: number;
  color: string;
  shadeColor: string;
  icon: ReactNode;
  label: string;
  labelColor: string;
  style?: StyleProp<ViewStyle>;
}

const SHADOW_SIZE_RATIO = 0.65;
const SHADOW_OPACITY = 0.35;

// A square fully filled with a color, an icon centered over it, a label
// below. No color logic, no navigation — the caller resolves the color and
// handles onPress. Built for the tavole carousel; general enough for any
// future color-coded tile.
export function InfoSwatch({
  size,
  color,
  shadeColor,
  icon,
  label,
  labelColor,
  style,
}: InfoSwatchProps) {
  const shadowSize = size * SHADOW_SIZE_RATIO;

  return (
    <View
      style={[
        styles.swatch,
        { width: size, height: size, backgroundColor: color },
        style,
      ]}
    >
      <View
        style={[
          styles.shadow,
          {
            width: shadowSize,
            height: shadowSize,
            borderRadius: shadowSize,
            top: size - shadowSize / 2,
            left: size - shadowSize / 2,
            backgroundColor: shadeColor,
          },
        ]}
      />
      <View style={styles.icon}>{icon}</View>
      <Text
        variant="labelLarge"
        numberOfLines={2}
        style={[styles.label, { color: labelColor }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  swatch: {
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: SPACING.sm,
  },
  shadow: {
    position: 'absolute',
    opacity: SHADOW_OPACITY,
  },
  icon: {
    marginBottom: SPACING.xs,
  },
  label: {
    textAlign: 'center',
  },
});
