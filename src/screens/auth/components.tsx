import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/ui';
import { spacing } from '../../theme';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <AppText variant="screenTitle" accessibilityRole="header">
        {title}
      </AppText>
      <AppText tone="secondary">{subtitle}</AppText>
    </View>
  );
}

export function FooterLink({ question, action, onPress }: { question: string; action: string; onPress: () => void }) {
  return (
    <AppText tone="secondary" align="center" style={styles.footer}>
      {question}{' '}
      <AppText variant="bodyStrong" tone="link" onPress={onPress} accessibilityRole="link">
        {action}
      </AppText>
    </AppText>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.xs },
  footer: { marginTop: spacing.lg, paddingVertical: spacing.sm },
});
