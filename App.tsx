// Per-weight imports: importing from the package root would bundle all 18 Inter weights.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SetupRequiredScreen } from './src/screens/SetupRequiredScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { isSupabaseConfigured } from './src/lib/supabase';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme';

// Keeps the native splash up until fonts and the stored session are ready,
// so the first frame never renders with fallback fonts or the wrong navigator.
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { scheme } = useTheme();
  const { initializing } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const ready = (fontsLoaded || Boolean(fontError)) && !initializing;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {isSupabaseConfigured ? (
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        ) : (
          <SetupRequiredScreen />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
