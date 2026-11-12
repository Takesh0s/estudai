import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { palettes } from '../colors';
import { ThemeProvider, useTheme } from '../ThemeProvider';

const STORAGE_KEY = '@estudai/theme-preference';

function Probe() {
  const theme = useTheme();
  return (
    <>
      <Text testID="probe">
        {theme.preference}:{theme.scheme}:{theme.colors.background.app}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => theme.setPreference('dark')}>
        <Text>Tema escuro</Text>
      </Pressable>
    </>
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('follows the system theme until the user picks one', async () => {
  await render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  expect(screen.getByTestId('probe')).toHaveTextContent(`system:light:${palettes.light.background.app}`);
});

it('switches the palette and saves the choice on the device', async () => {
  await render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Tema escuro' }));
  expect(screen.getByTestId('probe')).toHaveTextContent(`dark:dark:${palettes.dark.background.app}`);
  await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('dark'));
});

it('restores the saved choice on the next launch', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, 'dark');
  await render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent(/^dark:dark/));
});

it('ignores an unknown stored value', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, 'purple');
  await render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await act(async () => {});
  expect(screen.getByTestId('probe')).toHaveTextContent(/^system:light/);
});

it('fails loudly when used outside the provider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(render(<Probe />)).rejects.toThrow('useTheme must be used within a ThemeProvider.');
});
