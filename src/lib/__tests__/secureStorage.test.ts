import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { CHUNK_SIZE, secureSessionStorage } from '../secureStorage';

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const KEY = 'sb-project-auth-token';

beforeEach(async () => {
  store.clear();
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('secureSessionStorage', () => {
  it('saves the session in SecureStore and reads it back', async () => {
    await secureSessionStorage.setItem(KEY, '{"access_token":"abc"}');

    expect(await secureSessionStorage.getItem(KEY)).toBe('{"access_token":"abc"}');
    expect(store.get(`${KEY}.count`)).toBe('1');
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('returns null when nothing was saved', async () => {
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });

  it('splits values above the SecureStore size limit into chunks', async () => {
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 10);
    await secureSessionStorage.setItem(KEY, value);

    expect(store.get(`${KEY}.count`)).toBe('3');
    for (let i = 0; i < 3; i++) {
      expect(store.get(`${KEY}.${i}`)!.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
    expect(await secureSessionStorage.getItem(KEY)).toBe(value);
  });

  it('deletes leftover chunks when a shorter value is saved', async () => {
    await secureSessionStorage.setItem(KEY, 'x'.repeat(CHUNK_SIZE * 3));
    await secureSessionStorage.setItem(KEY, 'short');

    expect(store.get(`${KEY}.count`)).toBe('1');
    expect(store.has(`${KEY}.1`)).toBe(false);
    expect(store.has(`${KEY}.2`)).toBe(false);
    expect(await secureSessionStorage.getItem(KEY)).toBe('short');
  });

  it('treats a value with a missing chunk as signed out', async () => {
    await secureSessionStorage.setItem(KEY, 'x'.repeat(CHUNK_SIZE * 2));
    store.delete(`${KEY}.1`);

    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });

  it('moves a session saved by older versions from AsyncStorage', async () => {
    await AsyncStorage.setItem(KEY, 'legacy-session');

    expect(await secureSessionStorage.getItem(KEY)).toBe('legacy-session');
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(store.get(`${KEY}.0`)).toBe('legacy-session');
  });

  it('removes every chunk and the legacy copy on sign out', async () => {
    await secureSessionStorage.setItem(KEY, 'x'.repeat(CHUNK_SIZE * 2));
    await AsyncStorage.setItem(KEY, 'legacy-session');

    await secureSessionStorage.removeItem(KEY);

    expect(store.size).toBe(0);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });

  it('falls back to AsyncStorage on the web, where SecureStore does not exist', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');

    await secureSessionStorage.setItem(KEY, 'web-session');

    expect(await AsyncStorage.getItem(KEY)).toBe('web-session');
    expect(await secureSessionStorage.getItem(KEY)).toBe('web-session');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    await secureSessionStorage.removeItem(KEY);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });
});
