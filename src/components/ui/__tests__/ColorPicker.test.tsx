import { fireEvent, screen } from '@testing-library/react-native';

import { subjectColors } from '../../../theme';
import { renderWithTheme } from '../../../test/render';
import { ColorPicker } from '../ColorPicker';

it('offers every subject color and marks the current one, ignoring case', async () => {
  await renderWithTheme(<ColorPicker value={subjectColors[1].toLowerCase()} onChange={() => {}} />);
  const options = screen.getAllByRole('radio');
  expect(options).toHaveLength(subjectColors.length);
  expect(screen.getByRole('radio', { name: `Cor ${subjectColors[1]}` })).toBeSelected();
  expect(screen.getByRole('radio', { name: `Cor ${subjectColors[0]}` })).not.toBeSelected();
});

it('reports the tapped color', async () => {
  const onChange = jest.fn();
  await renderWithTheme(<ColorPicker value={subjectColors[0]} onChange={onChange} />);
  await fireEvent.press(screen.getByRole('radio', { name: `Cor ${subjectColors[2]}` }));
  expect(onChange).toHaveBeenCalledWith(subjectColors[2]);
});
