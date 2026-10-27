import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { BackButton, Button, Notice, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { MIN_PASSWORD_LENGTH, isValidEmail, translateAuthError } from '../../lib/authErrors';
import type { AuthScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';
import { AuthHeader, FooterLink } from './components';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

export function SignUpScreen({ navigation }: AuthScreenProps<'SignUp'>) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Digite seu nome.';
    if (!isValidEmail(email)) next.email = 'Digite um e-mail válido.';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (confirm !== password) next.confirm = 'As senhas não são iguais.';
    return next;
  }

  async function handleSubmit() {
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp(name, email, password);
      if (needsEmailConfirmation) {
        setLoading(false);
        Alert.alert(
          'Confirme seu e-mail',
          `Enviamos um link de confirmação para ${email.trim()}. Depois de confirmar, é só entrar.`,
          [{ text: 'Ir para o login', onPress: () => navigation.navigate('Login') }],
        );
      }
      // Otherwise the session already exists and RootNavigator opens the app.
    } catch (err) {
      setFormError(translateAuthError(err));
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={() => navigation.goBack()} />
        <AuthHeader title="Crie sua conta" subtitle="Preencha seus dados para começar a organizar seus estudos." />

        <TextField
          label="Nome"
          placeholder="Digite seu nome"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={errors.name}
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
          error={errors.email}
        />
        <TextField
          label="Senha"
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
        />
        <TextField
          label="Confirmar senha"
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

        <Button label="Criar conta" onPress={handleSubmit} loading={loading} />

        <FooterLink question="Já possui uma conta?" action="Entrar" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
