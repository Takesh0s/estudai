import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

import { useData } from '../../contexts/DataContext';
import { snoozeReminder } from '../../lib/notifications';
import { makeEvent, makeProfile } from '../../test/factories';
import type { AppStackParamList } from '../types';
import { useReminderResponses } from '../useReminderResponses';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  useLastNotificationResponse: jest.fn(),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  clearLastNotificationResponseAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ profile: mockProfile }) }));
jest.mock('../../contexts/DataContext', () => ({ useData: jest.fn() }));
jest.mock('../../lib/notifications', () => ({
  ...jest.requireActual('../../lib/notifications'),
  snoozeReminder: jest.fn(),
}));

const mockProfile = makeProfile();
const event = makeEvent({ id: 'p1', starts_at: new Date(2026, 10, 20, 9, 0).toISOString() });
const navigate = jest.fn();
const navigationRef = { navigate } as unknown as NavigationContainerRefWithCurrent<AppStackParamList>;

function respond(actionIdentifier: string, data: Record<string, unknown> = { eventId: 'p1' }) {
  jest.mocked(Notifications.useLastNotificationResponse).mockReturnValue({
    actionIdentifier,
    notification: { date: 1, request: { identifier: 'event-p1', content: { data } } },
  } as unknown as Notifications.NotificationResponse);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(useData).mockReturnValue({ loading: false, events: [event], subjects: [] } as never);
});

it('opens the day of the event when the notification is tapped', async () => {
  respond('expo.modules.notifications.actions.DEFAULT');
  await renderHook(() => useReminderResponses(navigationRef, true));
  expect(navigate).toHaveBeenCalledWith('Tabs', { screen: 'Schedule', params: { date: '2026-11-20' } });
  expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('event-p1');
  expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalled();
});

it('does the same for "Ver na agenda"', async () => {
  respond('ver');
  await renderHook(() => useReminderResponses(navigationRef, true));
  expect(navigate).toHaveBeenCalledWith('Tabs', { screen: 'Schedule', params: { date: '2026-11-20' } });
});

it('postpones the reminder and confirms the new time', async () => {
  jest.mocked(snoozeReminder).mockResolvedValue(new Date(2026, 10, 19, 21, 0));
  respond('adiar');
  await renderHook(() => useReminderResponses(navigationRef, true));
  expect(snoozeReminder).toHaveBeenCalledWith(event, [], mockProfile);
  await waitFor(() =>
    expect(Alert.alert).toHaveBeenCalledWith('Lembrete adiado', 'O Estudaí vai avisar de novo às 21:00.'),
  );
  expect(navigate).not.toHaveBeenCalled();
});

it('explains when the event starts too soon to postpone', async () => {
  jest.mocked(snoozeReminder).mockResolvedValue(null);
  respond('adiar');
  await renderHook(() => useReminderResponses(navigationRef, true));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Não dá para adiar', expect.any(String)));
});

it('waits until the app and the events are loaded', async () => {
  respond('ver');
  jest.mocked(useData).mockReturnValue({ loading: true, events: [], subjects: [] } as never);
  const { rerender } = await renderHook<void, { ready: boolean }>(
    ({ ready }) => useReminderResponses(navigationRef, ready),
    { initialProps: { ready: false } },
  );
  expect(navigate).not.toHaveBeenCalled();

  jest.mocked(useData).mockReturnValue({ loading: false, events: [event], subjects: [] } as never);
  await rerender({ ready: true });
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('handles each tap only once', async () => {
  // A new events array on every render makes the effect run again.
  jest.mocked(useData).mockImplementation(() => ({ loading: false, events: [event], subjects: [] }) as never);
  respond('ver');
  const { rerender } = await renderHook(() => useReminderResponses(navigationRef, true));
  await rerender({});
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('ignores notifications that are not reminders', async () => {
  respond('expo.modules.notifications.actions.DEFAULT', {});
  await renderHook(() => useReminderResponses(navigationRef, true));
  expect(navigate).not.toHaveBeenCalled();
  expect(Notifications.dismissNotificationAsync).not.toHaveBeenCalled();
});

it('opens the agenda without a date when the event was deleted', async () => {
  jest.mocked(useData).mockReturnValue({ loading: false, events: [], subjects: [] } as never);
  respond('ver');
  await renderHook(() => useReminderResponses(navigationRef, true));
  expect(navigate).toHaveBeenCalledWith('Tabs', { screen: 'Schedule', params: undefined });
});
