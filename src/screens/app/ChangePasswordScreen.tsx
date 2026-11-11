import { AuthError } from '@supabase/supabase-js';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, BackButton, Button, Notice, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { MIN_PASSWORD_LENGTH, translateAuthError } from '../../lib/authErrors';
import type { AppScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';

type Errors = Partial<Record<'current' | 'password' | 'confirm', string>>;

export function ChangePasswordScreen({ navigation }: AppScreenProps<'ChangePassword'>) {
  const { changePassword, signOut } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const next: Errors = {};
    if (current.length === 0) next.current = 'Digite sua senha atual.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    } else if (password === current) {
      next.password = 'A nova senha precisa ser diferente da atual.';
    }
    if (confirm !== password) next.confirm = 'As senhas não são iguais.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await changePassword(current, password);
      Alert.alert('Senha alterada', 'Use a nova senha no próximo login.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'invalid_credentials') {
        // Only the current password is checked by this call, so the message is specific to it.
        setErrors({ current: 'Senha atual incorreta.' });
      } else {
        setFormError(translateAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleForgot() {
    Alert.alert(
      'Esqueceu a senha atual?',
      'Você vai sair da conta e poderá criar uma nova senha pelo código enviado ao seu e-mail, em "Esqueci minha senha" na tela de login.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair e recuperar', onPress: () => signOut() },
      ],
    );
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.header}>
          <AppText variant="screenTitle" accessibilityRole="header">
            Alterar senha
          </AppText>
          <AppText tone="secondary">
            Para sua segurança, confirme a senha atual antes de criar uma nova. Ela precisa ter pelo
            menos {MIN_PASSWORD_LENGTH} caracteres.
          </AppText>
        </View>
        <View style={styles.group}>
          <TextField
            label="Senha atual"
            placeholder="Digite sua senha atual"
            value={current}
            onChangeText={setCurrent}
            password
            autoComplete="current-password"
            textContentType="password"
            error={errors.current}
          />
          <AppText
            variant="bodyStrong"
            tone="link"
            accessibilityRole="link"
            onPress={handleForgot}
            style={styles.forgot}
          >
            Esqueci minha senha atual
          </AppText>
        </View>
        <TextField
          label="Nova senha"
          placeholder="Digite a nova senha"
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
        />
        <TextField
          label="Confirmar nova senha"
          placeholder="Digite a senha novamente"
          value={confirm}
          onChangeText={setConfirm}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={handleSubmit}
          error={errors.confirm}
        />
        {formError ? <Notice tone="error" message={formError} /> : null}
        <Button label="Salvar nova senha" onPress={handleSubmit} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  header: { gap: spacing.sm },
  group: { gap: spacing.sm },
  forgot: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
});
