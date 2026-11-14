import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * SecureStore (Keychain on iOS, Keystore-encrypted storage on Android) warns
 * above 2048 bytes per value, and a Supabase session with its refresh token
 * is bigger than that. Values are therefore split into chunks saved under
 * `<key>.0`, `<key>.1`, … with the number of chunks in `<key>.count`.
 */
export const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.count`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function readCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const count = raw ? Number(raw) : 0;
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function deleteChunks(key: string, from: number, to: number) {
  for (let index = from; index < to; index++) {
    await SecureStore.deleteItemAsync(chunkKey(key, index));
  }
}

async function writeSecure(key: string, value: string) {
  const previous = await readCount(key);
  const chunks: string[] = [];
  for (let start = 0; start < value.length; start += CHUNK_SIZE) {
    chunks.push(value.slice(start, start + CHUNK_SIZE));
  }
  if (chunks.length === 0) chunks.push('');

  for (const [index, chunk] of chunks.entries()) {
    await SecureStore.setItemAsync(chunkKey(key, index), chunk);
  }
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  // A shorter value leaves old chunks behind; remove them.
  await deleteChunks(key, chunks.length, previous);
}

async function readSecure(key: string): Promise<string | null> {
  const count = await readCount(key);
  if (count === 0) return null;
  const parts: string[] = [];
  for (let index = 0; index < count; index++) {
    const part = await SecureStore.getItemAsync(chunkKey(key, index));
    // A missing chunk means the value is corrupted; treat it as signed out.
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join('');
}

/**
 * Storage adapter for the Supabase auth client. The session (access and
 * refresh tokens) is a credential, so on Android and iOS it lives in
 * SecureStore instead of AsyncStorage. Sessions saved by older versions of
 * the app in AsyncStorage are moved over on first read, so nobody is logged
 * out by the update. The web build has no SecureStore and keeps AsyncStorage.
 */
export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);

    const stored = await readSecure(key);
    if (stored !== null) return stored;

    const legacy = await AsyncStorage.getItem(key);
    if (legacy === null) return null;
    await writeSecure(key, legacy);
    await AsyncStorage.removeItem(key);
    return legacy;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    await writeSecure(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    const count = await readCount(key);
    await deleteChunks(key, 0, count);
    await SecureStore.deleteItemAsync(countKey(key));
    await AsyncStorage.removeItem(key);
  },
};
