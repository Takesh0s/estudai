import { AuthError } from '@supabase/supabase-js';

import { isValidEmail, MIN_PASSWORD_LENGTH, translateAuthError } from '../authErrors';

describe('translateAuthError', () => {
  it('translates known Supabase error codes', () => {
    expect(translateAuthError(new AuthError('Invalid login', 400, 'invalid_credentials'))).toBe(
      'E-mail ou senha incorretos. Confira e tente de novo.',
    );
    expect(translateAuthError(new AuthError('Token expired', 403, 'otp_expired'))).toBe(
      'Código inválido ou expirado. Peça um novo código.',
    );
  });

  it('treats sign up with an existing e-mail the same under both codes', () => {
    const a = translateAuthError(new AuthError('exists', 422, 'user_already_exists'));
    const b = translateAuthError(new AuthError('exists', 422, 'email_exists'));
    expect(a).toBe(b);
  });

  it('reports network failures as a connection problem', () => {
    expect(translateAuthError(new TypeError('Network request failed'))).toBe(
      'Sem conexão com a internet. Verifique sua rede e tente de novo.',
    );
  });

  it('falls back to a generic message', () => {
    const generic = 'Algo deu errado. Tente de novo em instantes.';
    expect(translateAuthError(new AuthError('???', 500, 'unexpected_failure'))).toBe(generic);
    expect(translateAuthError('not an error')).toBe(generic);
    expect(translateAuthError(undefined)).toBe(generic);
  });
});

describe('isValidEmail', () => {
  it.each(['ana@ucb.br', 'ana.souza@gmail.com', '  ana@ucb.br  '])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['', 'ana', 'ana@', 'ana@ucb', 'ana@ucb.b', 'ana souza@ucb.br'])('rejects "%s"', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

it('requires passwords of at least 8 characters', () => {
  expect(MIN_PASSWORD_LENGTH).toBe(8);
});
