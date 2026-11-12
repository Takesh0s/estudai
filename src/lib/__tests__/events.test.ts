import { eventTypeColors, urgentColor } from '../../theme';
import { makeEvent } from '../../test/factories';
import { eventColor, groupEventsByDay, isUrgent, upcomingEvents } from '../events';

const now = new Date(2026, 10, 11, 12, 0);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute).toISOString();

describe('groupEventsByDay', () => {
  it('groups by local day and sorts each day by time', () => {
    const groups = groupEventsByDay([
      makeEvent({ id: 'late', starts_at: at(12, 18) }),
      makeEvent({ id: 'other-day', starts_at: at(13, 9) }),
      makeEvent({ id: 'early', starts_at: at(12, 8) }),
    ]);
    expect([...groups.keys()]).toEqual(['2026-11-12', '2026-11-13']);
    expect(groups.get('2026-11-12')?.map((event) => event.id)).toEqual(['early', 'late']);
  });

  it('returns an empty map for no events', () => {
    expect(groupEventsByDay([]).size).toBe(0);
  });
});

describe('isUrgent', () => {
  it('flags exams and assignments due within 24 hours', () => {
    expect(isUrgent(makeEvent({ type: 'prova', starts_at: at(12, 11) }), now)).toBe(true);
    expect(isUrgent(makeEvent({ type: 'trabalho', starts_at: at(11, 13) }), now)).toBe(true);
  });

  it('ignores other event types', () => {
    expect(isUrgent(makeEvent({ type: 'atividade', starts_at: at(11, 13) }), now)).toBe(false);
    expect(isUrgent(makeEvent({ type: 'outro', starts_at: at(11, 13) }), now)).toBe(false);
  });

  it('ignores events further away or already started', () => {
    expect(isUrgent(makeEvent({ starts_at: at(12, 13) }), now)).toBe(false);
    expect(isUrgent(makeEvent({ starts_at: at(11, 11) }), now)).toBe(false);
  });

  it('includes an event exactly 24 hours away', () => {
    expect(isUrgent(makeEvent({ starts_at: at(12, 12) }), now)).toBe(true);
  });
});

describe('eventColor', () => {
  it('uses the urgent red when the event is urgent', () => {
    expect(eventColor(makeEvent({ starts_at: at(11, 15) }), now)).toBe(urgentColor);
  });

  it('uses the type color otherwise', () => {
    expect(eventColor(makeEvent({ type: 'atividade', starts_at: at(11, 15) }), now)).toBe(
      eventTypeColors.atividade,
    );
    expect(eventColor(makeEvent({ type: 'prova', starts_at: at(20, 9) }), now)).toBe(eventTypeColors.prova);
  });
});

describe('upcomingEvents', () => {
  it('drops past events and sorts the rest, soonest first', () => {
    const list = upcomingEvents(
      [
        makeEvent({ id: 'next-week', starts_at: at(18, 9) }),
        makeEvent({ id: 'past', starts_at: at(10, 9) }),
        makeEvent({ id: 'today', starts_at: at(11, 12) }),
        makeEvent({ id: 'tomorrow', starts_at: at(12, 9) }),
      ],
      now,
    );
    expect(list.map((event) => event.id)).toEqual(['today', 'tomorrow', 'next-week']);
  });
});
