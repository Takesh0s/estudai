import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { makeEvent, makeProfile, makeSubject } from '../../test/factories';
import {
  ACTION_OPEN,
  ACTION_SNOOZE,
  hasActiveReminder,
  REMINDER_CATEGORY,
  reminderDate,
  START_CATEGORY,
  startReminderDate,
  reminderEventId,
  sendTestReminder,
  snoozeReminder,
  syncReminders,
} from '../notifications';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, MAX: 5 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const mocked = jest.mocked(Notifications);

// Wednesday, 11 Nov 2026, 10:00.
const now = new Date(2026, 10, 11, 10, 0);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute).toISOString();
const scheduledIds = () => mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request.identifier);
const pending = (...ids: string[]) => ids.map((identifier) => ({ identifier }));

describe('hasActiveReminder', () => {
  it('needs both the event switch and the profile switch for its type', () => {
    const profile = makeProfile({ exam_reminder_enabled: false });
    expect(hasActiveReminder(makeEvent({ type: 'prova' }), profile)).toBe(false);
    expect(hasActiveReminder(makeEvent({ type: 'trabalho' }), profile)).toBe(true);
    expect(hasActiveReminder(makeEvent({ reminder_enabled: false }), makeProfile())).toBe(false);
  });

  it('assumes the reminder is on while the profile is still loading', () => {
    expect(hasActiveReminder(makeEvent(), null)).toBe(true);
  });
});

describe('reminderDate', () => {
  it('uses the exam settings for exams', () => {
    // Exam on the 20th; profile: 1 day before at 20:00.
    const date = reminderDate(makeEvent({ type: 'prova', starts_at: at(20, 9) }), makeProfile(), now);
    expect(date).toEqual(new Date(2026, 10, 19, 20, 0));
  });

  it('uses the assignment settings for every other type', () => {
    // Profile: 2 days before at 18:30.
    for (const type of ['trabalho', 'atividade', 'outro'] as const) {
      const date = reminderDate(makeEvent({ type, starts_at: at(20, 23, 59) }), makeProfile(), now);
      expect(date).toEqual(new Date(2026, 10, 18, 18, 30));
    }
  });

  it('fires on the day itself when the lead time is zero', () => {
    const profile = makeProfile({ exam_reminder_days_before: 0, exam_reminder_time: '07:00:00' });
    expect(reminderDate(makeEvent({ starts_at: at(12, 9) }), profile, now)).toEqual(new Date(2026, 10, 12, 7, 0));
  });

  it('crosses month boundaries', () => {
    const profile = makeProfile({ exam_reminder_days_before: 3 });
    const date = reminderDate(makeEvent({ starts_at: new Date(2026, 11, 2, 9).toISOString() }), profile, now);
    expect(date).toEqual(new Date(2026, 10, 29, 20, 0));
  });

  it('returns null when the reminder time has already passed', () => {
    // Exam tomorrow; the reminder would have been today at 08:00, before `now`.
    const profile = makeProfile({ exam_reminder_time: '08:00:00', exam_reminder_days_before: 1 });
    expect(reminderDate(makeEvent({ starts_at: at(12, 9) }), profile, now)).toBeNull();
  });

  it('returns null when the reminder is off', () => {
    expect(reminderDate(makeEvent({ reminder_enabled: false }), makeProfile(), now)).toBeNull();
  });

  it('returns null when it would only fire after the event has started', () => {
    // Same day at 13:05 for an exam at 09:00.
    const profile = makeProfile({ exam_reminder_days_before: 0, exam_reminder_time: '13:05:00' });
    expect(reminderDate(makeEvent({ starts_at: at(12, 9) }), profile, now)).toBeNull();
  });
});

describe('startReminderDate', () => {
  it('fires when the event starts', () => {
    expect(startReminderDate(makeEvent({ starts_at: at(11, 10, 30) }), makeProfile(), now)).toEqual(
      new Date(2026, 10, 11, 10, 30),
    );
  });

  it('returns null for events that already started or have the reminder off', () => {
    expect(startReminderDate(makeEvent({ starts_at: at(11, 9) }), makeProfile(), now)).toBeNull();
    expect(startReminderDate(makeEvent({ starts_at: at(20, 9), reminder_enabled: false }), makeProfile(), now)).toBeNull();
    const profile = makeProfile({ exam_reminder_enabled: false });
    expect(startReminderDate(makeEvent({ type: 'prova', starts_at: at(20, 9) }), profile, now)).toBeNull();
  });
});

describe('syncReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now, doNotFake: ['nextTick', 'setImmediate'] });
    mocked.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue([] as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cancels the scheduled reminders and schedules nothing when signed out', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue(pending('event-a', 'event-b') as never);
    await syncReminders([makeEvent()], [], null);
    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['event-a'], ['event-b']]);
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('keeps reminders the user postponed', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue(pending('event-a', 'snooze-b') as never);
    await syncReminders([], [], makeProfile());
    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['event-a']]);
  });

  it('registers the reminder buttons, both opening the app', async () => {
    await syncReminders([], [], makeProfile());
    expect(mocked.setNotificationCategoryAsync).toHaveBeenCalledWith(REMINDER_CATEGORY, [
      { identifier: ACTION_SNOOZE, buttonTitle: 'Adiar 1 hora', options: { opensAppToForeground: true } },
      { identifier: ACTION_OPEN, buttonTitle: 'Ver na agenda', options: { opensAppToForeground: true } },
    ]);
    expect(mocked.setNotificationCategoryAsync).toHaveBeenCalledWith(START_CATEGORY, [
      { identifier: ACTION_OPEN, buttonTitle: 'Ver na agenda', options: { opensAppToForeground: true } },
    ]);
  });

  it('schedules nothing without notification permission', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false } as never);
    await syncReminders([makeEvent({ starts_at: at(20, 9) })], [], makeProfile());
    expect(mocked.getAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules an advance reminder and one at the event time, with readable messages', async () => {
    const subject = makeSubject({ id: 'calc', name: 'Cálculo' });
    await syncReminders(
      [makeEvent({ id: 'p1', title: 'P1', subject_id: 'calc', starts_at: at(20, 9) })],
      [subject],
      makeProfile(),
    );

    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'event-p1-start',
      content: {
        title: 'Prova: P1',
        body: 'Agora, às 09:00 · Cálculo',
        categoryIdentifier: START_CATEGORY,
        data: { eventId: 'p1' },
      },
      trigger: { type: 'date', date: new Date(2026, 10, 20, 9, 0), channelId: 'lembretes' },
    });
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'event-p1',
      content: {
        title: 'Prova: P1',
        body: 'Amanhã às 09:00 · Cálculo',
        categoryIdentifier: REMINDER_CATEGORY,
        data: { eventId: 'p1' },
      },
      trigger: { type: 'date', date: new Date(2026, 10, 19, 20, 0), channelId: 'lembretes' },
    });
  });

  it('describes the lead time in the message', async () => {
    const profile = makeProfile({
      exam_reminder_days_before: 0,
      exam_reminder_time: '07:00:00',
      assignment_reminder_days_before: 3,
    });
    await syncReminders(
      [
        makeEvent({ id: 'today', type: 'prova', starts_at: at(16, 9) }),
        makeEvent({ id: 'later', type: 'trabalho', title: 'Relatório', starts_at: at(20, 23, 59) }),
      ],
      [],
      profile,
    );

    const bodies = mocked.scheduleNotificationAsync.mock.calls
      .filter(([request]) => !request.identifier?.endsWith('-start'))
      .map(([request]) => request.content.body);
    expect(bodies).toEqual(['Hoje às 09:00', 'Em 3 dias, Sex, 20 de nov às 23:59']);
  });

  it('skips past and disabled reminders and orders the rest by fire time', async () => {
    await syncReminders(
      [
        makeEvent({ id: 'later', starts_at: at(25, 9) }),
        makeEvent({ id: 'past', starts_at: at(1, 9) }),
        makeEvent({ id: 'off', starts_at: at(22, 9), reminder_enabled: false }),
        makeEvent({ id: 'sooner', starts_at: at(15, 9) }),
      ],
      [],
      makeProfile(),
    );

    expect(scheduledIds()).toEqual(['event-sooner', 'event-sooner-start', 'event-later', 'event-later-start']);
  });

  it('still schedules when the buttons cannot be registered', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mocked.setNotificationCategoryAsync.mockRejectedValueOnce(new Error('categories unavailable'));
    await syncReminders([makeEvent({ id: 'p1', starts_at: at(20, 9) })], [], makeProfile());
    expect(scheduledIds()).toEqual(['event-p1', 'event-p1-start']);
  });

  it('falls back to the default Android channel when a channel cannot be created', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mocked.setNotificationChannelAsync.mockRejectedValue(new Error('NullPointerException'));

    await syncReminders([makeEvent({ id: 'p1', starts_at: at(20, 9) })], [], makeProfile());

    expect(scheduledIds()).toEqual(['event-p1', 'event-p1-start']);
    const [request] = mocked.scheduleNotificationAsync.mock.calls[0];
    expect(request.trigger).not.toHaveProperty('channelId');
    mocked.setNotificationChannelAsync.mockReset();
  });

  it('uses the high-priority channel when the profile asks for it', async () => {
    await syncReminders([makeEvent({ starts_at: at(20, 9) })], [], makeProfile({ high_priority_notifications: true }));
    const [request] = mocked.scheduleNotificationAsync.mock.calls[0];
    expect(request.trigger).toEqual(expect.objectContaining({ channelId: 'lembretes-prioridade-alta' }));
  });

  it('keeps below the iOS limit of 64 pending notifications', async () => {
    const events = Array.from({ length: 80 }, (_, index) =>
      makeEvent({ id: `e${index}`, starts_at: new Date(2026, 11, 1 + (index % 28), 9).toISOString() }),
    );
    await syncReminders(events, [], makeProfile());
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(60);
  });

  it('runs one sync at a time', async () => {
    const order: string[] = [];
    mocked.getAllScheduledNotificationsAsync.mockImplementation(async () => {
      order.push('cancel');
      return [];
    });
    mocked.scheduleNotificationAsync.mockImplementation(async (request) => {
      order.push(request.identifier ?? '');
      return request.identifier ?? '';
    });

    await Promise.all([
      syncReminders([makeEvent({ id: 'a', starts_at: at(20, 9) })], [], makeProfile()),
      syncReminders([makeEvent({ id: 'b', starts_at: at(20, 9) })], [], makeProfile()),
    ]);

    expect(order).toEqual(['cancel', 'event-a', 'event-a-start', 'cancel', 'event-b', 'event-b-start']);
  });
});

describe('snoozeReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the reminder again in one hour, worded from that moment', async () => {
    const subject = makeSubject({ id: 'calc', name: 'Cálculo' });
    // Shown at 23:30 the day before; postponed, it appears after midnight on the exam day.
    const shownAt = new Date(2026, 10, 19, 23, 30);
    const event = makeEvent({ id: 'p1', title: 'P1', subject_id: 'calc', starts_at: at(20, 9) });

    const until = await snoozeReminder(event, [subject], makeProfile(), shownAt);

    expect(until).toEqual(new Date(2026, 10, 20, 0, 30));
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'snooze-p1',
      content: {
        title: 'Prova: P1',
        body: 'Hoje às 09:00 · Cálculo',
        categoryIdentifier: REMINDER_CATEGORY,
        data: { eventId: 'p1' },
      },
      trigger: { type: 'date', date: until, channelId: 'lembretes' },
    });
  });

  it('does nothing when the event starts within the hour', async () => {
    const event = makeEvent({ starts_at: at(11, 10, 45) });
    await expect(snoozeReminder(event, [], makeProfile(), now)).resolves.toBeNull();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('keeps the high-priority channel', async () => {
    await snoozeReminder(makeEvent({ starts_at: at(20, 9) }), [], makeProfile({ high_priority_notifications: true }), now);
    const [request] = mocked.scheduleNotificationAsync.mock.calls[0];
    expect(request.trigger).toEqual(expect.objectContaining({ channelId: 'lembretes-prioridade-alta' }));
  });
});

describe('reminderEventId', () => {
  const response = (data: Record<string, unknown> | null) =>
    ({ notification: { request: { content: { data } } } }) as unknown as Notifications.NotificationResponse;

  it('reads the event from the reminder data', () => {
    expect(reminderEventId(response({ eventId: 'p1' }))).toBe('p1');
  });

  it('ignores notifications that are not reminders', () => {
    expect(reminderEventId(response({}))).toBeNull();
    expect(reminderEventId(response(null))).toBeNull();
    expect(reminderEventId(response({ eventId: 42 }))).toBeNull();
  });
});

describe('sendTestReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
  });

  it('shows one reminder now and schedules another, reporting the pending event reminders', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue(
      [{ identifier: 'event-a' }, { identifier: 'event-a-start' }, { identifier: 'test-later' }] as never,
    );
    await expect(sendTestReminder(makeProfile())).resolves.toEqual({ granted: true, upcoming: 2 });

    const [now, later] = mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request);
    expect(now.trigger).toEqual({ channelId: 'lembretes' });
    expect(later.trigger).toEqual(expect.objectContaining({ type: 'date', channelId: 'lembretes' }));
  });

  it('sends nothing without permission', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);
    await expect(sendTestReminder(makeProfile())).resolves.toEqual({ granted: false, upcoming: 0 });
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
