import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemeProvider } from '../../../theme';
import { Avatar } from '../Avatar';

it('shows the first letter of the name when there is no photo', async () => {
  await render(
    <ThemeProvider>
      <Avatar name="luiz" />
    </ThemeProvider>,
  );
  expect(screen.getByText('L')).toBeTruthy();
});

it('gives large initials a line height tall enough for the letter', async () => {
  await render(
    <ThemeProvider>
      <Avatar name="Luiz" size={104} />
    </ThemeProvider>,
  );
  const style = StyleSheet.flatten(screen.getByText('L').props.style);
  expect(style.fontSize).toBe(47);
  expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
});

it('shows the photo when there is one', async () => {
  await render(
    <ThemeProvider>
      <Avatar name="Luiz" uri="https://example.com/photo.png" />
    </ThemeProvider>,
  );
  expect(screen.queryByText('L')).toBeNull();
  expect(screen.getByLabelText('Foto de Luiz')).toBeTruthy();
});
