import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { fonts, useTheme } from '../theme';
import { AppTabs } from './AppTabs';
import { AuthNavigator } from './AuthNavigator';
import type { AppStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();

/**
 * Renders the auth stack or the app depending on the session, following React
 * Navigation's authentication flow pattern: signing in or out swaps the tree,
 * so no screen has to call navigate() after a session change.
 */
export function RootNavigator() {
  const { session, isRecovering } = useAuth();
  const { scheme, colors } = useTheme();

  const navigationTheme = useMemo<Theme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand.primary,
        background: colors.background.app,
        card: colors.background.surface,
        text: colors.text.primary,
        border: colors.border.default,
        notification: colors.danger,
      },
      fonts: {
        regular: { fontFamily: fonts.regular, fontWeight: '400' },
        medium: { fontFamily: fonts.medium, fontWeight: '500' },
        bold: { fontFamily: fonts.semibold, fontWeight: '600' },
        heavy: { fontFamily: fonts.bold, fontWeight: '700' },
      },
    };
  }, [scheme, colors]);

  const showApp = Boolean(session) && !isRecovering;

  return (
    <NavigationContainer theme={navigationTheme}>
      {showApp ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Tabs" component={AppTabs} />
        </AppStack.Navigator>
      ) : (
        <AuthNavigator recovering={isRecovering} />
      )}
    </NavigationContainer>
  );
}
