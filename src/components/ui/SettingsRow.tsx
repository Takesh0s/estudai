import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { Icon, type IconName } from '../icons/Icon';
import { AppText } from './AppText';

type SettingsRowProps = {
  label: string;
  icon?: IconName;
  value?: string;
  onPress?: () => void;
  /** Replaces the chevron, e.g. a Toggle. */
  trailing?: ReactNode;
  tone?: 'default' | 'danger';
  /** Draws a divider above the row, for every row but the first of a group. */
  divider?: boolean;
};

export function SettingsRow({
  label,
  icon,
  value,
  onPress,
  trailing,
  tone = 'default',
  divider = false,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.text.link;
  const content = (
    <>
      {icon ? <Icon name={icon} size={22} color={color} /> : null}
      <View style={styles.text}>
        <AppText tone={tone === 'danger' ? 'danger' : 'primary'}>{label}</AppText>
        {value ? (
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name="avancar" size={22} color={colors.text.secondary} /> : null)}
    </>
  );
  const rowStyle = [
    styles.row,
    divider && { borderTopWidth: 1, borderTopColor: colors.border.default },
  ];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.6 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1 },
});
