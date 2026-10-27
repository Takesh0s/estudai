import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius, sizes, typography, useTheme } from '../../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'outline' | 'outlineDanger' | 'danger' | 'neutral' | 'text';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const look = {
    primary: { bg: colors.brand.primary, border: 'transparent', text: colors.text.onPrimary },
    danger: { bg: colors.background.danger, border: 'transparent', text: colors.text.onPrimary },
    outline: { bg: 'transparent', border: colors.brand.primary, text: colors.text.link },
    outlineDanger: { bg: 'transparent', border: colors.danger, text: colors.danger },
    neutral: { bg: 'transparent', border: colors.border.default, text: colors.text.primary },
    text: { bg: 'transparent', border: 'transparent', text: colors.text.link },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'text' && styles.textOnly,
        { backgroundColor: look.bg, borderColor: look.border, opacity: inactive ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={look.text} />
      ) : (
        <AppText style={[typography.button, { color: look.text }]}>{label}</AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    borderRadius: radius.field,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textOnly: { minHeight: sizes.touchTarget, borderWidth: 0 },
});
