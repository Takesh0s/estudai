import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { ProgressBar } from '../ProgressBar';

it.each([
  [0.5, 50],
  [0, 0],
  [1, 100],
  [-0.2, 0],
  [1.7, 100],
])('reports %d as %i%%', async (value, percent) => {
  await renderWithTheme(<ProgressBar value={value} />);
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 100, now: percent });
});
