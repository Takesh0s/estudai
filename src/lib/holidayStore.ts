import type { Holiday } from './holidays';

// Web build: expo-sqlite needs extra WebAssembly setup in the browser, so the
// holidays stay only in memory there. Android and iOS use holidayStore.native.ts.

export async function readStoredHolidays(_year: number): Promise<Holiday[] | null> {
  return null;
}

export async function saveHolidays(_year: number, _list: Holiday[]): Promise<void> {}
