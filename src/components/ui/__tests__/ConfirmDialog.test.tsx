import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { ConfirmDialog } from '../ConfirmDialog';

const props = {
  icon: 'sair' as const,
  title: 'Sair da conta?',
  message: 'Você vai precisar entrar de novo.',
  confirmLabel: 'Sair',
};

it('shows the question and calls the matching handler', async () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  await renderWithTheme(<ConfirmDialog visible {...props} onConfirm={onConfirm} onCancel={onCancel} />);

  expect(screen.getByText('Sair da conta?')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

it('renders nothing while hidden', async () => {
  await renderWithTheme(<ConfirmDialog visible={false} {...props} onConfirm={() => {}} onCancel={() => {}} />);
  expect(screen.queryByText('Sair da conta?')).toBeNull();
});

it('blocks a second confirmation while the action is running', async () => {
  const onConfirm = jest.fn();
  await renderWithTheme(<ConfirmDialog visible loading {...props} onConfirm={onConfirm} onCancel={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
  expect(screen.getByRole('button', { busy: true })).toBeDisabled();
});
