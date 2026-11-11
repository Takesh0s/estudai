import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DataGate } from '../../components/DataGate';
import { DateEventCard } from '../../components/EventCards';
import { Icon } from '../../components/icons/Icon';
import {
  AppText,
  Avatar,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Notice,
  Screen,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  addDays,
  formatLongDate,
  formatShortDate,
  formatTime,
  relativeDayLabel,
  startOfDay,
  toDateKey,
} from '../../lib/dates';
import { eventColor, eventStart, isUrgent, upcomingEvents } from '../../lib/events';
import { plural } from '../../lib/labels';
import type { TabScreenProps } from '../../navigation/types';
import { radius, spacing, useTheme } from '../../theme';

/** How far ahead "Próximos dias" looks, counting today. */
const UPCOMING_DAYS = 7;
const UPCOMING_LIMIT = 4;

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { colors } = useTheme();
  const { profile, displayName } = useAuth();
  const { subjects, tasks, events, setTaskDone, deleteTask } = useData();
  const firstName = displayName.split(' ')[0];

  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const todayKey = toDateKey(new Date());

  const subjectName = (id: string | null) => subjects.find((subject) => subject.id === id)?.name;

  const nextExam = useMemo(
    () => upcomingEvents(events).find((event) => event.type === 'prova'),
    [events],
  );

  // Today's tasks, plus anything older that is still open so it does not get lost.
  const listedTasks = useMemo(
    () =>
      tasks.filter((task) => task.due_date === todayKey || (!task.done && task.due_date < todayKey)),
    [tasks, todayKey],
  );
  const todayTasks = listedTasks.filter((task) => task.due_date === todayKey);
  const doneToday = todayTasks.filter((task) => task.done).length;

  const nextDays = useMemo(() => {
    const limit = addDays(startOfDay(new Date()), UPCOMING_DAYS);
    return upcomingEvents(events).filter((event) => eventStart(event).getTime() < limit.getTime());
  }, [events]);

  const isBlank = subjects.length === 0 && events.length === 0 && tasks.length === 0;

  async function handleToggle(id: string, done: boolean) {
    setError(null);
    try {
      await setTaskDone(id, done);
    } catch {
      setError('Não foi possível atualizar a tarefa. Verifique a conexão e tente de novo.');
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTask(pendingDelete);
      setPendingDelete(null);
    } catch {
      setPendingDelete(null);
      setError('Não foi possível excluir a tarefa. Tente de novo.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <AppText variant="caption" tone="secondary">
            {formatLongDate()}
          </AppText>
          <AppText variant="screenTitle" accessibilityRole="header">
            Olá, {firstName}!
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => navigation.navigate('Profile')}
        >
          <Avatar name={displayName} uri={profile?.avatar_url} />
        </Pressable>
      </View>

      <DataGate>
        {isBlank ? (
          <EmptyState
            icon="livro"
            title="Tudo pronto para começar!"
            description="Cadastre sua primeira matéria e organize sua rotina de estudos. Suas tarefas e provas vão aparecer aqui."
            actionLabel="Adicionar primeira matéria"
            onAction={() => navigation.navigate('SubjectForm')}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <AppText variant="label" tone="secondary" style={styles.sectionTitle}>
              Próxima prova
            </AppText>
            {nextExam ? (
              <Card
                onPress={() => navigation.navigate('EventForm', { eventId: nextExam.id })}
                accessibilityLabel={`Próxima prova: ${nextExam.title}`}
                style={[styles.exam, { backgroundColor: colors.background.greenSoft }]}
              >
                <View style={styles.examHeader}>
                  <View style={styles.flex}>
                    <AppText variant="highlight" tone="highlight">
                      {nextExam.title}
                    </AppText>
                    <AppText variant="caption" tone="secondary">
                      {[
                        formatShortDate(eventStart(nextExam)),
                        formatTime(eventStart(nextExam)),
                        subjectName(nextExam.subject_id),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </AppText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: eventColor(nextExam) }]}>
                    <AppText
                      variant="small"
                      style={{ color: isUrgent(nextExam) ? '#FFFFFF' : colors.text.onHighlight }}
                    >
                      {relativeDayLabel(eventStart(nextExam))}
                    </AppText>
                  </View>
                </View>
              </Card>
            ) : (
              <Card style={styles.empty}>
                <AppText tone="secondary">Nenhuma prova marcada.</AppText>
                <AppText
                  variant="bodyStrong"
                  tone="link"
                  accessibilityRole="link"
                  onPress={() => navigation.navigate('EventForm')}
                >
                  + Adicionar prova
                </AppText>
              </Card>
            )}

            <View style={styles.sectionHeader}>
              <View style={styles.flex}>
                <AppText variant="label" tone="secondary">
                  Tarefas de hoje
                </AppText>
                {todayTasks.length > 0 ? (
                  <AppText variant="caption" tone="secondary">
                    {doneToday} de {plural(todayTasks.length, 'concluída', 'concluídas')}
                  </AppText>
                ) : null}
              </View>
              <AppText
                variant="bodyStrong"
                tone="link"
                accessibilityRole="link"
                onPress={() => navigation.navigate('TaskForm', { date: todayKey })}
              >
                + Adicionar
              </AppText>
            </View>
            {error ? <Notice tone="error" message={error} /> : null}
            {listedTasks.length === 0 ? (
              <AppText tone="secondary">Nenhuma tarefa para hoje.</AppText>
            ) : (
              <Card flush style={styles.tasks}>
                {listedTasks.map((task, index) => {
                  const overdue = !task.done && task.due_date < todayKey;
                  const name = subjectName(task.subject_id);
                  return (
                    <View
                      key={task.id}
                      style={[
                        styles.taskRow,
                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.border.default },
                      ]}
                    >
                      <View style={styles.flex}>
                        <Checkbox
                          label={task.title}
                          checked={task.done}
                          strikeWhenChecked
                          onChange={(done) => handleToggle(task.id, done)}
                        />
                        {overdue || name ? (
                          <AppText variant="caption" tone={overdue ? 'danger' : 'secondary'} style={styles.taskNote}>
                            {[overdue ? 'Atrasada' : null, name].filter(Boolean).join(' · ')}
                          </AppText>
                        ) : null}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Excluir ${task.title}`}
                        hitSlop={8}
                        onPress={() => setPendingDelete(task.id)}
                        style={styles.iconButton}
                      >
                        <Icon name="excluir" size={22} color={colors.text.secondary} />
                      </Pressable>
                    </View>
                  );
                })}
              </Card>
            )}

            <View style={styles.sectionHeader}>
              <AppText variant="label" tone="secondary" style={styles.flex}>
                Próximos dias
              </AppText>
              <AppText
                variant="bodyStrong"
                tone="link"
                accessibilityRole="link"
                onPress={() => navigation.navigate('Schedule')}
              >
                Ver agenda
              </AppText>
            </View>
            {nextDays.length === 0 ? (
              <Card style={styles.empty}>
                <AppText tone="secondary">Nada marcado para os próximos {UPCOMING_DAYS} dias.</AppText>
                <AppText
                  variant="bodyStrong"
                  tone="link"
                  accessibilityRole="link"
                  onPress={() => navigation.navigate('EventForm')}
                >
                  + Adicionar evento
                </AppText>
              </Card>
            ) : (
              <View style={styles.list}>
                {nextDays.slice(0, UPCOMING_LIMIT).map((event) => (
                  <DateEventCard
                    key={event.id}
                    event={event}
                    subjectName={subjectName(event.subject_id)}
                    onPress={() => navigation.navigate('EventForm', { eventId: event.id })}
                  />
                ))}
                {nextDays.length > UPCOMING_LIMIT ? (
                  <AppText variant="caption" tone="secondary" align="center">
                    + {plural(nextDays.length - UPCOMING_LIMIT, 'evento', 'eventos')} nesta semana
                  </AppText>
                ) : null}
              </View>
            )}
          </ScrollView>
        )}
      </DataGate>

      <ConfirmDialog
        visible={pendingDelete !== null}
        icon="excluir"
        title="Excluir tarefa?"
        message="A tarefa sai da sua lista."
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { gap: 2 },
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionTitle: { marginBottom: -spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  exam: { borderWidth: 0 },
  examHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  empty: { gap: spacing.sm },
  tasks: { paddingHorizontal: spacing.lg },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  taskNote: { marginLeft: 26 + spacing.md, marginTop: -spacing.xs, marginBottom: spacing.xs },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.md },
});
