import { Pressable, StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type BackButtonProps = {
  onPress: () => void;
  label?: string;
};

export function BackButton({ onPress, label = 'Voltar' }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name="voltar" size={24} />
      <AppText variant="label">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
});
