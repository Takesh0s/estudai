// All helpers work in the device's local time zone, which is what a student sees
// on the calendar. "Date keys" (YYYY-MM-DD) identify a local day and match the
// `date` columns in the database.

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const pad = (value: number) => String(value).padStart(2, '0');

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
export const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

const DAY_MS = 86_400_000;

// Formatting

export function formatLongDate(date: Date = new Date()) {
  return capitalize(
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  );
}

export function formatMonthYear(date: Date = new Date()) {
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${capitalize(month)} ${date.getFullYear()}`;
}

/** "09:30", always 24 hours so it reads the same on every device. */
export function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Seg, 5 de out", with the year only when it is not the current one. */
export function formatShortDate(date: Date, now: Date = new Date()) {
  const base = `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} de ${MONTHS_SHORT[
    date.getMonth()
  ].toLowerCase()}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} de ${date.getFullYear()}`;
}

/** "Hoje", "Amanhã", "Em 3 dias" or "Há 2 dias", counted in calendar days. */
export function relativeDayLabel(date: Date, now: Date = new Date()) {
  const diff = daysBetween(now, date);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  return diff > 0 ? `Em ${diff} dias` : `Há ${-diff} dias`;
}

// Day arithmetic

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + amount,
    date.getHours(),
    date.getMinutes(),
  );
}

/** First day of the month `amount` months away, so Jan 31 + 1 month is Feb 1, never Mar 3. */
export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: Date, to: Date) {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / DAY_MS);
}

/** Sunday of the week that contains `date`. */
export function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -date.getDay());
}

/** The seven days (Sunday to Saturday) of the week that contains `date`. */
export function weekDays(date: Date) {
  const first = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

/**
 * Cells of a month calendar, Sunday first: `null` pads the days of the
 * neighbouring months so the length is always a multiple of 7.
 */
export function monthGrid(year: number, month: number): (Date | null)[] {
  const leading = new Date(year, month, 1).getDay();
  const length = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= length; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Date keys and time strings

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a `YYYY-MM-DD` key (`new Date(key)` would parse it as UTC). */
export function fromDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Combines a `HH:mm` or `HH:mm:ss` database time with a day (today by default). */
export function timeStringToDate(time: string, day: Date = new Date()) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

/** `HH:mm:00`, the format of Postgres `time` columns. */
export function dateToTimeString(date: Date) {
  return `${formatTime(date)}:00`;
}
