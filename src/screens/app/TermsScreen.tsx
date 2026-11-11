import { StyleSheet, View } from 'react-native';
import { AppText, BackButton, Screen } from '../../components/ui';
import type { AppScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';

const SECTIONS = [
  {
    title: '1. Sobre o Estudaí',
    body: 'O Estudaí é um aplicativo para organizar a vida acadêmica: matérias, conteúdos, tarefas, provas, trabalhos e lembretes. Foi desenvolvido como trabalho final da disciplina Programação de App (Engenharia de Software, UCB) e é oferecido como está, sem garantias de disponibilidade.',
  },
  {
    title: '2. Dados que guardamos',
    body: 'Guardamos o nome, o e-mail e a foto de perfil que você informa, além das matérias, conteúdos, tarefas e eventos que você cadastra e das suas preferências de lembrete. Esses dados ficam no Supabase e só a sua conta consegue lê-los ou alterá-los.',
  },
  {
    title: '3. Como usamos os dados',
    body: 'Os dados servem apenas para o app funcionar: mostrar sua agenda, calcular o progresso de estudo e agendar os lembretes. Não vendemos nem compartilhamos suas informações com terceiros.',
  },
  {
    title: '4. Notificações e serviços externos',
    body: 'Os lembretes são notificações locais, agendadas no seu aparelho; você pode desligá-los no Perfil ou nas configurações do sistema. Para mostrar os feriados nacionais, o app consulta a BrasilAPI, sem enviar dados pessoais.',
  },
  {
    title: '5. Sua conta',
    body: 'Você pode editar seus dados no Perfil e excluir a conta a qualquer momento. A exclusão apaga a conta e tudo o que ela contém, de forma permanente.',
  },
  {
    title: '6. Responsabilidades',
    body: 'Confira sempre datas e horários de provas e entregas com a sua instituição: o Estudaí é uma ferramenta de apoio e não se responsabiliza por avisos que não chegarem, por exemplo, por notificações desativadas no aparelho.',
  },
];

export function TermsScreen({ navigation }: AppScreenProps<'Terms'>) {
  return (
    <Screen scroll>
      <View style={styles.content}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="screenTitle" accessibilityRole="header">
          Termos de uso
        </AppText>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="highlight">{section.title}</AppText>
            <AppText tone="secondary">{section.body}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  section: { gap: spacing.sm },
});
