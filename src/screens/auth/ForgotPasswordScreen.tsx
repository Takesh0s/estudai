import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackButton, Button, Notice, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail, translateAuthError } from '../../lib/authErrors';
import type { AuthScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';
import { AuthHeader, FooterLink } from './components';

export function ForgotPasswordScreen({ navigation, route }: AuthScreenProps<'ForgotPassword'>) {
  const { sendRecoveryCode } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setError('Digite o e-mail da sua conta.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendRecoveryCode(email);
      navigation.navigate('VerifyCode', { email: email.trim() });
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={() => navigation.goBack()} />
        <AuthHeader
          title="Esqueceu sua senha?"
          subtitle="Digite o e-mail da sua conta e enviaremos um código para você criar uma nova senha."
        />
        <TextField
          label="E-mail"
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          onSubmitEditing={handleSubmit}
          error={error ?? undefined}
        />
        <Button label="Enviar código" onPress={handleSubmit} loading={loading} />
        <Notice message="Se o e-mail estiver cadastrado, o código chega em alguns minutos. Confira também a caixa de spam." />
      </View>
      <View style={styles.spacer} />
      <FooterLink question="Lembrou a senha?" action="Entrar" onPress={() => navigation.navigate('Login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  spacer: { flex: 1 },
});
