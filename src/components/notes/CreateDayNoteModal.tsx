import { format } from 'date-fns';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { haptics } from '@/modules/haptics';

const DAY_FORMAT = 'EEEE, MMMM d';

export interface CreateDayNoteModalProps {
  day: Date | null;
  onDismiss: () => void;
  onConfirm: (day: Date) => void;
}

export function CreateDayNoteModal({
  day,
  onDismiss,
  onConfirm,
}: CreateDayNoteModalProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();

  if (!day) {
    return null;
  }

  const handleConfirm = () => {
    haptics.commit();
    onConfirm(day);
  };

  return (
    <Portal>
      <Modal
        visible
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <View style={styles.text}>
          <Text variant="headlineSmall" style={styles.centered}>
            {t('createDayNote.title')}
          </Text>
          <Text variant="bodyLarge" style={styles.centered}>
            {t('createDayNote.body', {
              day: format(day, DAY_FORMAT, { locale }),
            })}
          </Text>
        </View>
        <View style={styles.buttons}>
          <Button
            style={styles.button}
            mode="contained"
            onPress={handleConfirm}
          >
            {t('common.create')}
          </Button>
          <Button style={styles.button} mode="outlined" onPress={onDismiss}>
            {t('common.cancel')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.lg,
  },
  text: {
    gap: SPACING.xs,
  },
  centered: {
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
  },
});
