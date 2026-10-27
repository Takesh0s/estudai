import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '../../theme';
import { Icon, type IconName } from '../icons/Icon';
import { AppText } from './AppText';
import { Button } from './Button';

type ConfirmDialogProps = {
  visible: boolean;
  icon: IconName;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Fechar">
        {/* Absorbs taps so that pressing inside the card does not dismiss the dialog. */}
        <Pressable style={[styles.card, { backgroundColor: colors.background.surface }]} onPress={() => {}}>
          <View style={[styles.iconCircle, { backgroundColor: colors.background.dangerSoft }]}>
            <Icon name={icon} size={30} color={colors.danger} />
          </View>
          <AppText variant="modalTitle" align="center">
            {title}
          </AppText>
          <AppText tone="secondary" align="center">
            {message}
          </AppText>
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="neutral" onPress={onCancel} style={styles.flex} />
            <Button
              label={confirmLabel}
              variant="danger"
              onPress={onConfirm}
              loading={loading}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    borderRadius: radius.dialog,
    padding: 24,
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  flex: { flex: 1 },
});
