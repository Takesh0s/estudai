import { fireEvent, screen } from '@testing-library/react-native';

import { daysBeforeLabel } from '../../../lib/labels';
import { renderWithTheme } from '../../../test/render';
import { StepSlider } from '../StepSlider';

const props = { label: 'Avisar', min: 0, max: 7, formatValue: daysBeforeLabel };

it('shows the current value and the limits as text', async () => {
  await renderWithTheme(<StepSlider {...props} value={2} onChange={() => {}} />);
  expect(screen.getByText('2 dias antes')).toBeOnTheScreen();
  expect(screen.getByText('No dia')).toBeOnTheScreen();
  expect(screen.getByText('7 dias antes')).toBeOnTheScreen();
});

it('announces the value to screen readers', async () => {
  await renderWithTheme(<StepSlider {...props} value={1} onChange={() => {}} />);
  expect(screen.getByLabelText('Avisar')).toHaveAccessibilityValue({ min: 0, max: 7, now: 1, text: '1 dia antes' });
});

it('reports whole numbers while sliding', async () => {
  const onChange = jest.fn();
  await renderWithTheme(<StepSlider {...props} value={1} onChange={onChange} />);
  await fireEvent(screen.getByLabelText('Avisar'), 'valueChange', 3.4);
  expect(onChange).toHaveBeenCalledWith(3);
});
