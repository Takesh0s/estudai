import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '../components/icons/Icon';
import { HomeScreen } from '../screens/app/HomeScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { ScheduleScreen } from '../screens/app/ScheduleScreen';
import { SubjectsScreen } from '../screens/app/SubjectsScreen';
import { fonts, useTheme } from '../theme';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const tabIcons: Record<keyof AppTabParamList, IconName> = {
  Home: 'inicio',
  Subjects: 'materias',
  Schedule: 'agenda',
  Profile: 'perfil',
};

export function AppTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.surface,
          borderTopColor: colors.border.default,
          height: 68 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 13 },
        tabBarIcon: ({ color }) => <Icon name={tabIcons[route.name]} color={color} size={26} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Subjects" component={SubjectsScreen} options={{ title: 'Matérias' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: 'Agenda' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
