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

/** Columns of `profiles` that the app edits; id and timestamps are managed by the database. */
export type ProfileChanges = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

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
  /** Profile > Alterar senha: checks the current password, then sets the new one. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  cancelRecovery: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (changes: ProfileChanges) => Promise<void>;
  /** Uploads a local image as the profile photo and saves its public URL. */
  /** Receives the picked image as a base64 string (no data: prefix). */
  uploadAvatar: (base64: string) => Promise<void>;
  /** Deletes the account and everything it owns, then ends the session on this device. */
  deleteAccount: () => Promise<void>;
};

// Supabase always persists the session. "Lembrar login" is implemented by
// signing out on the next cold start when the box was left unchecked.
const REMEMBER_KEY = '@estudai/remember-login';

const AuthContext = createContext<AuthContextValue | null>(null);

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of clean) {
    buffer = (buffer << 6) | BASE64_ALPHABET.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes;
}

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
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    });
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

  const email = session?.user.email;

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!email) throw new Error('No signed-in user.');
      // Supabase does not ask for the current password on updateUser, so it is
      // checked by signing in again; the session it returns replaces the old one.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) throw verifyError;
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    [email],
  );

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

  const updateProfile = useCallback(
    async (changes: ProfileChanges) => {
      if (!userId) throw new Error('No signed-in user.');
      const { data, error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
    },
    [userId],
  );

  const uploadAvatar = useCallback(
    async (base64: string) => {
      if (!userId) throw new Error('No signed-in user.');
      // Storage policies only allow writing inside a folder named after the user.
      const path = `${userId}/avatar.jpg`;
      // Reading the picked file with fetch() can yield an empty body on Android,
      // which uploads a broken 0-byte image. The picker's base64 is reliable.
      const body = base64ToBytes(base64);
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, body, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // The path never changes, so a version in the query string defeats the image cache.
      await updateProfile({ avatar_url: `${data.publicUrl}?v=${Date.now()}` });
    },
    [userId, updateProfile],
  );

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    // The user no longer exists on the server, so only the local session is cleared.
    await supabase.auth.signOut({ scope: 'local' });
  }, []);

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
      changePassword,
      cancelRecovery,
      signOut,
      refreshProfile,
      updateProfile,
      uploadAvatar,
      deleteAccount,
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
      changePassword,
      cancelRecovery,
      signOut,
      refreshProfile,
      updateProfile,
      uploadAvatar,
      deleteAccount,
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
