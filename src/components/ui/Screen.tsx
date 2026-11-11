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

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();

  // The scroll container must not be `flex: 1`: that pins it to the viewport
  // height, so taller content would overflow instead of scrolling. `flexGrow`
  // lets it fill short screens and still grow past the viewport when needed.
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.padding, styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.padding, styles.fill, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.background.app }]}>
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.fill}
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
  fill: { flex: 1 },
  padding: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
});
