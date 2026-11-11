import { Pressable, StyleSheet, View } from 'react-native';
import { fonts, radius, spacing, typography, useTheme } from '../../theme';
import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Small identity dot before the label (subject or event type color). */
  dotColor?: string;
  size?: 'regular' | 'small';
};

/** "Opção" chip from the design system: green outline when selected, neutral otherwise. */
export function Chip({ label, selected, onPress, dotColor, size = 'regular' }: ChipProps) {
  const { colors } = useTheme();
  const small = size === 'small';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={small ? 6 : 4}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : styles.regular,
        {
          backgroundColor: selected ? colors.background.greenSoft : colors.background.surface,
          borderColor: selected ? colors.brand.primary : colors.border.default,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <AppText
        tone={selected ? 'highlight' : 'secondary'}
        style={[small ? typography.small : typography.label, selected && styles.selectedText]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.pill,
  },
  regular: { minHeight: 40, paddingHorizontal: spacing.lg },
  small: { minHeight: 32, paddingHorizontal: spacing.md },
  selectedText: { fontFamily: fonts.bold },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
