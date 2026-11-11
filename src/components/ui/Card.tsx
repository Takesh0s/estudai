import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Removes the inner padding, for cards that draw their own rows or accent bar. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, accessibilityLabel, flush = false, style }: CardProps) {
  const { colors } = useTheme();
  const base = [
    styles.card,
    !flush && styles.padded,
    { backgroundColor: colors.background.surface, borderColor: colors.border.default },
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  padded: { padding: spacing.lg },
});
