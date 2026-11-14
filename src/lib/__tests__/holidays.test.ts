import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

import type { Holiday } from '../holidays';

type Row = Holiday & { year: number };

// In-memory stand-in for the SQLite table, kept outside the mocked module so
// it survives the fresh module copies loaded by each test.
const mockTable: Row[] = [];

function mockDatabase() {
  return {
    execAsync: jest.fn(async () => {}),
    getAllAsync: jest.fn(async (_sql: string, year: number) =>
      mockTable
        .filter((row) => row.year === year)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(({ date, name, type }) => ({ date, name, type })),
    ),
    runAsync: jest.fn(async (sql: string, ...params: (string | number)[]) => {
      if (sql.startsWith('DELETE')) {
        const kept = mockTable.filter((row) => row.year !== params[0]);
        mockTable.splice(0, mockTable.length, ...kept);
      } else {
        const [year, date, name, type] = params as [number, string, string, string];
        mockTable.push({ year, date, name, type });
      }
      return { changes: 1, lastInsertRowId: mockTable.length };
    }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => {
      const snapshot = [...mockTable];
      try {
        await task();
      } catch (error) {
        mockTable.splice(0, mockTable.length, ...snapshot);
        throw error;
      }
    }),
  };
}

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDatabase()),
}));

const openDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock;

const holidays2026: Holiday[] = [
  { date: '2026-01-01', name: 'Confraternização mundial', type: 'national' },
  { date: '2026-11-15', name: 'Proclamação da República', type: 'national' },
];

function mockFetch(response: Partial<Response> | Error) {
  const fetchMock = jest.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response as Response),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const okResponse = (data: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(data) });

// Saving runs in the background; let it finish before looking at the table.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// The module keeps a memory cache, so each test loads a fresh copy of it.
function loadModule() {
  let mod!: typeof import('../holidays');
  jest.isolateModules(() => {
    mod = jest.requireActual<typeof import('../holidays')>('../holidays');
  });
  return mod;
}

beforeEach(async () => {
  mockTable.splice(0, mockTable.length);
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('downloads the year from BrasilAPI and saves it in the SQLite table', async () => {
  const fetchMock = mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  expect(fetchMock).toHaveBeenCalledWith(
    'https://brasilapi.com.br/api/feriados/v1/2026',
    expect.objectContaining({ signal: expect.anything() }),
  );
  await flush();
  expect(mockTable).toEqual(holidays2026.map((holiday) => ({ ...holiday, year: 2026 })));
});

it('creates the table before using it', async () => {
  mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await loadHolidays(2026);
  const db = await openDatabaseAsync.mock.results[0].value;
  expect(openDatabaseAsync).toHaveBeenCalledWith('estudai.db');
  expect(db.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS holidays'));
});

it('serves a saved year from SQLite without calling the API', async () => {
  mockTable.push(...holidays2026.map((holiday) => ({ ...holiday, year: 2026 })));
  const fetchMock = mockFetch(okResponse([]));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('queries only the requested year', async () => {
  mockTable.push({ year: 2027, date: '2027-01-01', name: 'Confraternização mundial', type: 'national' });
  const fetchMock = mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('keeps a loaded year in memory', async () => {
  const fetchMock = mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await loadHolidays(2026);
  await flush();
  mockTable.splice(0, mockTable.length);
  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('shares one request between simultaneous calls', async () => {
  const fetchMock = mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  const [a, b] = await Promise.all([loadHolidays(2026), loadHolidays(2026)]);
  expect(a).toEqual(b);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('still downloads the holidays when the database cannot be opened', async () => {
  openDatabaseAsync.mockRejectedValue(new Error('disk full'));
  mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  openDatabaseAsync.mockImplementation(async () => mockDatabase());
});

it('removes the JSON cache left in AsyncStorage by older versions', async () => {
  await AsyncStorage.setItem('@estudai/holidays-2025', '[]');
  await AsyncStorage.setItem('@estudai/theme-preference', 'dark');
  mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await loadHolidays(2026);
  await flush();
  expect(await AsyncStorage.getItem('@estudai/holidays-2025')).toBeNull();
  expect(await AsyncStorage.getItem('@estudai/theme-preference')).toBe('dark');
});

it('returns an empty list when the API fails, and tries again next time', async () => {
  const fetchMock = mockFetch(new TypeError('Network request failed'));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual([]);
  await expect(loadHolidays(2026)).resolves.toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('treats an error status as unavailable and saves nothing', async () => {
  mockFetch({ ok: false, status: 503, json: () => Promise.resolve({}) });
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual([]);
  await flush();
  expect(mockTable).toHaveLength(0);
});
