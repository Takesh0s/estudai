import { Text, type TextProps } from 'react-native';

import { typography, useTheme, type TypographyVariant } from '../../theme';

type Tone = 'primary' | 'secondary' | 'link' | 'highlight' | 'onPrimary' | 'danger' | 'placeholder';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.text[tone];

  return (
    <Text
      {...rest}
      style={[typography[variant], { color }, align && { textAlign: align }, style]}
    />
  );
}
