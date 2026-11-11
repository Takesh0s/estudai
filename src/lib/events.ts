import { eventTypeColors, urgentColor } from '../theme';
import type { StudyEvent } from './database.types';
import { toDateKey } from './dates';

export const eventStart = (event: StudyEvent) => new Date(event.starts_at);

/** Groups events by local day (YYYY-MM-DD), keeping each day sorted by time. */
export function groupEventsByDay(events: StudyEvent[]) {
  const map = new Map<string, StudyEvent[]>();
  for (const event of events) {
    const key = toDateKey(eventStart(event));
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }
  return map;
}

const DAY_MS = 86_400_000;

/** Exams and assignments due in the next 24 hours get the red "urgent" accent. */
export function isUrgent(event: StudyEvent, now: Date = new Date()) {
  if (event.type !== 'prova' && event.type !== 'trabalho') return false;
  const diff = eventStart(event).getTime() - now.getTime();
  return diff >= 0 && diff <= DAY_MS;
}

export function eventColor(event: StudyEvent, now: Date = new Date()): string {
  return isUrgent(event, now) ? urgentColor : eventTypeColors[event.type];
}

/** Upcoming events (not yet started), soonest first. */
export function upcomingEvents(events: StudyEvent[], now: Date = new Date()) {
  return events
    .filter((event) => eventStart(event).getTime() >= now.getTime())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
