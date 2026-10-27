import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from '../../components/icons/Logo';
import { AppText, Button, Checkbox, Notice, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail, translateAuthError } from '../../lib/authErrors';
import type { AuthScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';
import { AuthHeader, FooterLink } from './components';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!isValidEmail(email) || password.length === 0) {
      setError('Preencha seu e-mail e sua senha para entrar.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password, remember);
      // No navigate() here: RootNavigator reacts to the new session.
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.logo}>
        <Logo width={208} />
      </View>

      <View style={styles.form}>
        <AuthHeader title="Bem-vindo de volta!" subtitle="Faça o login para acessar sua conta ou crie uma conta." />

        <TextField
          placeholder="Digite o seu e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          invalid={Boolean(error)}
        />
        <TextField
          placeholder="Digite a sua senha"
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          invalid={Boolean(error)}
        />
        {error ? <Notice tone="error" message={error} /> : null}

        <AppText
          variant="bodyStrong"
          tone="link"
          accessibilityRole="link"
          onPress={() => navigation.navigate('ForgotPassword', { email })}
          style={styles.forgot}
        >
          Esqueci minha senha
        </AppText>

        <Checkbox label="Lembrar login" checked={remember} onChange={setRemember} />

        <Button label="Entrar" onPress={handleSubmit} loading={loading} />

        <FooterLink
          question="Ainda não possui um login?"
          action="Crie uma conta"
          onPress={() => navigation.navigate('SignUp')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { marginTop: spacing.lg, marginBottom: spacing.xl },
  form: { gap: spacing.lg },
  forgot: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
});
