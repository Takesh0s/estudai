import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Profile } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type SignUpResult = { needsEmailConfirmation: boolean };

type AuthContextValue = {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Profile name, then the name given at sign up, then the e-mail prefix. */
  displayName: string;
  /**
   * Verifying a recovery code already yields a session, but the user still
   * has to choose a new password. While this is true, RootNavigator keeps the
   * auth stack mounted instead of opening the app.
   */
  isRecovering: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  sendRecoveryCode: (email: string) => Promise<void>;
  verifyRecoveryCode: (email: string, code: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  cancelRecovery: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

// Supabase always persists the session. "Lembrar login" is implemented by
// signing out on the next cold start when the box was left unchecked.
const REMEMBER_KEY = '@estudai/remember-login';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const [{ data }, remember] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(REMEMBER_KEY),
      ]);
      if (!active) return;

      if (data.session && remember === 'false') {
        await supabase.auth.signOut();
      } else {
        setSession(data.session);
      }
      setInitializing(false);
    })().catch(() => setInitializing(false));

    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock the client.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        // Drops a response that arrives after sign-out or a user switch.
        if (active) setProfile(data ?? null);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    await AsyncStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Stored in raw_user_meta_data; the handle_new_user trigger copies it into profiles.
      options: { data: { full_name: name.trim() } },
    });
    if (error) throw error;
    await AsyncStorage.setItem(REMEMBER_KEY, 'true');
    // With "Confirm email" enabled, sign up returns no session until the address is confirmed.
    return { needsEmailConfirmation: !data.session };
  }, []);

  const sendRecoveryCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  }, []);

  const verifyRecoveryCode = useCallback(async (email: string, code: string) => {
    setIsRecovering(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
    if (error) {
      setIsRecovering(false);
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await AsyncStorage.setItem(REMEMBER_KEY, 'true');
    setIsRecovering(false);
  }, []);

  const cancelRecovery = useCallback(async () => {
    setIsRecovering(false);
    await supabase.auth.signOut();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  const metadataName = session?.user.user_metadata?.full_name;
  const displayName =
    profile?.full_name ||
    (typeof metadataName === 'string' ? metadataName : '') ||
    session?.user.email?.split('@')[0] ||
    'Usuário';

  const value = useMemo(
    () => ({
      initializing,
      session,
      profile,
      displayName,
      isRecovering,
      signIn,
      signUp,
      sendRecoveryCode,
      verifyRecoveryCode,
      updatePassword,
      cancelRecovery,
      signOut,
      refreshProfile,
    }),
    [
      initializing,
      session,
      profile,
      displayName,
      isRecovering,
      signIn,
      signUp,
      sendRecoveryCode,
      verifyRecoveryCode,
      updatePassword,
      cancelRecovery,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
