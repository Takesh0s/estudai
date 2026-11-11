import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useData } from '../contexts/DataContext';
import { spacing, useTheme } from '../theme';
import { AppText, Button } from './ui';

/**
 * Wraps tab content: a spinner during the first load and a retry prompt when
 * the load failed, so screens only ever render with their data in place.
 */
export function DataGate({ children }: { children: ReactNode }) {
  const { loading, error, reload } = useData();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.center} accessibilityLabel="Carregando">
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <AppText variant="modalTitle" align="center">
          Algo deu errado
        </AppText>
        <AppText tone="secondary" align="center">
          {error}
        </AppText>
        <Button label="Tentar de novo" onPress={reload} style={styles.retry} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  retry: { alignSelf: 'stretch', marginTop: spacing.md },
});
