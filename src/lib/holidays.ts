import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

/** Shape returned by https://brasilapi.com.br/api/feriados/v1/{year}. */
export type Holiday = { date: string; name: string; type: string };

const cacheKey = (year: number) => `@estudai/holidays-${year}`;
const memory = new Map<number, Holiday[]>();
const inFlight = new Map<number, Promise<Holiday[]>>();

async function readStored(year: number): Promise<Holiday[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(year));
    return raw ? (JSON.parse(raw) as Holiday[]) : null;
  } catch {
    return null;
  }
}

async function download(year: number): Promise<Holiday[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`BrasilAPI responded ${response.status}`);
    const data = (await response.json()) as Holiday[];
    AsyncStorage.setItem(cacheKey(year), JSON.stringify(data)).catch(() => {});
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * National holidays never change once published, so a year is downloaded once
 * and then served from memory and AsyncStorage. When the request fails the
 * agenda keeps working without holidays instead of showing an error.
 */
export function loadHolidays(year: number): Promise<Holiday[]> {
  const cached = memory.get(year);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(year);
  if (pending) return pending;

  const request = (async () => {
    const stored = await readStored(year);
    if (stored) return stored;
    try {
      return await download(year);
    } catch {
      return [];
    }
  })()
    .then((list) => {
      // An empty list means "unavailable right now": do not pin it in memory.
      if (list.length > 0) memory.set(year, list);
      return list;
    })
    .finally(() => inFlight.delete(year));

  inFlight.set(year, request);
  return request;
}

/** Holidays of the given years keyed by YYYY-MM-DD. */
export function useHolidays(years: number[]) {
  const key = [...new Set(years)].sort().join(',');
  const [byYear, setByYear] = useState<Record<number, Holiday[]>>({});

  useEffect(() => {
    let active = true;
    for (const year of key.split(',').map(Number)) {
      loadHolidays(year).then((list) => {
        if (active) setByYear((current) => ({ ...current, [year]: list }));
      });
    }
    return () => {
      active = false;
    };
  }, [key]);

  return useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const list of Object.values(byYear)) {
      for (const holiday of list) map.set(holiday.date, holiday);
    }
    return map;
  }, [byYear]);
}
