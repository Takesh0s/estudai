import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DataGate } from '../../components/DataGate';
import { Icon } from '../../components/icons/Icon';
import {
  AddButton,
  AppText,
  Card,
  EmptyState,
  ProgressBar,
  Screen,
} from '../../components/ui';
import { useData } from '../../contexts/DataContext';
import { plural } from '../../lib/labels';
import type { TabScreenProps } from '../../navigation/types';
import { radius, spacing, useTheme } from '../../theme';

export function SubjectsScreen({ navigation }: TabScreenProps<'Subjects'>) {
  const { colors } = useTheme();
  const { subjects, contents } = useData();

  // Reviewed vs. total contents per subject, for the progress bars.
  const progress = useMemo(() => {
    const map = new Map<string, { total: number; reviewed: number }>();
    for (const content of contents) {
      const entry = map.get(content.subject_id) ?? { total: 0, reviewed: 0 };
      entry.total += 1;
      if (content.status === 'revisado') entry.reviewed += 1;
      map.set(content.subject_id, entry);
    }
    return map;
  }, [contents]);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="screenTitle" accessibilityRole="header">
          Matérias
        </AppText>
        <AppText variant="caption" tone="secondary">
          {subjects.length === 0
            ? 'Nenhuma matéria cadastrada'
            : plural(subjects.length, 'matéria cadastrada', 'matérias cadastradas')}
        </AppText>
      </View>

      <DataGate>
        {subjects.length === 0 ? (
          <EmptyState
            icon="livro"
            title="Nenhuma matéria ainda"
            description="Adicione as matérias do semestre para acompanhar seus conteúdos e o progresso de estudo."
            actionLabel="Adicionar primeira matéria"
            onAction={() => navigation.navigate('SubjectForm')}
          />
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {subjects.map((subject) => {
                const { total, reviewed } = progress.get(subject.id) ?? { total: 0, reviewed: 0 };
                return (
                  <Card
                    key={subject.id}
                    onPress={() => navigation.navigate('SubjectDetail', { subjectId: subject.id })}
                    accessibilityLabel={`${subject.name}, ${
                      total === 0 ? 'sem conteúdos' : `${reviewed} de ${total} conteúdos revisados`
                    }`}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.dot, { backgroundColor: subject.color }]} />
                      <View style={styles.flex}>
                        <AppText variant="highlight" numberOfLines={2}>
                          {subject.name}
                        </AppText>
                        {subject.teacher ? (
                          <AppText variant="caption" tone="secondary" numberOfLines={1}>
                            {subject.teacher}
                          </AppText>
                        ) : null}
                      </View>
                      <Icon name="avancar" size={22} color={colors.text.secondary} />
                    </View>
                    <ProgressBar value={total === 0 ? 0 : reviewed / total} color={subject.color} />
                    <AppText variant="caption" tone="secondary">
                      {total === 0
                        ? 'Nenhum conteúdo ainda'
                        : `${reviewed} de ${plural(total, 'conteúdo revisado', 'conteúdos revisados')}`}
                    </AppText>
                  </Card>
                );
              })}
            </ScrollView>
            <View style={styles.footer}>
              <AddButton label="Adicionar matéria" onPress={() => navigation.navigate('SubjectForm')} />
            </View>
          </>
        )}
      </DataGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: 2 },
  list: { gap: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  card: { gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 14, height: 14, borderRadius: radius.pill },
  footer: { paddingBottom: spacing.lg },
});
