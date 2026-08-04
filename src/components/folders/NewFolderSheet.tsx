import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

import FolderBottomSheet, {
  BottomSheetView,
} from '@expo/ui/community/bottom-sheet';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ColorSwatch } from '@/components/ui';
import { seedFor } from '@/modules/palette';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';
import type { StoneId } from '@/modules/types';

import { RADIUS, SPACING } from '@/constants/layout';
import { contrastColor } from '@/lib/contrastColor';

interface NewFolderSheetProps {
  onCreate: (input: { name: string; emoji: string; color: StoneId }) => void;
  onEdit: (
    id: string,
    input: { name: string; emoji: string; color: StoneId }
  ) => void;
}

const COLOR_CIRCLE_SIZE = 56;
const NAME_INPUT_MAX_HEIGHT = 76;
const PENCIL_ICON_SIZE = 24;
const EMOJI_GLYPH_SIZE = 28;

export function NewFolderSheet({ onCreate, onEdit }: NewFolderSheetProps) {
  const router = useRouter();
  const theme = useTheme();
  const {
    isSheetOpen,
    editingId,
    name,
    emoji,
    stoneId,
    closeSheet,
    setName,
    reset,
  } = useNewFolderDraft();

  const canSubmit = name.trim().length > 0 && emoji.trim().length > 0;
  // `closeSheet()` here fires the same onClose as a user swipe-dismiss —
  // this guard tells the two apart so an in-flight picker trip doesn't wipe
  // the draft (and, mid-edit, the id being edited) out from under it.
  const isNavigatingAwayRef = useRef(false);

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const input = { name: name.trim(), emoji: emoji.trim(), color: stoneId };
    if (editingId) {
      onEdit(editingId, input);
    } else {
      onCreate(input);
    }
    reset();
    closeSheet();
  };

  const openColorPicker = () => {
    isNavigatingAwayRef.current = true;
    closeSheet();
    router.push('/folder/new-color');
  };

  const openEmojiPicker = () => {
    isNavigatingAwayRef.current = true;
    closeSheet();
    router.push('/folder/new-emoji');
  };

  return (
    <FolderBottomSheet
      index={isSheetOpen ? 0 : -1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={() => {
        if (isNavigatingAwayRef.current) {
          isNavigatingAwayRef.current = false;
          closeSheet();
          return;
        }
        reset();
        closeSheet();
      }}
      backgroundStyle={{ backgroundColor: theme.colors.elevation.level2 }}
    >
      <BottomSheetView style={styles.body}>
        <Text variant="titleLarge">
          {editingId ? 'Modifica tavola' : 'Nuova tavola'}
        </Text>

        <View style={styles.topRow}>
          <TextInput
            mode="outlined"
            label="Nome"
            value={name}
            onChangeText={setName}
            autoFocus={isSheetOpen}
            multiline
            numberOfLines={2}
            style={styles.nameInput}
          />

          <View style={styles.circleColumn}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scegli emoji"
              onPress={openEmojiPicker}
              style={[styles.emojiCircle, { borderColor: theme.colors.outline }]}
            >
              <Text style={styles.emojiGlyph}>{emoji}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scegli colore"
              onPress={openColorPicker}
              style={[styles.colorCircle, { borderColor: theme.colors.outline }]}
            >
              <ColorSwatch
                stoneId={stoneId}
                size={COLOR_CIRCLE_SIZE}
                style={styles.colorCircleFill}
              />
              <MaterialCommunityIcons
                name="pencil"
                size={PENCIL_ICON_SIZE}
                color={contrastColor(seedFor(stoneId))}
              />
            </Pressable>
          </View>
        </View>

        <Button mode="contained" onPress={handleSubmit} disabled={!canSubmit}>
          {editingId ? 'Salva' : 'Crea'}
        </Button>
      </BottomSheetView>
    </FolderBottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: SPACING.md,
    padding: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  nameInput: {
    flex: 1,
    maxHeight: NAME_INPUT_MAX_HEIGHT,
  },
  circleColumn: {
    gap: SPACING.sm,
  },
  colorCircle: {
    width: COLOR_CIRCLE_SIZE,
    height: COLOR_CIRCLE_SIZE,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleFill: {
    position: 'absolute',
  },
  emojiCircle: {
    width: COLOR_CIRCLE_SIZE,
    height: COLOR_CIRCLE_SIZE,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiGlyph: {
    fontSize: EMOJI_GLYPH_SIZE,
  },
});
