import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '../../../test/render';
import { EmptyState } from '../EmptyState';

it('shows the actions only when they have a handler', async () => {
  const onAction = jest.fn();
  const { rerender } = await renderWithTheme(
    <EmptyState icon="materias" title="Nenhuma matéria" description="Comece criando uma." />,
  );
  expect(screen.getByText('Nenhuma matéria')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).toBeNull();

  await rerender(
    <EmptyState
      icon="materias"
      title="Nenhuma matéria"
      description="Comece criando uma."
      actionLabel="Adicionar matéria"
      onAction={onAction}
    />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Adicionar matéria' }));
  expect(onAction).toHaveBeenCalledTimes(1);
});
