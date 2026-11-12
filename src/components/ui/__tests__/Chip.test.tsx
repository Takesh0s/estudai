import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { Chip } from '../Chip';

it('exposes its selected state and reports taps', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<Chip label="Prova" selected onPress={onPress} />);
  const chip = screen.getByRole('button', { name: 'Prova' });
  expect(chip).toBeSelected();
  await fireEvent.press(chip);
  expect(onPress).toHaveBeenCalledTimes(1);
});
