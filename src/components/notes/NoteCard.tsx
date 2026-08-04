import { format } from 'date-fns';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

import { ItemActionsMenu } from '@/components/shared';
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
  const preview = noteText.length > 0 ? noteText : 'Clean slate';
  const [previewTitle, ...previewBodyLines] = preview.split('\n');
  const previewBody = previewBodyLines.join('\n');
  const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenImageCount = images.length - visibleImages.length;

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
      elevation={0}
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

      <Pressable
        accessibilityRole="button"
        onPress={onOpenPress}
        style={styles.textSection}
      >
        <Text variant="titleMedium" numberOfLines={1}>
          {previewTitle}
        </Text>
        {previewBody ? (
          <Text
            variant="bodyMedium"
            numberOfLines={2}
            style={styles.previewBody}
          >
            {previewBody}
          </Text>
        ) : null}
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
        <ItemActionsMenu
          onEditPress={onEditPress}
          onDeletePress={onDeletePress}
          iconSize={16}
          iconStyle={styles.menuButton}
        />
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
    padding: SPACING.md,
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
    borderTopWidth: 3,
  },
});
