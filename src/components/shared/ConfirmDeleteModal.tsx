import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { haptics } from '@/modules/haptics';

export interface ConfirmDeleteModalProps {
  visible: boolean;
  subject: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ConfirmDeleteModal({
  visible,
  subject,
  onConfirm,
  onDismiss,
}: ConfirmDeleteModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleConfirm = () => {
    haptics.destroy();
    onConfirm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <View style={styles.text}>
          <Text variant="headlineSmall" style={styles.centered}>
            {t('confirmDelete.title', { subject })}
          </Text>
          <Text variant="bodyLarge" style={styles.centered}>
            {t('confirmDelete.body', { subject })}
          </Text>
        </View>
        <View style={styles.buttons}>
          <Button
            style={styles.button}
            mode="contained"
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            onPress={handleConfirm}
          >
            {t('common.yes')}
          </Button>
          <Button style={styles.button} mode="contained" onPress={onDismiss}>
            {t('common.no')}
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
