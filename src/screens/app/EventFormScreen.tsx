import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Chip,
  ConfirmDialog,
  DateTimeField,
  ModalHeader,
  modalEdges,
  Notice,
  Screen,
  TextField,
  Toggle,
} from '../../components/ui';
import { useData } from '../../contexts/DataContext';
import type { EventType } from '../../lib/database.types';
import { fromDateKey, startOfDay } from '../../lib/dates';
import { eventStart } from '../../lib/events';
import { eventTypeLabels, eventTypeOrder } from '../../lib/labels';
import { ensureNotificationPermission } from '../../lib/notifications';
import type { AppScreenProps } from '../../navigation/types';
import { eventTypeColors, spacing } from '../../theme';

/** Exams usually have a set time; the rest are due at the end of the day. */
function defaultTime(type: EventType, base: Date) {
  const date = new Date(base);
  if (type === 'prova') date.setHours(9, 0, 0, 0);
  else date.setHours(23, 59, 0, 0);
  return date;
}

/** Merges the day of `day` with the hours and minutes of `time`. */
function combine(day: Date, time: Date) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes());
}

export function EventFormScreen({ navigation, route }: AppScreenProps<'EventForm'>) {
  const { eventId, date: dateParam, subjectId: subjectParam } = route.params ?? {};
  const { subjects, events, addEvent, updateEvent, deleteEvent } = useData();
  const existing = events.find((event) => event.id === eventId);

  const initialDay = existing
    ? startOfDay(eventStart(existing))
    : dateParam
      ? fromDateKey(dateParam)
      : startOfDay(new Date());

  const [type, setType] = useState<EventType>(existing?.type ?? 'prova');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [day, setDay] = useState(initialDay);
  const [time, setTime] = useState(
    existing ? eventStart(existing) : defaultTime('prova', initialDay),
  );
  const [subjectId, setSubjectId] = useState<string | null>(
    existing?.subject_id ?? subjectParam ?? null,
  );
  const [reminder, setReminder] = useState(existing?.reminder_enabled ?? true);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Changing the type resets the time to that type's default, unless the user already picked one.
  const timeTouched = useRef(Boolean(existing));

  function selectType(next: EventType) {
    setType(next);
    if (!timeTouched.current) setTime(defaultTime(next, day));
  }

  async function handleSave() {
    if (title.trim().length === 0) {
      setTitleError('Digite o título do evento.');
      return;
    }
    setTitleError(undefined);
    setFormError(null);
    setSaving(true);
    try {
      // Ask before saving: saving triggers the reschedule, which skips everything
      // while permission is missing and would not run again once it is granted.
      const granted = reminder ? await ensureNotificationPermission() : true;
      const input = {
        type,
        title: title.trim(),
        starts_at: combine(day, time).toISOString(),
        subject_id: subjectId,
        reminder_enabled: reminder,
      };
      if (existing) await updateEvent(existing.id, input);
      else await addEvent(input);

      if (!granted) {
        Alert.alert(
          'Notificações desativadas',
          'O evento foi salvo, mas o aparelho não vai avisar você. Ative as notificações do Estudaí nas configurações do sistema.',
        );
      }
      navigation.goBack();
    } catch {
      setFormError('Não foi possível salvar o evento. Tente de novo.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    try {
      await deleteEvent(existing.id);
      navigation.goBack();
    } catch {
      setConfirmVisible(false);
      setDeleting(false);
      setFormError('Não foi possível excluir o evento. Tente de novo.');
    }
  }

  return (
    <Screen scroll edges={modalEdges}>
      <View style={styles.form}>
        <ModalHeader
          title={existing ? 'Editar evento' : 'Novo evento'}
          onClose={() => navigation.goBack()}
        />

        <View style={styles.group}>
          <AppText variant="label">Tipo</AppText>
          <View style={styles.chipRow}>
            {eventTypeOrder.map((option) => (
              <Chip
                key={option}
                label={eventTypeLabels[option]}
                dotColor={eventTypeColors[option]}
                selected={type === option}
                onPress={() => selectType(option)}
              />
            ))}
          </View>
        </View>

        <TextField
          label="Título"
          placeholder="Ex.: Prova de Processos de Negócio"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          returnKeyType="done"
          error={titleError}
        />

        {subjects.length > 0 ? (
          <View style={styles.group}>
            <AppText variant="label">Matéria (opcional)</AppText>
            <View style={styles.chipRow}>
              <Chip label="Nenhuma" selected={subjectId === null} onPress={() => setSubjectId(null)} />
              {subjects.map((subject) => (
                <Chip
                  key={subject.id}
                  label={subject.name}
                  dotColor={subject.color}
                  selected={subjectId === subject.id}
                  onPress={() => setSubjectId(subject.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <DateTimeField label="Data" mode="date" value={day} onChange={setDay} />
        <DateTimeField
          label="Horário"
          mode="time"
          value={time}
          onChange={(value) => {
            timeTouched.current = true;
            setTime(value);
          }}
        />

        <View style={styles.reminderRow}>
          <View style={styles.flex}>
            <AppText variant="label">Lembrete</AppText>
            <AppText variant="caption" tone="secondary">
              Receber uma notificação antes. Quando e como avisar fica em Perfil &gt; Lembretes.
            </AppText>
          </View>
          <Toggle accessibilityLabel="Lembrete" value={reminder} onValueChange={setReminder} />
        </View>

        {formError ? <Notice tone="error" message={formError} /> : null}
        <Button label="Salvar" onPress={handleSave} loading={saving} />
        {existing ? (
          <Button
            label="Excluir evento"
            variant="outlineDanger"
            onPress={() => setConfirmVisible(true)}
          />
        ) : null}
      </View>
      <ConfirmDialog
        visible={confirmVisible}
        icon="excluir"
        title="Excluir evento?"
        message="O evento sai da agenda e o lembrete dele é cancelado."
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: spacing.lg },
  group: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
});
