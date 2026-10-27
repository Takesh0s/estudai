import { AuthError } from '@supabase/supabase-js';

// Keyed by Supabase Auth error codes; unknown codes fall back to a generic message.
const messages: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos. Confira e tente de novo.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.',
  user_already_exists: 'Já existe uma conta com esse e-mail. Tente entrar.',
  email_exists: 'Já existe uma conta com esse e-mail. Tente entrar.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.',
  same_password: 'A nova senha precisa ser diferente da anterior.',
  otp_expired: 'Código inválido ou expirado. Peça um novo código.',
  over_email_send_rate_limit: 'Muitos e-mails em pouco tempo. Aguarde um minuto e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  email_address_invalid: 'Esse e-mail não parece válido.',
  validation_failed: 'Confira os dados digitados.',
};

export function translateAuthError(error: unknown): string {
  if (error instanceof AuthError && error.code && messages[error.code]) {
    return messages[error.code];
  }
  if (error instanceof Error && /network|fetch/i.test(error.message)) {
    return 'Sem conexão com a internet. Verifique sua rede e tente de novo.';
  }
  return 'Algo deu errado. Tente de novo em instantes.';
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

// Supabase defaults to 6. Set the same value in its Email provider settings so the
// server enforces it too; this constant only covers client-side validation.
export const MIN_PASSWORD_LENGTH = 8;
