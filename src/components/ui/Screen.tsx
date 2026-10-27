import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing, useTheme } from '../../theme';

type ScreenProps = {
  children: ReactNode;
  /** Scrollable content that stays clear of the keyboard; use it for forms. */
  scroll?: boolean;
  /** Tab screens pass ['top'] because the tab bar already pads the bottom inset. */
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = false, edges = ['top', 'bottom'], contentStyle }: ScreenProps) {
  const { colors } = useTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background.app }]}>
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
});
