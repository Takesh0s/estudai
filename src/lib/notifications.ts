import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { Profile, StudyEvent, Subject } from './database.types';
import { addDays, daysBetween, formatShortDate, formatTime, startOfDay, timeStringToDate } from './dates';
import { eventStart } from './events';
import { eventTypeLabels } from './labels';

const CHANNEL_DEFAULT = 'lembretes';
const CHANNEL_HIGH = 'lembretes-prioridade-alta';
// iOS keeps at most 64 pending local notifications per app; stay below that.
const MAX_SCHEDULED = 60;

// Reminders carry two buttons. Category ids may not contain ':' or '-'.
export const REMINDER_CATEGORY = 'lembrete';
export const ACTION_SNOOZE = 'adiar';
export const ACTION_OPEN = 'ver';
export const SNOOZE_MINUTES = 60;

// Scheduled reminders are rebuilt on every sync; snoozed ones are not, so a
// change to any event does not wipe a reminder the user postponed.
const REMINDER_PREFIX = 'event-';
const SNOOZE_PREFIX = 'snooze-';

/** Data attached to every reminder, read back when the user interacts with it. */
export type ReminderData = { eventId: string };

const isSupported = Platform.OS !== 'web';

if (isSupported) {
  // Without a handler, notifications are silently dropped while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

type ReminderPrefs = { enabled: boolean; daysBefore: number; time: string };

/** Exams use their own reminder settings; everything else shares the assignment ones. */
function prefsFor(event: StudyEvent, profile: Profile): ReminderPrefs {
  if (event.type === 'prova') {
    return {
      enabled: profile.exam_reminder_enabled,
      daysBefore: profile.exam_reminder_days_before,
      time: profile.exam_reminder_time,
    };
  }
  return {
    enabled: profile.assignment_reminder_enabled,
    daysBefore: profile.assignment_reminder_days_before,
    time: profile.assignment_reminder_time,
  };
}

/** True when the event will notify: its own switch and the profile switch for its type. */
export function hasActiveReminder(event: StudyEvent, profile: Profile | null) {
  if (!event.reminder_enabled) return false;
  if (!profile) return true;
  return prefsFor(event, profile).enabled;
}

/** When the notification for `event` should fire, or null if it is off or already past. */
export function reminderDate(event: StudyEvent, profile: Profile, now: Date = new Date()) {
  if (!hasActiveReminder(event, profile)) return null;
  const prefs = prefsFor(event, profile);
  const day = addDays(startOfDay(eventStart(event)), -prefs.daysBefore);
  const when = timeStringToDate(prefs.time, day);
  return when.getTime() > now.getTime() ? when : null;
}

export async function ensureNotificationPermission() {
  if (!isSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureCategory() {
  // Both buttons open the app: on Android, a button that does not open it is
  // only handled by a background task, and the tapped notification stays in the tray.
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    { identifier: ACTION_SNOOZE, buttonTitle: 'Adiar 1 hora', options: { opensAppToForeground: true } },
    { identifier: ACTION_OPEN, buttonTitle: 'Ver na agenda', options: { opensAppToForeground: true } },
  ]);
}

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_DEFAULT, {
    name: 'Lembretes',
    importance: AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_HIGH, {
    name: 'Lembretes (prioridade alta)',
    importance: AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** When the event happens, worded from the moment the notification is shown. */
function describeWhen(event: StudyEvent, shownAt: Date) {
  const start = eventStart(event);
  const time = formatTime(start);
  const days = daysBetween(shownAt, start);
  if (days === 0) return `Hoje às ${time}`;
  if (days === 1) return `Amanhã às ${time}`;
  return `Em ${days} dias, ${formatShortDate(start)} às ${time}`;
}

function reminderContent(
  event: StudyEvent,
  subjects: Subject[],
  shownAt: Date,
): Notifications.NotificationContentInput {
  const subjectName = subjects.find((subject) => subject.id === event.subject_id)?.name;
  const data: ReminderData = { eventId: event.id };
  return {
    title: `${eventTypeLabels[event.type]}: ${event.title}`,
    body: [describeWhen(event, shownAt), subjectName].filter(Boolean).join(' · '),
    categoryIdentifier: REMINDER_CATEGORY,
    data,
  };
}

function channelFor(profile: Profile | null) {
  return profile?.high_priority_notifications ? CHANNEL_HIGH : CHANNEL_DEFAULT;
}

async function cancelScheduledReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (request.identifier.startsWith(REMINDER_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}

// Syncs run one after another: cancelling while another run is still scheduling
// would leave duplicates or drop reminders.
let queue: Promise<void> = Promise.resolve();

/**
 * Makes the device's scheduled reminders match the current events and
 * reminder preferences: cancels them, then schedules the upcoming ones.
 * Snoozed reminders are left alone. It never asks for permission itself
 * (see ensureNotificationPermission).
 */
export function syncReminders(
  events: StudyEvent[],
  subjects: Subject[],
  profile: Profile | null,
): Promise<void> {
  if (!isSupported) return Promise.resolve();
  queue = queue
    .catch(() => {})
    .then(async () => {
      await cancelScheduledReminders();
      if (!profile) return;
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) return;
      await ensureChannels();
      await ensureCategory();

      const now = new Date();
      const due = events
        .map((event) => ({ event, when: reminderDate(event, profile, now) }))
        .filter((item): item is { event: StudyEvent; when: Date } => item.when !== null)
        .sort((a, b) => a.when.getTime() - b.when.getTime())
        .slice(0, MAX_SCHEDULED);

      for (const { event, when } of due) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${REMINDER_PREFIX}${event.id}`,
          content: reminderContent(event, subjects, when),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            channelId: channelFor(profile),
          },
        });
      }
    });
  return queue;
}

/**
 * Shows the reminder for `event` again in SNOOZE_MINUTES. Returns when it will
 * show, or null when the event starts before that and there is nothing to postpone.
 */
export async function snoozeReminder(
  event: StudyEvent,
  subjects: Subject[],
  profile: Profile | null,
  now: Date = new Date(),
): Promise<Date | null> {
  const when = new Date(now.getTime() + SNOOZE_MINUTES * 60_000);
  if (eventStart(event).getTime() <= when.getTime()) return null;
  await Notifications.scheduleNotificationAsync({
    identifier: `${SNOOZE_PREFIX}${event.id}`,
    content: reminderContent(event, subjects, when),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: channelFor(profile),
    },
  });
  return when;
}

/** The event a reminder belongs to, or null for any other notification. */
export function reminderEventId(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Partial<ReminderData> | null;
  return typeof data?.eventId === 'string' ? data.eventId : null;
}
