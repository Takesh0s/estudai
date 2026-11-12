import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Holiday } from '../holidays';

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

// The module keeps a memory cache, so each test loads a fresh copy of it.
function loadModule() {
  let mod!: typeof import('../holidays');
  jest.isolateModules(() => {
    mod = jest.requireActual<typeof import('../holidays')>('../holidays');
  });
  return mod;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('downloads the year from BrasilAPI and stores it on the device', async () => {
  const fetchMock = mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  expect(fetchMock).toHaveBeenCalledWith(
    'https://brasilapi.com.br/api/feriados/v1/2026',
    expect.objectContaining({ signal: expect.anything() }),
  );
  expect(JSON.parse((await AsyncStorage.getItem('@estudai/holidays-2026')) ?? '[]')).toEqual(holidays2026);
});

it('serves a stored year without calling the API', async () => {
  await AsyncStorage.setItem('@estudai/holidays-2026', JSON.stringify(holidays2026));
  const fetchMock = mockFetch(okResponse([]));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual(holidays2026);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('keeps a loaded year in memory', async () => {
  const fetchMock = mockFetch(okResponse(holidays2026));
  const { loadHolidays } = loadModule();

  await loadHolidays(2026);
  await AsyncStorage.clear();
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

it('returns an empty list when the API fails, and tries again next time', async () => {
  const fetchMock = mockFetch(new TypeError('Network request failed'));
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual([]);
  await expect(loadHolidays(2026)).resolves.toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('treats an error status as unavailable', async () => {
  mockFetch({ ok: false, status: 503, json: () => Promise.resolve({}) });
  const { loadHolidays } = loadModule();

  await expect(loadHolidays(2026)).resolves.toEqual([]);
  expect(await AsyncStorage.getItem('@estudai/holidays-2026')).toBeNull();
});
