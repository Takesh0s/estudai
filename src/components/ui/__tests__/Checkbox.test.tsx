import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { Checkbox } from '../Checkbox';

it('reports the opposite state when tapped', async () => {
  const onChange = jest.fn();
  const { rerender } = await renderWithTheme(<Checkbox label="Lembrar login" checked={false} onChange={onChange} />);

  const box = screen.getByRole('checkbox', { name: 'Lembrar login' });
  expect(box).not.toBeChecked();
  await fireEvent.press(box);
  expect(onChange).toHaveBeenLastCalledWith(true);

  await rerender(<Checkbox label="Lembrar login" checked onChange={onChange} />);
  expect(screen.getByRole('checkbox')).toBeChecked();
  await fireEvent.press(screen.getByRole('checkbox'));
  expect(onChange).toHaveBeenLastCalledWith(false);
});

it('strikes through a completed task', async () => {
  await renderWithTheme(<Checkbox label="Lista 3" checked onChange={() => {}} strikeWhenChecked />);
  expect(screen.getByText('Lista 3')).toHaveStyle({ textDecorationLine: 'line-through' });
});
