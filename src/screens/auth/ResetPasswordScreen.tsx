import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackButton, Button, Notice, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { MIN_PASSWORD_LENGTH, translateAuthError } from '../../lib/authErrors';
import type { AuthScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';
import { AuthHeader } from './components';

export function ResetPasswordScreen({ navigation }: AuthScreenProps<'ResetPassword'>) {
  const { updatePassword, cancelRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (confirm !== password) next.confirm = 'As senhas não são iguais.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await updatePassword(password);
      // Clears isRecovering, so RootNavigator opens the app with the current session.
    } catch (err) {
      setFormError(translateAuthError(err));
      setLoading(false);
    }
  }

  async function handleBack() {
    await cancelRecovery();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={handleBack} />
        <AuthHeader
          title="Crie uma nova senha"
          subtitle={`Sua nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres e ser diferente da anterior.`}
        />
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
});
