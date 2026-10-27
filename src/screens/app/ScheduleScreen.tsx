import { View } from 'react-native';

import { AppText, EmptyState, Screen } from '../../components/ui';
import { formatMonthYear } from '../../lib/dates';

export function ScheduleScreen() {
  return (
    <Screen edges={['top']}>
      <View>
        <AppText variant="screenTitle" accessibilityRole="header">
          {formatMonthYear()}
        </AppText>
      </View>
      <EmptyState
        icon="calendario"
        title="Nenhum evento neste dia"
        description="Adicione provas, trabalhos e datas importantes para receber lembretes no momento certo."
      />
    </Screen>
  );
}
