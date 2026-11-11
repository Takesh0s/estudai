import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  Chip,
  DateTimeField,
  ModalHeader,
  modalEdges,
  Notice,
  Screen,
  TextField,
} from '../../components/ui';
import { useData } from '../../contexts/DataContext';
import { fromDateKey, startOfDay, toDateKey } from '../../lib/dates';
import type { AppScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';

export function TaskFormScreen({ navigation, route }: AppScreenProps<'TaskForm'>) {
  const { subjects, addTask } = useData();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(
    route.params?.date ? fromDateKey(route.params.date) : startOfDay(new Date()),
  );
  const [subjectId, setSubjectId] = useState<string | null>(route.params?.subjectId ?? null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (title.trim().length === 0) {
      setTitleError('Digite o que precisa ser feito.');
      return;
    }
    setTitleError(undefined);
    setFormError(null);
    setSaving(true);
    try {
      await addTask({ title: title.trim(), due_date: toDateKey(date), subject_id: subjectId });
      navigation.goBack();
    } catch {
      setFormError('Não foi possível salvar a tarefa. Tente de novo.');
      setSaving(false);
    }
  }

  return (
    <Screen scroll edges={modalEdges}>
      <View style={styles.form}>
        <ModalHeader title="Nova tarefa" onClose={() => navigation.goBack()} />
        <TextField
          label="Tarefa"
          placeholder="Ex.: Resolver a lista de exercícios"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          error={titleError}
        />
        <DateTimeField label="Data" mode="date" value={date} onChange={setDate} />
        {subjects.length > 0 ? (
          <View style={styles.chips}>
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
        {formError ? <Notice tone="error" message={formError} /> : null}
        <Button label="Salvar" onPress={handleSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  chips: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
