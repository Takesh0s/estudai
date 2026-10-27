import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '../../components/icons/Icon';
import { AppText, Avatar, ConfirmDialog, Screen, Toggle } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { radius, spacing, useTheme } from '../../theme';

export function ProfileScreen() {
  const { profile, session, displayName: name, signOut } = useAuth();
  const { colors, scheme, setPreference } = useTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const email = session?.user.email ?? '';

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <Screen edges={['top']} scroll>
      <AppText variant="screenTitle" accessibilityRole="header">
        Perfil
      </AppText>

      <View style={styles.user}>
        <Avatar name={name} uri={profile?.avatar_url} size={64} />
        <View style={styles.userText}>
          <AppText variant="highlight">{name}</AppText>
          <AppText variant="caption" tone="secondary">
            {email}
          </AppText>
        </View>
      </View>

      <AppText variant="label" tone="secondary" style={styles.sectionTitle}>
        Preferências
      </AppText>
      <View style={[styles.card, { backgroundColor: colors.background.surface, borderColor: colors.border.default }]}>
        <View style={styles.row}>
          <AppText>Tema escuro</AppText>
          <Toggle
            accessibilityLabel="Tema escuro"
            value={scheme === 'dark'}
            onValueChange={(on) => setPreference(on ? 'dark' : 'light')}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirmVisible(true)}
        style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Icon name="sair" size={22} color={colors.danger} />
        <AppText variant="bodyStrong" tone="danger">
          Sair da conta
        </AppText>
      </Pressable>

      <ConfirmDialog
        visible={confirmVisible}
        icon="sair"
        title="Sair da conta?"
        message="Você vai precisar fazer login de novo para acessar suas matérias e lembretes."
        confirmLabel="Sair"
        loading={signingOut}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleSignOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  userText: { flex: 1, gap: 2 },
  sectionTitle: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  card: { borderRadius: radius.card, borderWidth: 1, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    minHeight: 48,
  },
});
