import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { Button, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { ColorSwatch } from '@/components/ui';
import { RADIUS, SPACING } from '@/constants/layout';
import { useTags } from '@/hooks/useTags';
import { TRANSPARENT } from '@/modules/palette';
import { DEFAULT_STONE_ID, STONE_IDS } from '@/modules/types';
import type { StoneId } from '@/modules/types';

const CIRCLE_SIZE = 40;
const SELECTION_BORDER_WIDTH = 2;
// How far the modal is allowed to shift up to clear the keyboard — beyond
// this it stays put and its own ScrollView takes over.
const KEYBOARD_SHIFT_LIMIT = 220;

interface TagEditModalProps {
  visible: boolean;
  tagId: string | null;
  onDismiss: () => void;
}

function ColorCirclePicker({
  value,
  onChange,
}: {
  value: StoneId;
  onChange: (id: StoneId) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.circles}>
      {STONE_IDS.map(id => {
        const selected = id === value;

        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={id}
            accessibilityState={{ selected }}
            onPress={() => onChange(id)}
            style={[
              styles.circleWrapper,
              selected
                ? { borderColor: theme.colors.outline }
                : styles.circleWrapperUnselected,
            ]}
          >
            <ColorSwatch stoneId={id} size={CIRCLE_SIZE} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function TagEditModal({ visible, tagId, onDismiss }: TagEditModalProps) {
  const { tags, createTag, updateTag, removeTag } = useTags();
  const editingTag = tagId ? tags.find(tag => tag.id === tagId) : undefined;

  const [name, setName] = useState('');
  const [stoneId, setStoneId] = useState<StoneId>(DEFAULT_STONE_ID);
  const [initializedForId, setInitializedForId] = useState<string | null>(null);

  // The modal stays mounted across opens, so a fresh "new tag" open needs an
  // explicit reset — otherwise the previous session's draft would linger.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible && !tagId) {
      setName('');
      setStoneId(DEFAULT_STONE_ID);
      setInitializedForId(null);
    }
  }

  // Seeds the form from the loaded tag once, during render.
  if (editingTag && initializedForId !== editingTag.id) {
    setInitializedForId(editingTag.id);
    setName(editingTag.name);
    // Every tag is written with a color from STONE_IDS — see the same cast
    // in FolderCard.
    setStoneId(editingTag.color as StoneId);
  }

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const input = { name: name.trim(), color: stoneId };
    if (tagId) {
      updateTag(tagId, input);
    } else {
      createTag(input);
    }
    onDismiss();
  };

  const handleDelete = () => {
    if (!tagId) {
      return;
    }
    removeTag(tagId);
    onDismiss();
  };

  const theme = useTheme();
  const keyboardHeight = useKeyboardState(state => state.height);
  const keyboardShift = Math.min(keyboardHeight, KEYBOARD_SHIFT_LIMIT);

  const handleDismiss = () => {
    Keyboard.dismiss();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        style={{ marginBottom: keyboardShift }}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="always"
        >
          <Text variant="titleLarge">
            {tagId ? 'Modifica tag' : 'Nuovo tag'}
          </Text>
          <TextInput
            mode="outlined"
            label="Nome"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <ColorCirclePicker value={stoneId} onChange={setStoneId} />
          <Button mode="contained" onPress={handleSubmit} disabled={!canSubmit}>
            {tagId ? 'Salva' : 'Crea'}
          </Button>
          {tagId ? (
            <Button mode="outlined" onPress={handleDelete}>
              Elimina
            </Button>
          ) : null}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const MODAL_MAX_HEIGHT = '70%';

const styles = StyleSheet.create({
  modal: {
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    maxHeight: MODAL_MAX_HEIGHT,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  circles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  circleWrapper: {
    padding: SPACING.xs / 2,
    borderRadius: RADIUS.full,
    borderWidth: SELECTION_BORDER_WIDTH,
  },
  circleWrapperUnselected: {
    borderColor: TRANSPARENT,
  },
});
