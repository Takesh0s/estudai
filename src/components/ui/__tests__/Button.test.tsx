import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { Button } from '../Button';

it('calls onPress when tapped', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<Button label="Entrar" onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('ignores taps while disabled', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<Button label="Entrar" onPress={onPress} disabled />);
  const button = screen.getByRole('button', { name: 'Entrar' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});

it('shows a spinner instead of the label and blocks taps while loading', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<Button label="Entrar" onPress={onPress} loading />);
  expect(screen.queryByText('Entrar')).toBeNull();
  const button = screen.getByRole('button');
  expect(button).toBeBusy();
  await fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});
