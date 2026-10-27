import { StyleSheet, View } from 'react-native';

import { AppText, EmptyState, Screen } from '../../components/ui';

export function SubjectsScreen() {
  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="screenTitle" accessibilityRole="header">
          Matérias
        </AppText>
        <AppText variant="caption" tone="secondary">
          Nenhuma matéria cadastrada
        </AppText>
      </View>
      <EmptyState
        icon="livro"
        title="Nenhuma matéria ainda"
        description="Adicione as matérias do semestre para acompanhar seus conteúdos e o progresso de estudo."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
});
