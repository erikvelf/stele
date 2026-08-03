import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { seedFor } from '@/modules/palette';
import type { StoneId } from '@/modules/types';

import { RADIUS } from '@/constants/layout';

interface ColorSwatchProps {
  stoneId: StoneId;
  size: number;
  style?: ViewStyle;
}

// A filled circle in a stone's color. Paper has nothing for this — every
// place a folder or a tag shows its color as a plain dot uses this.
export function ColorSwatch({ stoneId, size, style }: ColorSwatchProps) {
  return (
    <View
      style={[
        styles.swatch,
        { width: size, height: size, backgroundColor: seedFor(stoneId) },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  swatch: {
    borderRadius: RADIUS.full,
  },
});
