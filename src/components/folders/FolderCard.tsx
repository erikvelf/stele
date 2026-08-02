import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Menu, Text, useTheme } from 'react-native-paper';

import { buildTheme, seedFor } from '@/modules/palette';
import type { StoneId } from '@/modules/types';
import type { Folder } from '@/modules/folders';

import { RADIUS, SPACING } from '@/constants/layout';

interface FolderCardProps {
  folder: Folder;
  onPress: (folder: Folder) => void;
  onEditPress: (folder: Folder) => void;
  onDeletePress: (folder: Folder) => void;
}

const AVATAR_SIZE = 44;
const AVATAR_FONT_SIZE = 22;
const SHADOW_SIZE_RATIO = 1.3;
const SHADOW_SIZE = AVATAR_SIZE * SHADOW_SIZE_RATIO;
const SHADOW_OPACITY = 0.35;

export function FolderCard({
  folder,
  onPress,
  onEditPress,
  onDeletePress,
}: FolderCardProps) {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Mock and, later, DB-read folders only ever carry an id from STONE_IDS —
  // folderSchema's `color` column is a plain string because two domains
  // (folders, palette) share the concept and neither owns the narrower type.
  const stoneId = folder.color as StoneId;
  const stoneTheme = buildTheme(stoneId, theme.dark);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(folder)}
      style={[styles.card, { backgroundColor: theme.colors.elevation.level4 }]}
    >
      <View style={[styles.avatar, { backgroundColor: seedFor(stoneId) }]}>
        <View
          style={[
            styles.avatarShadow,
            { backgroundColor: stoneTheme.colors.shadow },
          ]}
        />
        <Text style={styles.emoji}>{folder.emoji}</Text>
      </View>
      <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
        {folder.name}
      </Text>
      <Menu
        visible={isMenuOpen}
        onDismiss={() => setIsMenuOpen(false)}
        anchor={
          <IconButton
            icon="dots-vertical"
            accessibilityLabel="Folder actions"
            onPress={() => setIsMenuOpen(true)}
          />
        }
      >
        <Menu.Item
          leadingIcon="pencil"
          title="Edit"
          onPress={() => {
            setIsMenuOpen(false);
            onEditPress(folder);
          }}
        />
        <Menu.Item
          leadingIcon="delete"
          title="Delete"
          theme={{
            colors: {
              onSurface: theme.colors.error,
              onSurfaceVariant: theme.colors.error,
            },
          }}
          onPress={() => {
            setIsMenuOpen(false);
            onDeletePress(folder);
          }}
        />
      </Menu>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarShadow: {
    position: 'absolute',
    width: SHADOW_SIZE,
    height: SHADOW_SIZE,
    borderRadius: RADIUS.full,
    top: AVATAR_SIZE - SHADOW_SIZE / 2,
    left: AVATAR_SIZE - SHADOW_SIZE / 2,
    opacity: SHADOW_OPACITY,
  },
  emoji: {
    fontSize: AVATAR_FONT_SIZE,
  },
  title: {
    flex: 1,
    flexShrink: 1,
  },
});
