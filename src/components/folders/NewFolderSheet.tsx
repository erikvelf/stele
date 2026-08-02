import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

import FolderBottomSheet, {
  BottomSheetView,
} from '@expo/ui/community/bottom-sheet';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
const PENCIL_ICON_SIZE = 24;

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
    setEmoji,
    reset,
  } = useNewFolderDraft();

  const canSubmit = name.trim().length > 0 && emoji.trim().length > 0;
  // `closeSheet()` here fires the same onClose as a user swipe-dismiss —
  // this guard tells the two apart so the color-picker trip doesn't wipe
  // the draft (and, mid-edit, the id being edited) out from under it.
  const isNavigatingToColorPickerRef = useRef(false);

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
    isNavigatingToColorPickerRef.current = true;
    closeSheet();
    router.push('/folder/new-color');
  };

  return (
    <FolderBottomSheet
      index={isSheetOpen ? 0 : -1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={() => {
        if (isNavigatingToColorPickerRef.current) {
          isNavigatingToColorPickerRef.current = false;
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scegli colore"
            onPress={openColorPicker}
            style={[
              styles.colorCircle,
              { backgroundColor: seedFor(stoneId), borderColor: theme.colors.outline },
            ]}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={PENCIL_ICON_SIZE}
              color={contrastColor(seedFor(stoneId))}
            />
          </Pressable>
          <TextInput
            mode="outlined"
            label="Emoji"
            value={emoji}
            onChangeText={setEmoji}
            style={styles.emojiInput}
          />
        </View>

        <TextInput
          mode="outlined"
          label="Nome"
          value={name}
          onChangeText={setName}
          autoFocus={isSheetOpen}
        />

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
    alignItems: 'center',
    gap: SPACING.md,
  },
  colorCircle: {
    width: COLOR_CIRCLE_SIZE,
    height: COLOR_CIRCLE_SIZE,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiInput: {
    flex: 1,
  },
});
