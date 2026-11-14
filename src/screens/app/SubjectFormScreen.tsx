import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  ColorPicker,
  ConfirmDialog,
  ModalHeader,
  modalEdges,
  Notice,
  Screen,
  TextField,
} from '../../components/ui';
import { useData } from '../../contexts/DataContext';
import type { AppScreenProps } from '../../navigation/types';
import { spacing, subjectColors } from '../../theme';

export function SubjectFormScreen({ navigation, route }: AppScreenProps<'SubjectForm'>) {
  const subjectId = route.params?.subjectId;
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const existing = subjects.find((subject) => subject.id === subjectId);

  const [name, setName] = useState(existing?.name ?? '');
  const [teacher, setTeacher] = useState(existing?.teacher ?? '');
  const [color, setColor] = useState(existing?.color ?? subjectColors[0]);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (name.trim().length === 0) {
      setNameError('Digite o nome da matéria.');
      return;
    }
    setNameError(undefined);
    setFormError(null);
    setSaving(true);
    try {
      const input = { name: name.trim(), teacher: teacher.trim() || null, color };
      if (existing) await updateSubject(existing.id, input);
      else await addSubject(input);
      navigation.goBack();
    } catch {
      setFormError('Não foi possível salvar a matéria. Tente de novo.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    try {
      await deleteSubject(existing.id);
      setConfirmVisible(false);
      // The detail screen below no longer has a subject, so go back to the list.
      navigation.popTo('Tabs', { screen: 'Subjects' });
    } catch {
      setConfirmVisible(false);
      setDeleting(false);
      setFormError('Não foi possível excluir a matéria. Tente de novo.');
    }
  }

  return (
    <Screen scroll edges={modalEdges}>
      <View style={styles.form}>
        <ModalHeader
          title={existing ? 'Editar matéria' : 'Nova matéria'}
          onClose={() => navigation.goBack()}
        />
        <TextField
          label="Nome"
          placeholder="Ex.: Programação de App"
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
          maxLength={80}
          returnKeyType="next"
          error={nameError}
        />
        <TextField
          label="Professor (opcional)"
          placeholder="Nome do professor"
          value={teacher}
          onChangeText={setTeacher}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <ColorPicker label="Cor" value={color} onChange={setColor} />
        {formError ? <Notice tone="error" message={formError} /> : null}
        <Button label="Salvar" onPress={handleSave} loading={saving} />
        {existing ? (
          <Button
            label="Excluir matéria"
            variant="outlineDanger"
            onPress={() => setConfirmVisible(true)}
          />
        ) : null}
      </View>
      <ConfirmDialog
        visible={confirmVisible}
        icon="excluir"
        title="Excluir matéria?"
        message="Os conteúdos desta matéria serão apagados. Provas, trabalhos e tarefas continuam na agenda, sem matéria."
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
