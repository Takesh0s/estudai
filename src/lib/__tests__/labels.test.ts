import {
  contentStatusLabels,
  contentStatusOrder,
  daysBeforeLabel,
  eventTypeLabels,
  eventTypeOrder,
  plural,
} from '../labels';

describe('plural', () => {
  it('uses the singular only for exactly one', () => {
    expect(plural(1, 'matéria', 'matérias')).toBe('1 matéria');
    expect(plural(0, 'matéria', 'matérias')).toBe('0 matérias');
    expect(plural(5, 'matéria', 'matérias')).toBe('5 matérias');
  });
});

describe('daysBeforeLabel', () => {
  it.each([
    [0, 'No dia'],
    [1, '1 dia antes'],
    [3, '3 dias antes'],
  ])('describes %i days as "%s"', (days, label) => {
    expect(daysBeforeLabel(days)).toBe(label);
  });
});

describe('label tables', () => {
  it('orders every content status and event type exactly once', () => {
    expect([...contentStatusOrder].sort()).toEqual(Object.keys(contentStatusLabels).sort());
    expect([...eventTypeOrder].sort()).toEqual(Object.keys(eventTypeLabels).sort());
  });
});
