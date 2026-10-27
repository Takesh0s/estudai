import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '../theme';

/**
 * Shown instead of the app when .env is missing, so a fresh clone explains
 * what to configure rather than failing on the first network request.
 * Uses the system font because custom fonts are loaded further down the tree.
 */
export function SetupRequiredScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.app }]}>
      <View style={[styles.card, { backgroundColor: colors.background.surface }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Falta configurar o Supabase</Text>
        <Text style={[styles.text, { color: colors.text.primary }]}>
          1. Copie o arquivo .env.example e renomeie a cópia para .env{'\n'}
          2. Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY{'\n'}
          3. Reinicie o servidor com: npx expo start --clear
        </Text>
        <Text style={[styles.hint, { color: colors.text.secondary }]}>Detalhes na seção “Como executar” do README.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '600' },
  text: { fontSize: 16, lineHeight: 24 },
  hint: { fontSize: 14 },
});
