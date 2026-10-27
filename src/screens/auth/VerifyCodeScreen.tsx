import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '../../components/icons/Icon';
import { AppText, BackButton, Button, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { translateAuthError } from '../../lib/authErrors';
import type { AuthScreenProps } from '../../navigation/types';
import { spacing, useTheme } from '../../theme';

const RESEND_SECONDS = 45;

/**
 * Password recovery uses the one-time code from the e-mail instead of the
 * reset link: a link would have to reopen the app through a deep link, which
 * is unreliable in Expo Go because its URL changes with the dev server address.
 */
export function VerifyCodeScreen({ navigation, route }: AuthScreenProps<'VerifyCode'>) {
  const { email } = route.params;
  const { verifyRecoveryCode, sendRecoveryCode } = useAuth();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleVerify() {
    if (code.trim().length < 6) {
      setError('Digite o código que chegou no seu e-mail.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyRecoveryCode(email, code);
      navigation.reset({ index: 0, routes: [{ name: 'ResetPassword' }] });
    } catch (err) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await sendRecoveryCode(email);
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(translateAuthError(err));
    }
  }

  const timer = `0:${String(secondsLeft).padStart(2, '0')}`;

  return (
    <Screen scroll>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={[styles.illustration, { backgroundColor: colors.background.greenSoft }]}>
          <Icon name="email" size={48} color={colors.text.highlight} />
        </View>
        <AppText variant="screenTitle" align="center" accessibilityRole="header">
          Confira seu e-mail
        </AppText>
        <AppText tone="secondary" align="center">
          Enviamos um código para {email}. Digite-o abaixo para criar uma nova senha.
        </AppText>

        <View style={styles.field}>
          <TextField
            label="Código"
            placeholder="000000"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            onSubmitEditing={handleVerify}
            error={error ?? undefined}
          />
        </View>

        <Button label="Continuar" onPress={handleVerify} loading={loading} style={styles.button} />

        {secondsLeft > 0 ? (
          <AppText tone="secondary" variant="label">
            Não recebeu? Reenviar em {timer}
          </AppText>
        ) : (
          <Button label="Reenviar código" variant="text" onPress={handleResend} />
        )}
        <Button label="Voltar para o login" variant="text" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  illustration: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  field: { alignSelf: 'stretch' },
  button: { alignSelf: 'stretch' },
});
