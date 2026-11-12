import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatTime, toDateKey } from '../lib/dates';
import { eventStart } from '../lib/events';
import { ACTION_SNOOZE, reminderEventId, snoozeReminder } from '../lib/notifications';
import type { AppStackParamList } from './types';

/**
 * Acts on taps on a reminder: "Adiar 1 hora" schedules it again, while the
 * notification itself or "Ver na agenda" opens the day of the event.
 *
 * useLastNotificationResponse also returns the tap that launched the app, so
 * it works when the app was closed; the response is handled only once the
 * app stack and the events are loaded.
 */
export function useReminderResponses(
  navigationRef: NavigationContainerRefWithCurrent<AppStackParamList>,
  ready: boolean,
) {
  const response = Notifications.useLastNotificationResponse();
  const { profile } = useAuth();
  const { loading, events, subjects } = useData();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || loading || !response) return;
    const eventId = reminderEventId(response);
    if (!eventId) return;

    const { request, date } = response.notification;
    const key = `${request.identifier}:${response.actionIdentifier}:${date}`;
    if (handled.current === key) return;
    handled.current = key;

    // Buttons do not remove the notification on Android, so remove it here.
    Notifications.dismissNotificationAsync(request.identifier).catch(() => {});
    Notifications.clearLastNotificationResponseAsync().catch(() => {});

    const event = events.find((item) => item.id === eventId);

    if (response.actionIdentifier === ACTION_SNOOZE) {
      if (!event) {
        Alert.alert('Evento não encontrado', 'Ele foi excluído da agenda, então não há o que adiar.');
        return;
      }
      snoozeReminder(event, subjects, profile)
        .then((until) => {
          if (until) {
            Alert.alert('Lembrete adiado', `O Estudaí vai avisar de novo às ${formatTime(until)}.`);
          } else {
            Alert.alert('Não dá para adiar', 'O evento começa antes de uma hora a partir de agora.');
          }
        })
        .catch(() => Alert.alert('Não foi possível adiar', 'Tente de novo em instantes.'));
      return;
    }

    navigationRef.navigate('Tabs', {
      screen: 'Schedule',
      params: event ? { date: toDateKey(eventStart(event)) } : undefined,
    });
  }, [ready, loading, response, events, subjects, profile, navigationRef]);
}
