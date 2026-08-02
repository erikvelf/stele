import { format } from 'date-fns';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Menu, Surface, Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import type { DateDayRange } from '@/modules/notes';

export interface NoteCardProps {
  noteText: string;
  images?: string[];
  range: DateDayRange;
  onOpenPress: () => void;
  onMediaPress?: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
}

const NO_IMAGE_PLACEHOLDER = '🪨';
const MAX_VISIBLE_IMAGES = 4;

export function NoteCard({
  noteText,
  images = [],
  range,
  onOpenPress,
  onMediaPress,
  onEditPress,
  onDeletePress,
}: NoteCardProps) {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const preview = noteText.length > 0 ? noteText : 'Writing…';
  const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenImageCount = images.length - visibleImages.length;

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
      elevation={0}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onMediaPress}
        style={styles.media}
      >
        {visibleImages.length > 0 ? (
          <View style={styles.mosaic}>
            {visibleImages.map((image, index) => (
              <View key={image} style={styles.mosaicTile}>
                <Image source={{ uri: image }} style={styles.mosaicImage} />
                {index === visibleImages.length - 1 && hiddenImageCount > 0 ? (
                  <View
                    style={[
                      styles.mosaicOverlay,
                      { backgroundColor: theme.colors.backdrop },
                    ]}
                  >
                    <Text
                      variant="titleMedium"
                      style={{ color: theme.colors.onSurface }}
                    >
                      +{hiddenImageCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>{NO_IMAGE_PLACEHOLDER}</Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onOpenPress}
        style={styles.textSection}
      >
        <Text variant="bodyMedium" numberOfLines={3}>
          {preview}
        </Text>
      </Pressable>

      <View
        style={[
          styles.footer,
          { borderTopColor: theme.colors.elevation.level3 },
        ]}
      >
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {format(new Date(range.start_timestamp), 'EEE, MMM d')}
        </Text>
        <Menu
          visible={isMenuOpen}
          onDismiss={() => setIsMenuOpen(false)}
          anchor={
            <IconButton
              icon="dots-horizontal"
              size={16}
              style={styles.menuButton}
              accessibilityLabel="Note actions"
              onPress={() => setIsMenuOpen(true)}
            />
          }
        >
          <Menu.Item
            leadingIcon="pencil"
            title="Edit"
            onPress={() => {
              setIsMenuOpen(false);
              onEditPress();
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
              onDeletePress();
            }}
          />
        </Menu>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  media: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  mosaicTile: {
    width: '50%',
    aspectRatio: 1,
  },
  mosaicImage: {
    width: '100%',
    height: '100%',
  },
  mosaicOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 28,
    paddingVertical: SPACING.md,
  },
  textSection: {
    padding: SPACING.md,
  },
  menuButton: {
    marginVertical: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SPACING.md,
    borderTopWidth: 1,
  },
});
