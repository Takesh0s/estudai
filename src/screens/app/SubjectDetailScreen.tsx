import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DateEventCard } from '../../components/EventCards';
import { Icon } from '../../components/icons/Icon';
import {
  AppText,
  BackButton,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  Notice,
  ProgressBar,
  Screen,
  TextField,
} from '../../components/ui';
import { useData } from '../../contexts/DataContext';
import type { ContentStatus } from '../../lib/database.types';
import { upcomingEvents } from '../../lib/events';
import { contentStatusLabels, contentStatusOrder, plural } from '../../lib/labels';
import type { AppScreenProps } from '../../navigation/types';
import { radius, spacing, useTheme } from '../../theme';

type Filter = ContentStatus | 'todos';

export function SubjectDetailScreen({ navigation, route }: AppScreenProps<'SubjectDetail'>) {
  const { subjectId } = route.params;
  const { colors } = useTheme();
  const { subjects, contents, events, addContent, setContentStatus, deleteContent } = useData();

  const subject = subjects.find((item) => item.id === subjectId);
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<Filter>('todos');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subjectContents = useMemo(
    () => contents.filter((content) => content.subject_id === subjectId),
    [contents, subjectId],
  );
  const counts = useMemo(() => {
    const result: Record<ContentStatus, number> = { a_estudar: 0, estudando: 0, revisado: 0 };
    for (const content of subjectContents) result[content.status] += 1;
    return result;
  }, [subjectContents]);
  const nextEvents = useMemo(
    () => upcomingEvents(events.filter((event) => event.subject_id === subjectId)).slice(0, 3),
    [events, subjectId],
  );

  // The subject is gone (deleted from the form): nothing left to show here.
  if (!subject) {
    return (
      <Screen>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState icon="livro" title="Matéria não encontrada" description="Ela pode ter sido excluída." />
      </Screen>
    );
  }

  const visible =
    filter === 'todos' ? subjectContents : subjectContents.filter((item) => item.status === filter);
  const total = subjectContents.length;

  async function handleAdd() {
    const text = title.trim();
    if (text.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      await addContent(subjectId, text);
      setTitle('');
    } catch {
      setError('Não foi possível adicionar o conteúdo. Tente de novo.');
    } finally {
      setAdding(false);
    }
  }

  async function handleStatus(id: string, status: ContentStatus) {
    setError(null);
    try {
      await setContentStatus(id, status);
    } catch {
      setError('Não foi possível atualizar o status. Tente de novo.');
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteContent(pendingDelete);
      setPendingDelete(null);
    } catch {
      setPendingDelete(null);
      setError('Não foi possível excluir o conteúdo. Tente de novo.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar matéria"
          hitSlop={8}
          onPress={() => navigation.navigate('SubjectForm', { subjectId })}
          style={styles.iconButton}
        >
          <Icon name="editar" size={24} color={colors.text.link} />
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: subject.color }]} />
        <View style={styles.flex}>
          <AppText variant="screenTitle" accessibilityRole="header">
            {subject.name}
          </AppText>
          {subject.teacher ? (
            <AppText variant="caption" tone="secondary">
              {subject.teacher}
            </AppText>
          ) : null}
        </View>
      </View>

      <Card style={styles.summary}>
        <AppText variant="label">
          {total === 0
            ? 'Nenhum conteúdo cadastrado'
            : `${counts.revisado} de ${plural(total, 'conteúdo revisado', 'conteúdos revisados')}`}
        </AppText>
        <ProgressBar value={total === 0 ? 0 : counts.revisado / total} color={subject.color} height={10} />
        <AppText variant="caption" tone="secondary">
          {counts.a_estudar} a estudar · {counts.estudando} estudando · {counts.revisado} revisados
        </AppText>
      </Card>

      <View style={styles.section}>
        <AppText variant="label" tone="secondary">
          Conteúdos
        </AppText>
        <TextField
          placeholder="Novo conteúdo, ex.: Hooks do React"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <Button label="Adicionar conteúdo" onPress={handleAdd} loading={adding} disabled={title.trim().length === 0} />
        {error ? <Notice tone="error" message={error} /> : null}
      </View>

      {total > 0 ? (
        <View style={styles.filters}>
          <Chip label="Todos" size="small" selected={filter === 'todos'} onPress={() => setFilter('todos')} />
          {contentStatusOrder.map((status) => (
            <Chip
              key={status}
              size="small"
              label={contentStatusLabels[status]}
              selected={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.list}>
        {visible.map((content) => (
          <Card key={content.id} style={styles.content}>
            <View style={styles.contentHeader}>
              <AppText
                variant="bodyStrong"
                tone={content.status === 'revisado' ? 'secondary' : 'primary'}
                style={[styles.flex, content.status === 'revisado' && styles.strike]}
              >
                {content.title}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Excluir ${content.title}`}
                hitSlop={8}
                onPress={() => setPendingDelete(content.id)}
                style={styles.iconButton}
              >
                <Icon name="excluir" size={22} color={colors.text.secondary} />
              </Pressable>
            </View>
            <View style={styles.statusRow}>
              {contentStatusOrder.map((status) => (
                <Chip
                  key={status}
                  size="small"
                  label={contentStatusLabels[status]}
                  selected={content.status === status}
                  onPress={() => handleStatus(content.id, status)}
                />
              ))}
            </View>
          </Card>
        ))}
        {total > 0 && visible.length === 0 ? (
          <AppText tone="secondary" align="center">
            Nenhum conteúdo com esse status.
          </AppText>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="label" tone="secondary">
            Próximas datas
          </AppText>
          <AppText
            variant="bodyStrong"
            tone="link"
            accessibilityRole="link"
            onPress={() => navigation.navigate('EventForm', { subjectId })}
          >
            + Adicionar
          </AppText>
        </View>
        {nextEvents.length === 0 ? (
          <AppText variant="caption" tone="secondary">
            Nenhuma prova ou trabalho marcado para esta matéria.
          </AppText>
        ) : (
          nextEvents.map((event) => (
            <DateEventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('EventForm', { eventId: event.id })}
            />
          ))
        )}
      </View>

      <ConfirmDialog
        visible={pendingDelete !== null}
        icon="excluir"
        title="Excluir conteúdo?"
        message="Esse conteúdo e o status de estudo dele serão apagados."
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: radius.pill },
  summary: { gap: spacing.sm, marginTop: spacing.lg },
  section: { gap: spacing.md, marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  list: { gap: spacing.md, marginTop: spacing.lg },
  content: { gap: spacing.md },
  contentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  strike: { textDecorationLine: 'line-through' },
});
