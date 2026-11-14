import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import {
  AppText,
  Avatar,
  Card,
  ConfirmDialog,
  Screen,
  SettingsRow,
  Toggle,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../lib/database.types';
import { daysBeforeLabel } from '../../lib/labels';
import type { TabScreenProps } from '../../navigation/types';
import { spacing, useTheme } from '../../theme';

/** One-line summary of the reminder settings, e.g. "1 dia antes, às 23:59". */
function reminderSummary(profile: Profile | null) {
  if (!profile) return undefined;
  const exam = {
    enabled: profile.exam_reminder_enabled,
    when: `${daysBeforeLabel(profile.exam_reminder_days_before)}, às ${profile.exam_reminder_time.slice(0, 5)}`,
  };
  const work = {
    enabled: profile.assignment_reminder_enabled,
    when: `${daysBeforeLabel(profile.assignment_reminder_days_before)}, às ${profile.assignment_reminder_time.slice(0, 5)}`,
  };
  if (!exam.enabled && !work.enabled) return 'Desativados';
  if (exam.enabled && !work.enabled) return `Só provas · ${exam.when}`;
  if (!exam.enabled && work.enabled) return `Só trabalhos · ${work.when}`;
  return exam.when === work.when ? exam.when : 'Provas e trabalhos em horários diferentes';
}

type Confirm = 'signOut' | 'delete' | null;

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { profile, session, displayName: name, signOut, deleteAccount } = useAuth();
  const { colors, scheme, setPreference } = useTheme();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const email = session?.user.email ?? '';

  async function handleSignOut() {
    setBusy(true);
    await signOut();
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteAccount();
      // The session is gone, so RootNavigator swaps to the login stack.
    } catch {
      setBusy(false);
      setConfirm(null);
      Alert.alert(
        'Não foi possível excluir a conta',
        'Verifique sua conexão e tente de novo. Se o problema continuar, fale com o suporte.',
      );
    }
  }

  return (
    <Screen edges={['top']} scroll>
      <AppText variant="screenTitle" accessibilityRole="header">
        Perfil
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Editar perfil"
        onPress={() => navigation.navigate('EditProfile')}
        style={({ pressed }) => [styles.user, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Avatar name={name} uri={profile?.avatar_url} size={64} />
        <View style={styles.userText}>
          <AppText variant="highlight">{name}</AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {email}
          </AppText>
        </View>
        <Icon name="avancar" size={22} color={colors.text.secondary} />
      </Pressable>

      <AppText variant="label" tone="secondary" style={styles.sectionTitle}>
        Preferências
      </AppText>
      <Card flush style={styles.group}>
        <SettingsRow
          label="Tema escuro"
          trailing={
            <Toggle
              accessibilityLabel="Tema escuro"
              value={scheme === 'dark'}
              onValueChange={(on) => setPreference(on ? 'dark' : 'light')}
            />
          }
        />
        <SettingsRow
          divider
          icon="lembrete"
          label="Lembretes"
          value={reminderSummary(profile)}
          onPress={() => navigation.navigate('Reminders')}
        />
      </Card>

      <AppText variant="label" tone="secondary" style={styles.sectionTitle}>
        Conta
      </AppText>
      <Card flush style={styles.group}>
        <SettingsRow
          icon="editar"
          label="Editar perfil"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <SettingsRow
          divider
          icon="ocultarSenha"
          label="Alterar senha"
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </Card>

      <AppText variant="label" tone="secondary" style={styles.sectionTitle}>
        Suporte
      </AppText>
      <Card flush style={styles.group}>
        <SettingsRow
          icon="email"
          label="Ajuda e suporte"
          onPress={() => navigation.navigate('Help')}
        />
        <SettingsRow
          divider
          icon="livro"
          label="Termos de uso"
          onPress={() => navigation.navigate('Terms')}
        />
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirm('signOut')}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Icon name="sair" size={22} color={colors.danger} />
        <AppText variant="bodyStrong" tone="danger">
          Sair da conta
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirm('delete')}
        style={({ pressed }) => [styles.deleteAccount, { opacity: pressed ? 0.6 : 1 }]}
      >
        <AppText variant="caption" tone="secondary">
          Excluir conta
        </AppText>
      </Pressable>

      <ConfirmDialog
        visible={confirm === 'signOut'}
        icon="sair"
        title="Sair da conta?"
        message="Você vai precisar fazer login de novo para acessar suas matérias e lembretes."
        confirmLabel="Sair"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={handleSignOut}
      />
      <ConfirmDialog
        visible={confirm === 'delete'}
        icon="excluir"
        title="Excluir conta?"
        message="Sua conta e todos os dados dela (matérias, conteúdos, tarefas, eventos e foto) serão apagados de forma permanente. Essa ação não pode ser desfeita."
        confirmLabel="Excluir tudo"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  userText: { flex: 1, gap: 2 },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.sm },
  group: { paddingHorizontal: spacing.lg },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    minHeight: 48,
  },
  deleteAccount: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
});
