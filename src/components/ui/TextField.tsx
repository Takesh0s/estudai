import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, sizes, spacing, typography, useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Shown below the field; also turns the border red. */
  error?: string;
  /** Masks the input and adds the show/hide toggle. */
  password?: boolean;
  /** Red border without a message, for an error displayed once below several fields. */
  invalid?: boolean;
};

export function TextField({ label, error, password = false, invalid, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const hasError = Boolean(error) || invalid;

  const borderColor = hasError ? colors.danger : focused ? colors.brand.primary : colors.border.field;

  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View
        style={[
          styles.box,
          { backgroundColor: colors.background.surface, borderColor, borderWidth: hasError || focused ? 1.5 : 1 },
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={label ?? inputProps.placeholder}
          secureTextEntry={password && hidden}
          placeholderTextColor={colors.text.placeholder}
          selectionColor={colors.brand.primary}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[styles.input, typography.body, { color: colors.text.primary }]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={12}
            onPress={() => setHidden((value) => !value)}
          >
            <Icon name={hidden ? 'ocultarSenha' : 'mostrarSenha'} color={colors.text.link} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  box: {
    minHeight: sizes.fieldHeight,
    borderRadius: radius.field,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.md },
});
