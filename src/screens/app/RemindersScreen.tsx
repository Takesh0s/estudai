import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppText,
  BackButton,
  Button,
  Card,
  Chip,
  DateTimeField,
  Notice,
  Screen,
  Toggle,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { dateToTimeString, timeStringToDate } from '../../lib/dates';
import { daysBeforeLabel } from '../../lib/labels';
import { ensureNotificationPermission } from '../../lib/notifications';
import type { AppScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

type Draft = { enabled: boolean; days: number; time: Date };

type ReminderCardProps = {
  title: string;
  description: string;
  draft: Draft;
  onChange: (draft: Draft) => void;
};

function ReminderCard({ title, description, draft, onChange }: ReminderCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <AppText variant="highlight">{title}</AppText>
          <AppText variant="caption" tone="secondary">
            {description}
          </AppText>
        </View>
        <Toggle
          accessibilityLabel={`Lembretes de ${title.toLowerCase()}`}
          value={draft.enabled}
          onValueChange={(enabled) => onChange({ ...draft, enabled })}
        />
      </View>
      {draft.enabled ? (
        <>
          <View style={styles.group}>
            <AppText variant="label">Avisar</AppText>
            <View style={styles.chipRow}>
              {DAY_OPTIONS.map((days) => (
                <Chip
                  key={days}
                  size="small"
                  label={daysBeforeLabel(days)}
                  selected={draft.days === days}
                  onPress={() => onChange({ ...draft, days })}
                />
              ))}
            </View>
          </View>
          <DateTimeField
            label="Horário do aviso"
            mode="time"
            value={draft.time}
            onChange={(time) => onChange({ ...draft, time })}
          />
        </>
      ) : null}
    </Card>
  );
}

export function RemindersScreen({ navigation }: AppScreenProps<'Reminders'>) {
  const { profile, updateProfile } = useAuth();

  const [exam, setExam] = useState<Draft>({
    enabled: profile?.exam_reminder_enabled ?? true,
    days: profile?.exam_reminder_days_before ?? 1,
    time: timeStringToDate(profile?.exam_reminder_time ?? '23:59'),
  });
  const [work, setWork] = useState<Draft>({
    enabled: profile?.assignment_reminder_enabled ?? true,
    days: profile?.assignment_reminder_days_before ?? 1,
    time: timeStringToDate(profile?.assignment_reminder_time ?? '23:59'),
  });
  const [highPriority, setHighPriority] = useState(profile?.high_priority_notifications ?? false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setFormError(null);
    setSaving(true);
    try {
      await updateProfile({
        exam_reminder_enabled: exam.enabled,
        exam_reminder_days_before: exam.days,
        exam_reminder_time: dateToTimeString(exam.time),
        assignment_reminder_enabled: work.enabled,
        assignment_reminder_days_before: work.days,
        assignment_reminder_time: dateToTimeString(work.time),
        high_priority_notifications: highPriority,
      });
      // Saving updates the profile, and the data provider reschedules every notification.
      if (exam.enabled || work.enabled) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notificações desativadas',
            'As preferências foram salvas, mas o aparelho não vai avisar você. Ative as notificações do Estudaí nas configurações do sistema.',
          );
          return;
        }
      }
      navigation.goBack();
    } catch {
      setFormError('Não foi possível salvar as preferências. Verifique a conexão e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.header}>
          <AppText variant="screenTitle" accessibilityRole="header">
            Lembretes
          </AppText>
          <AppText tone="secondary">
            Escolha quando o Estudaí avisa sobre as datas da agenda. O aviso chega mesmo com o app
            fechado.
          </AppText>
        </View>

        <ReminderCard
          title="Provas"
          description="Avisos de eventos do tipo prova."
          draft={exam}
          onChange={setExam}
        />
        <ReminderCard
          title="Trabalhos"
          description="Trabalhos, atividades e outras datas."
          draft={work}
          onChange={setWork}
        />

        <Card style={styles.cardHeader}>
          <View style={styles.flex}>
            <AppText variant="highlight">Prioridade alta</AppText>
            <AppText variant="caption" tone="secondary">
              No Android, os avisos usam a importância máxima, com som e destaque na tela.
            </AppText>
          </View>
          <Toggle
            accessibilityLabel="Notificações de prioridade alta"
            value={highPriority}
            onValueChange={setHighPriority}
          />
        </Card>

        <Notice message="Cada evento também tem o próprio botão de lembrete: se ele estiver desligado, nenhum aviso é enviado, mesmo com o tipo ativado aqui." />
        {formError ? <Notice tone="error" message={formError} /> : null}
        <Button label="Salvar" onPress={handleSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: spacing.lg },
  header: { gap: spacing.sm },
  card: { gap: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  group: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
