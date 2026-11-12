import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { TextField } from '../TextField';

it('reports typed text', async () => {
  const onChangeText = jest.fn();
  await renderWithTheme(<TextField label="E-mail" onChangeText={onChangeText} />);
  await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@ucb.br');
  expect(onChangeText).toHaveBeenCalledWith('ana@ucb.br');
});

it('shows the error message below the field', async () => {
  await renderWithTheme(<TextField label="E-mail" error="Digite um e-mail válido." />);
  expect(screen.getByText('Digite um e-mail válido.')).toBeOnTheScreen();
});

it('masks a password until the user asks to see it', async () => {
  await renderWithTheme(<TextField label="Senha" password />);
  const input = screen.getByLabelText('Senha');
  expect(input).toHaveProp('secureTextEntry', true);

  await fireEvent.press(screen.getByRole('button', { name: 'Mostrar senha' }));
  expect(input).toHaveProp('secureTextEntry', false);

  await fireEvent.press(screen.getByRole('button', { name: 'Ocultar senha' }));
  expect(input).toHaveProp('secureTextEntry', true);
});

it('has no visibility toggle on regular fields', async () => {
  await renderWithTheme(<TextField label="Nome" />);
  expect(screen.queryByRole('button', { name: 'Mostrar senha' })).toBeNull();
});
