import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { STONE_DETAILS, STONE_FAMILIES, seedFor } from '@/modules/palette';
import type { Stone, StoneFamily } from '@/modules/palette';
import type { StoneId } from '@/modules/types';

import { RADIUS, SPACING } from '@/constants/layout';

import { familyLabel, stoneLabel } from './stone-labels';

interface StonePickerProps {
  value: StoneId;
  onChange: (id: StoneId) => void;
}

const SWATCH_HEIGHT = 56;
const SELECTION_BORDER_WIDTH = 2;
const CHECK_BADGE_SIZE = 22;
const CHECK_ICON_SIZE = 14;
const CHECK_BADGE_MARGIN = SPACING.xs / 2;

// A Map, not bracket access on STONE_DETAILS, grouping each family's 3
// members in declaration order.
function buildFamilyMembers(): ReadonlyMap<StoneFamily, StoneId[]> {
  const members = new Map<StoneFamily, StoneId[]>(
    STONE_FAMILIES.map(family => [family, []])
  );
  for (const [id, stone] of Object.entries(STONE_DETAILS) as [
    StoneId,
    Stone,
  ][]) {
    members.get(stone.family)?.push(id);
  }
  return members;
}

const FAMILY_MEMBERS = buildFamilyMembers();

function rowHeading(
  family: StoneFamily,
  members: StoneId[],
  activeId: StoneId
): string {
  const base = familyLabel(family);
  return members.includes(activeId)
    ? `${base} — ${stoneLabel(activeId)}`
    : base;
}

export function StonePicker({ value, onChange }: StonePickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {STONE_FAMILIES.map(family => {
        const members = FAMILY_MEMBERS.get(family) ?? [];

        return (
          <View key={family} style={styles.row}>
            <Text variant="titleMedium" style={styles.heading}>
              {rowHeading(family, members, value)}
            </Text>
            <View style={styles.swatches}>
              {members.map(id => {
                const selected = id === value;

                return (
                  <View key={id} style={styles.swatchWrapper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={stoneLabel(id)}
                      accessibilityState={{ selected }}
                      onPress={() => onChange(id)}
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: seedFor(id),
                          borderColor: selected
                            ? theme.colors.outline
                            : 'transparent',
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.checkBadge,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={CHECK_ICON_SIZE}
                            color={theme.colors.onSurface}
                          />
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  row: {
    gap: SPACING.xs,
  },
  heading: {
    marginLeft: SPACING.xs,
  },
  swatches: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  swatchWrapper: {
    flex: 1,
    height: SWATCH_HEIGHT,
  },
  swatch: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: SELECTION_BORDER_WIDTH,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  checkBadge: {
    width: CHECK_BADGE_SIZE,
    height: CHECK_BADGE_SIZE,
    borderRadius: RADIUS.full,
    margin: CHECK_BADGE_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
