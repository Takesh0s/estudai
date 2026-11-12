import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CalendarScreen } from '../screens/app/CalendarScreen';
import { ChangePasswordScreen } from '../screens/app/ChangePasswordScreen';
import { EditProfileScreen } from '../screens/app/EditProfileScreen';
import { EventFormScreen } from '../screens/app/EventFormScreen';
import { HelpScreen } from '../screens/app/HelpScreen';
import { RemindersScreen } from '../screens/app/RemindersScreen';
import { SubjectDetailScreen } from '../screens/app/SubjectDetailScreen';
import { SubjectFormScreen } from '../screens/app/SubjectFormScreen';
import { TaskFormScreen } from '../screens/app/TaskFormScreen';
import { TermsScreen } from '../screens/app/TermsScreen';
import { fonts, useTheme } from '../theme';
import { AppTabs } from './AppTabs';
import { AuthNavigator } from './AuthNavigator';
import type { AppStackParamList } from './types';
import { useReminderResponses } from './useReminderResponses';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const navigationRef = createNavigationContainerRef<AppStackParamList>();

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
  const [navigationReady, setNavigationReady] = useState(false);
  useReminderResponses(navigationRef, navigationReady && showApp);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} onReady={() => setNavigationReady(true)}>
      {showApp ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Tabs" component={AppTabs} />
          <AppStack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
          <AppStack.Screen name="Calendar" component={CalendarScreen} />
          <AppStack.Screen name="EditProfile" component={EditProfileScreen} />
          <AppStack.Screen name="Reminders" component={RemindersScreen} />
          <AppStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <AppStack.Screen name="Help" component={HelpScreen} />
          <AppStack.Screen name="Terms" component={TermsScreen} />
          <AppStack.Group screenOptions={{ presentation: 'modal' }}>
            <AppStack.Screen name="SubjectForm" component={SubjectFormScreen} />
            <AppStack.Screen name="EventForm" component={EventFormScreen} />
            <AppStack.Screen name="TaskForm" component={TaskFormScreen} />
          </AppStack.Group>
        </AppStack.Navigator>
      ) : (
        <AuthNavigator recovering={isRecovering} />
      )}
    </NavigationContainer>
  );
}
