import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { CalendarMonthIcon } from '../CalendarMonthIcon';

it.each([1, 11, 12])('shows month %i inside the calendar', async (month) => {
  await renderWithTheme(<CalendarMonthIcon month={month} />);
  // SVG text is rendered as a TSpan holding the string in its `content` prop.
  const [span] = screen.getByTestId('calendar-month-number').children;
  expect(typeof span === 'object' && span.props.content).toBe(String(month));
});
