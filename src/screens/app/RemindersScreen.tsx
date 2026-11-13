import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppText,
  BackButton,
  Button,
  Card,
  DateTimeField,
  Notice,
  Screen,
  StepSlider,
  Toggle,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { dateToTimeString, timeStringToDate } from '../../lib/dates';
import { daysBeforeLabel } from '../../lib/labels';
import { ensureNotificationPermission } from '../../lib/notifications';
import type { AppScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';

// Matches the check constraint on the *_days_before columns in schema.sql.
const MAX_DAYS_BEFORE = 7;

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
          <StepSlider
            label="Aviso antecipado"
            value={draft.days}
            min={0}
            max={MAX_DAYS_BEFORE}
            formatValue={daysBeforeLabel}
            onChange={(days) => onChange({ ...draft, days })}
          />
          <DateTimeField
            label="Horário do aviso antecipado"
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
      // Ask before saving: saving triggers the reschedule, which skips everything
      // while permission is missing and would not run again once it is granted.
      const granted = exam.enabled || work.enabled ? await ensureNotificationPermission() : true;
      await updateProfile({
        exam_reminder_enabled: exam.enabled,
        exam_reminder_days_before: exam.days,
        exam_reminder_time: dateToTimeString(exam.time),
        assignment_reminder_enabled: work.enabled,
        assignment_reminder_days_before: work.days,
        assignment_reminder_time: dateToTimeString(work.time),
        high_priority_notifications: highPriority,
      });
      if (!granted) {
        Alert.alert(
          'Notificações desativadas',
          'As preferências foram salvas, mas o aparelho não vai avisar você. Ative as notificações do Estudaí nas configurações do sistema.',
        );
        return;
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
            O Estudaí avisa na hora de cada evento e também antes, no dia e no horário que você
            escolher aqui. Os avisos chegam mesmo com o app fechado.
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
});
