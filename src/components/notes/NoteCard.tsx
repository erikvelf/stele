import { format } from 'date-fns';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Card, IconButton, Menu, Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import type { DateDayRange } from '@/modules/notes';

import { MarkdownPreview } from './MarkdownPreview';

export interface NoteCardProps {
  noteText: string;
  images?: string[];
  range: DateDayRange;
  onOpenPress: () => void;
  onMediaPress?: () => void;
  onSetDayRangePress: () => void;
  onDeletePress: () => void;
}

const NO_IMAGE_PLACEHOLDER = '🪨';
const MAX_VISIBLE_IMAGES = 4;
const PREVIEW_TITLE_LINES = 1;
const PREVIEW_BODY_LINES = 2;
const MENU_ICON_SIZE = 16;

function NoteCardMenu({
  onSetDayRangePress,
  onDeletePress,
}: Pick<NoteCardProps, 'onSetDayRangePress' | 'onDeletePress'>) {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      visible={isMenuOpen}
      onDismiss={() => setIsMenuOpen(false)}
      anchor={
        <IconButton
          icon="dots-vertical"
          size={MENU_ICON_SIZE}
          style={styles.menuButton}
          accessibilityLabel="Note actions"
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      <Menu.Item
        leadingIcon="calendar-range"
        title="Set day range"
        onPress={() => {
          setIsMenuOpen(false);
          onSetDayRangePress();
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
  );
}

export function NoteCard({
  noteText,
  images = [],
  range,
  onOpenPress,
  onMediaPress,
  onSetDayRangePress,
  onDeletePress,
}: NoteCardProps) {
  const theme = useTheme();
  const preview = noteText.length > 0 ? noteText : 'Clean slate';
  const [previewTitle, ...previewBodyLines] = preview.split('\n');
  const previewBody = previewBodyLines.join('\n');
  const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenImageCount = images.length - visibleImages.length;

  return (
    <Card
      mode="contained"
      onPress={onOpenPress}
      style={[styles.card, { backgroundColor: theme.colors.elevation.level3 }]}
    >
      {visibleImages.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={onMediaPress}
          style={styles.media}
        >
          {/* TODO: Mosaic the various media like having 1 half and one rock for 1 image, 2 images side by side when 2 images, when more images then mosaic the next mosaic like 1/2, 1/4 + 1/4, or 1/2 + 1/4 + 1/8 + 1/8 */}
          <View style={styles.mosaic}>
            {visibleImages.length === 1 ? (
              <View style={styles.mosaicTile}>
                <Text style={styles.placeholder}>{NO_IMAGE_PLACEHOLDER}</Text>
              </View>
            ) : null}
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
        </Pressable>
      ) : null}

      <Card.Content style={styles.textSection}>
        <Text
          variant="titleMedium"
          numberOfLines={PREVIEW_TITLE_LINES}
          style={{ color: theme.colors.onSurface }}
        >
          {previewTitle}
        </Text>
        {previewBody ? (
          <View style={styles.previewBody}>
            <MarkdownPreview
              markdown={previewBody}
              fontSize={theme.fonts.bodyMedium.fontSize}
              lineHeight={theme.fonts.bodyMedium.lineHeight}
              maxLines={PREVIEW_BODY_LINES}
            />
          </View>
        ) : null}
      </Card.Content>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {format(new Date(range.start_timestamp), 'EEE, MMM d')}
        </Text>
        <NoteCardMenu
          onSetDayRangePress={onSetDayRangePress}
          onDeletePress={onDeletePress}
        />
      </View>
    </Card>
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
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  textSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  previewBody: {
    marginTop: SPACING.xs,
  },
  menuButton: {
    marginVertical: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SPACING.md,
  },
});
