import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { AppText, BackButton, Button, Card, Screen } from '../../components/ui';
import type { AppScreenProps } from '../../navigation/types';
import { spacing, useTheme } from '../../theme';

// Address shown in the Figma prototype; change it here if the team uses another one.
const SUPPORT_EMAIL = 'suporte@estudai.app';

const FAQ = [
  {
    question: 'Como recebo os lembretes de provas?',
    answer:
      'Ative os lembretes no Perfil e escolha quando ser avisado. A notificação chega mesmo com o app fechado.',
  },
  {
    question: 'Como mudo o status de um conteúdo?',
    answer:
      'Abra a matéria e, no conteúdo, toque em A estudar, Estudando ou Revisado. O progresso da matéria atualiza na hora.',
  },
  {
    question: 'Posso usar o app sem internet?',
    answer:
      'Você precisa de internet para entrar e para salvar mudanças. Os lembretes já agendados continuam chegando sem conexão.',
  },
  {
    question: 'Como apago uma matéria?',
    answer:
      'Abra a matéria, toque no lápis e escolha Excluir matéria. Os conteúdos dela são apagados; provas e trabalhos continuam na agenda.',
  },
  {
    question: 'Como excluo minha conta?',
    answer:
      'No Perfil, toque em Excluir conta. Todos os seus dados são apagados de forma permanente.',
  },
];

export function HelpScreen({ navigation }: AppScreenProps<'Help'>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<number | null>(0);

  async function sendEmail() {
    const subject = encodeURIComponent('Ajuda com o Estudaí');
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
    } catch {
      Alert.alert('Não foi possível abrir o e-mail', `Escreva para ${SUPPORT_EMAIL}.`);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="screenTitle" accessibilityRole="header">
          Ajuda e suporte
        </AppText>

        <AppText variant="label" tone="secondary">
          Perguntas frequentes
        </AppText>
        <Card flush>
          {FAQ.map((item, index) => {
            const expanded = open === index;
            return (
              <View
                key={item.question}
                style={index > 0 && { borderTopWidth: 1, borderTopColor: colors.border.default }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : index)}
                  style={styles.question}
                >
                  <AppText variant="label" style={styles.flex}>
                    {item.question}
                  </AppText>
                  <Icon name={expanded ? 'recolher' : 'expandir'} size={22} color={colors.text.secondary} />
                </Pressable>
                {expanded ? (
                  <AppText tone="secondary" style={styles.answer}>
                    {item.answer}
                  </AppText>
                ) : null}
              </View>
            );
          })}
        </Card>

        <AppText variant="label" tone="secondary" style={styles.contactTitle}>
          Ainda precisa de ajuda?
        </AppText>
        <Card style={styles.contact}>
          <View style={styles.contactRow}>
            <Icon name="email" size={26} color={colors.text.link} />
            <View style={styles.flex}>
              <AppText variant="label">Fale com a gente</AppText>
              <AppText variant="caption" tone="secondary">
                {SUPPORT_EMAIL} · resposta em até 2 dias úteis
              </AppText>
            </View>
          </View>
          <Button label="Enviar e-mail" variant="outline" onPress={sendEmail} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: spacing.lg },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  answer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, marginTop: -spacing.xs },
  contactTitle: { marginTop: spacing.sm },
  contact: { gap: spacing.lg },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
