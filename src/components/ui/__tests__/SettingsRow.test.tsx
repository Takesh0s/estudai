import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { SettingsRow } from '../SettingsRow';

it('is a button when it has an action', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<SettingsRow label="Editar perfil" value="Ana" onPress={onPress} />);
  expect(screen.getByText('Ana')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('is plain content without an action', async () => {
  await renderWithTheme(<SettingsRow label="Versão" value="1.0.0" />);
  expect(screen.getByText('Versão')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();
});
