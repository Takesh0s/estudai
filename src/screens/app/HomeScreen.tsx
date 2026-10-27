import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, EmptyState, Screen } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { formatLongDate } from '../../lib/dates';
import type { TabScreenProps } from '../../navigation/types';

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { profile, displayName } = useAuth();
  const firstName = displayName.split(' ')[0];

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
        <Avatar name={displayName} uri={profile?.avatar_url} />
      </View>

      <EmptyState
        icon="livro"
        title="Tudo pronto para começar!"
        description="Cadastre sua primeira matéria e organize sua rotina de estudos. Suas tarefas e provas vão aparecer aqui."
        actionLabel="Adicionar primeira matéria"
        onAction={() => navigation.navigate('Subjects')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { gap: 2 },
});
