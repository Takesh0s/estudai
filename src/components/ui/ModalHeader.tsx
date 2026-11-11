import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { spacing } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

/** iOS presents modals below the status bar already, so only Android needs the top inset. */
export const modalEdges: Edge[] = Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom'];

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
};

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="screenTitle" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={8}
        onPress={onClose}
        style={styles.close}
      >
        <Icon name="fechar" size={26} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
