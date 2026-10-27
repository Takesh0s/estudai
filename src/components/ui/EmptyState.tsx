import { StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '../../theme';
import { Icon, type IconName } from '../icons/Icon';
import { AppText } from './AppText';
import { Button } from './Button';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.illustration, { backgroundColor: colors.background.greenSoft }]}>
        <Icon name={icon} size={48} color={colors.text.highlight} />
      </View>
      <AppText variant="modalTitle" align="center">
        {title}
      </AppText>
      <AppText tone="secondary" align="center">
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button label={secondaryLabel} onPress={onSecondary} variant="text" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  illustration: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  action: { alignSelf: 'stretch', marginTop: spacing.md },
});
