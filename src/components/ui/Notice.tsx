import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type NoticeProps = {
  message: string;
  tone?: 'info' | 'error';
};

/** `error` renders an inline message for form errors instead of the highlighted box. */
export function Notice({ message, tone = 'info' }: NoticeProps) {
  const { colors } = useTheme();

  if (tone === 'error') {
    return (
      <View style={styles.errorRow} accessibilityRole="alert">
        <Icon name="erro" size={20} color={colors.danger} />
        <AppText variant="caption" tone="danger" style={styles.flex}>
          {message}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: colors.background.greenSoft }]}>
      <AppText variant="caption" tone="highlight">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
