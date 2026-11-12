import {
  addDays,
  addMonths,
  dateToTimeString,
  daysBetween,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  formatTime,
  fromDateKey,
  isSameDay,
  monthGrid,
  relativeDayLabel,
  startOfDay,
  startOfWeek,
  timeStringToDate,
  toDateKey,
  weekDays,
} from '../dates';

// Wednesday, 11 Nov 2026, 14:30 local time.
const now = new Date(2026, 10, 11, 14, 30);

describe('formatting', () => {
  it('formats the time in 24 hours with leading zeros', () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
    expect(formatTime(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });

  it('omits the year of a short date only in the current year', () => {
    expect(formatShortDate(new Date(2026, 9, 5), now)).toBe('Seg, 5 de out');
    expect(formatShortDate(new Date(2027, 0, 4), now)).toBe('Seg, 4 de jan de 2027');
  });

  it('capitalizes the long date and the month title', () => {
    expect(formatLongDate(now)).toBe('Quarta-feira, 11 de novembro');
    expect(formatMonthYear(now)).toBe('Novembro 2026');
  });

  it.each([
    [0, 'Hoje'],
    [1, 'Amanhã'],
    [-1, 'Ontem'],
    [3, 'Em 3 dias'],
    [-2, 'Há 2 dias'],
  ])('labels a day %i days away as "%s"', (offset, label) => {
    expect(relativeDayLabel(addDays(now, offset), now)).toBe(label);
  });

  it('counts calendar days, not 24-hour periods', () => {
    const lateTonight = new Date(2026, 10, 11, 23, 59);
    const earlyTomorrow = new Date(2026, 10, 12, 0, 1);
    expect(relativeDayLabel(earlyTomorrow, lateTonight)).toBe('Amanhã');
  });
});

describe('day arithmetic', () => {
  it('moves to local midnight', () => {
    expect(startOfDay(now)).toEqual(new Date(2026, 10, 11));
  });

  it('adds days across month and year boundaries, keeping the time', () => {
    expect(addDays(new Date(2026, 10, 30, 8, 15), 1)).toEqual(new Date(2026, 11, 1, 8, 15));
    expect(addDays(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 1));
    expect(addDays(new Date(2026, 2, 1), -1)).toEqual(new Date(2026, 1, 28));
  });

  it('jumps to the first day of the target month', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 1));
    expect(addMonths(new Date(2026, 0, 15), -1)).toEqual(new Date(2025, 11, 1));
  });

  it('compares days ignoring the time', () => {
    expect(isSameDay(new Date(2026, 10, 11, 0, 0), new Date(2026, 10, 11, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 10, 11), new Date(2026, 10, 12))).toBe(false);
  });

  it('counts whole days in both directions', () => {
    expect(daysBetween(now, new Date(2026, 10, 18))).toBe(7);
    expect(daysBetween(now, new Date(2026, 10, 1))).toBe(-10);
    expect(daysBetween(new Date(2026, 1, 1), new Date(2026, 2, 1))).toBe(28);
  });
});

describe('weeks and months', () => {
  it('starts the week on Sunday', () => {
    expect(startOfWeek(now)).toEqual(new Date(2026, 10, 8));
  });

  it('lists the seven days of the week in order', () => {
    const days = weekDays(now);
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(0);
    expect(days[6]).toEqual(new Date(2026, 10, 14));
  });

  it('pads the month grid to full weeks', () => {
    // November 2026 starts on a Sunday and has 30 days.
    const november = monthGrid(2026, 10);
    expect(november[0]).toEqual(new Date(2026, 10, 1));
    expect(november.filter(Boolean)).toHaveLength(30);
    expect(november.length % 7).toBe(0);

    // February 2026 starts on a Sunday and fits exactly in four rows.
    expect(monthGrid(2026, 1)).toHaveLength(28);

    // August 2026 starts on a Saturday: six empty cells before the 1st.
    const august = monthGrid(2026, 7);
    expect(august.slice(0, 6).every((cell) => cell === null)).toBe(true);
    expect(august[6]).toEqual(new Date(2026, 7, 1));
  });
});

describe('date keys and time strings', () => {
  it('round-trips a date key in local time', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(fromDateKey('2026-01-05')).toEqual(new Date(2026, 0, 5));
  });

  it('combines a database time with a given day', () => {
    const day = new Date(2026, 10, 20);
    expect(timeStringToDate('07:45:00', day)).toEqual(new Date(2026, 10, 20, 7, 45));
    expect(timeStringToDate('23:59', day)).toEqual(new Date(2026, 10, 20, 23, 59));
  });

  it('writes the Postgres time format', () => {
    expect(dateToTimeString(new Date(2026, 0, 1, 8, 5))).toBe('08:05:00');
  });
});
