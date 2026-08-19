import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Card,
  Divider,
  Icon,
  IconButton,
  Menu,
  Text,
  useTheme,
} from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDayRange } from '@/modules/i18n';
import { toDayBounds } from '@/modules/journal';
import type { DayRange } from '@/modules/journal';
import { bodyOf, titleOf } from '@/modules/notes';

import { MarkdownPreview } from './MarkdownPreview';

export interface NoteCardProps {
  noteText: string;
  range: DayRange;
  highlightCount: number;
  onOpenPress: () => void;
  onSetDayRangePress: () => void;
  onDeletePress: () => void;
}

const PREVIEW_BODY_LINES = 3;
const TITLE_MEDIUM_LENGTH = 28;
const TITLE_SMALL_LENGTH = 56;
const MENU_ICON_SIZE = 16;
const HIGHLIGHT_ICON_SIZE = 12;

function titleVariantFor(title: string) {
  if (title.length > TITLE_SMALL_LENGTH) {
    return 'titleSmall';
  }
  if (title.length > TITLE_MEDIUM_LENGTH) {
    return 'titleMedium';
  }
  return 'titleLarge';
}

function HighlightCount({ count }: { count: number }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={styles.highlightCount}
      accessibilityLabel={t('noteCard.highlights', { count })}
    >
      <Icon
        source="pickaxe"
        size={HIGHLIGHT_ICON_SIZE}
        color={theme.colors.onSurfaceVariant}
      />
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {count}
      </Text>
    </View>
  );
}

function NoteCardMenu({
  onSetDayRangePress,
  onDeletePress,
}: Pick<NoteCardProps, 'onSetDayRangePress' | 'onDeletePress'>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      visible={isMenuOpen}
      onDismiss={() => setIsMenuOpen(false)}
      anchor={
        <IconButton
          icon="dots-horizontal"
          size={MENU_ICON_SIZE}
          style={styles.menuButton}
          accessibilityLabel={t('noteActions.label')}
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      <Menu.Item
        leadingIcon="calendar-range"
        title={t('noteActions.setDayRange')}
        onPress={() => {
          setIsMenuOpen(false);
          onSetDayRangePress();
        }}
      />
      <Menu.Item
        leadingIcon="delete"
        title={t('common.delete')}
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
  range,
  highlightCount,
  onOpenPress,
  onSetDayRangePress,
  onDeletePress,
}: NoteCardProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const bounds = toDayBounds(range);
  const preview = noteText.length > 0 ? noteText : t('notes.cleanSlate');
  const previewTitle = titleOf(preview);
  const previewBody = bodyOf(preview);

  return (
    <Card
      mode="contained"
      onPress={onOpenPress}
      style={[styles.card, { backgroundColor: theme.colors.elevation.level3 }]}
    >
      {previewTitle ? (
        <View style={styles.titleSection}>
          <Text
            variant={titleVariantFor(previewTitle)}
            style={{ color: theme.colors.onSurface }}
          >
            {previewTitle}
          </Text>
        </View>
      ) : null}
      {previewTitle ? <Divider /> : null}
      {previewBody ? (
        <View style={styles.bodySection}>
          <MarkdownPreview
            markdown={previewBody}
            fontSize={theme.fonts.bodyMedium.fontSize}
            lineHeight={theme.fonts.bodyMedium.lineHeight}
            maxLines={PREVIEW_BODY_LINES}
          />
        </View>
      ) : null}

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
          {formatDayRange(bounds.start, bounds.end, locale)}
        </Text>
        <View style={styles.footerActions}>
          {highlightCount > 0 ? (
            <HighlightCount count={highlightCount} />
          ) : null}
          <NoteCardMenu
            onSetDayRangePress={onSetDayRangePress}
            onDeletePress={onDeletePress}
          />
        </View>
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
  titleSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  bodySection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
});
