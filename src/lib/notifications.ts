import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { Profile, StudyEvent, Subject } from './database.types';
import { addDays, formatShortDate, formatTime, startOfDay, timeStringToDate } from './dates';
import { eventStart } from './events';
import { eventTypeLabels } from './labels';

const CHANNEL_DEFAULT = 'lembretes';
const CHANNEL_HIGH = 'lembretes-prioridade-alta';
// iOS keeps at most 64 pending local notifications per app; stay below that.
const MAX_SCHEDULED = 60;

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

function describeWhen(event: StudyEvent, daysBefore: number) {
  const start = eventStart(event);
  const time = formatTime(start);
  if (daysBefore === 0) return `Hoje às ${time}`;
  if (daysBefore === 1) return `Amanhã às ${time}`;
  return `Em ${daysBefore} dias, ${formatShortDate(start)} às ${time}`;
}

// Syncs run one after another: cancelling while another run is still scheduling
// would leave duplicates or drop reminders.
let queue: Promise<void> = Promise.resolve();

/**
 * Makes the device's scheduled notifications match the current events and
 * reminder preferences: cancels everything, then schedules the upcoming ones.
 * It never asks for permission itself (see ensureNotificationPermission).
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
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!profile) return;
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) return;
      await ensureChannels();

      const now = new Date();
      const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));
      const due = events
        .map((event) => ({ event, when: reminderDate(event, profile, now) }))
        .filter((item): item is { event: StudyEvent; when: Date } => item.when !== null)
        .sort((a, b) => a.when.getTime() - b.when.getTime())
        .slice(0, MAX_SCHEDULED);

      for (const { event, when } of due) {
        const daysBefore = prefsFor(event, profile).daysBefore;
        const subjectName = event.subject_id ? subjectNames.get(event.subject_id) : undefined;
        const body = [describeWhen(event, daysBefore), subjectName].filter(Boolean).join(' · ');
        await Notifications.scheduleNotificationAsync({
          identifier: `event-${event.id}`,
          content: { title: `${eventTypeLabels[event.type]}: ${event.title}`, body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            channelId: profile.high_priority_notifications ? CHANNEL_HIGH : CHANNEL_DEFAULT,
          },
        });
      }
    });
  return queue;
}
