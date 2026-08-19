import { StyleSheet } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Surface, ToggleButton } from 'react-native-paper';

import { EdgeScroller } from '@/components/shared';
import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import type { MarkdownFormat } from '@/lib/markdownFormat';

const ICON_SIZE = 20;

interface FormatButton {
  format: MarkdownFormat;
  icon: string;
}

const FORMAT_BUTTONS: readonly FormatButton[] = [
  { format: 'bold', icon: 'format-bold' },
  { format: 'italic', icon: 'format-italic' },
  { format: 'strikethrough', icon: 'format-strikethrough-variant' },
  { format: 'code', icon: 'code-tags' },
  { format: 'heading1', icon: 'format-header-1' },
  { format: 'heading2', icon: 'format-header-2' },
  { format: 'heading3', icon: 'format-header-3' },
  { format: 'bullet', icon: 'format-list-bulleted' },
  { format: 'quote', icon: 'format-quote-close' },
  { format: 'rule', icon: 'minus' },
];

interface FormatBarProps {
  isOpen: boolean;
  activeFormats: readonly MarkdownFormat[];
  onFormatPress: (format: MarkdownFormat) => void;
}

// Stays mounted at all times and only toggles visibility, for the same reason
// as TagPickerSheet: a mount timed to the focus event that opens the keyboard
// races the keyboard-controller's animation.
export function FormatBar({
  isOpen,
  activeFormats,
  onFormatPress,
}: FormatBarProps) {
  const { t } = useTranslation();

  return (
    <KeyboardStickyView
      enabled={isOpen}
      style={[styles.sticky, !isOpen && styles.hidden]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <Surface style={styles.bar} elevation={2}>
        <EdgeScroller contentContainerStyle={styles.buttons} keepKeyboardOnTap>
          {FORMAT_BUTTONS.map(({ format, icon }) => (
            <ToggleButton
              key={format}
              icon={icon}
              value={format}
              size={ICON_SIZE}
              status={activeFormats.includes(format) ? 'checked' : 'unchecked'}
              accessibilityLabel={t(`note.format.${format}`)}
              onPress={() => onFormatPress(format)}
              style={styles.button}
            />
          ))}
        </EdgeScroller>
      </Surface>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
  },
  bar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    borderWidth: StyleSheet.hairlineWidth,
    margin: 0,
  },
});
