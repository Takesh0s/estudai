import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Strikes through the label when checked, as in completed tasks. */
  strikeWhenChecked?: boolean;
};

export function Checkbox({ checked, onChange, label, strikeWhenChecked = false }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
      hitSlop={6}
    >
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary }
            : { backgroundColor: colors.background.surface, borderColor: colors.border.default },
        ]}
      >
        {checked ? <Icon name="confirmar" size={18} color={colors.text.onPrimary} strokeWidth={3} /> : null}
      </View>
      <AppText
        variant="label"
        tone={checked && strikeWhenChecked ? 'secondary' : 'primary'}
        style={checked && strikeWhenChecked ? styles.strike : undefined}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 40 },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strike: { textDecorationLine: 'line-through' },
});
