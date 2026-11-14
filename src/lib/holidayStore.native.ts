import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

import type { Holiday } from './holidays';

const LEGACY_PREFIX = '@estudai/holidays-';
let database: Promise<SQLite.SQLiteDatabase> | null = null;

/** Versions before SQLite cached each year as a JSON string in AsyncStorage. */
async function removeLegacyCache() {
  const keys = await AsyncStorage.getAllKeys();
  const legacy = keys.filter((key) => key.startsWith(LEGACY_PREFIX));
  if (legacy.length > 0) await AsyncStorage.multiRemove(legacy);
}

function open() {
  if (!database) {
    database = (async () => {
      const db = await SQLite.openDatabaseAsync('estudai.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS holidays (
          year INTEGER NOT NULL,
          date TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          PRIMARY KEY (date, name)
        );
        CREATE INDEX IF NOT EXISTS holidays_year ON holidays (year);
      `);
      removeLegacyCache().catch(() => {});
      return db;
    })();
    // Let the next call try again instead of keeping a failed connection.
    database.catch(() => {
      database = null;
    });
  }
  return database;
}

/** Holidays of a year saved on the device, or null when the year was never downloaded. */
export async function readStoredHolidays(year: number): Promise<Holiday[] | null> {
  const db = await open();
  const rows = await db.getAllAsync<Holiday>(
    'SELECT date, name, type FROM holidays WHERE year = ? ORDER BY date, name',
    year,
  );
  return rows.length > 0 ? rows : null;
}

/** Replaces the saved holidays of a year in one transaction. */
export async function saveHolidays(year: number, list: Holiday[]): Promise<void> {
  const db = await open();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM holidays WHERE year = ?', year);
    for (const holiday of list) {
      await db.runAsync(
        'INSERT OR REPLACE INTO holidays (year, date, name, type) VALUES (?, ?, ?, ?)',
        year,
        holiday.date,
        holiday.name,
        holiday.type,
      );
    }
  });
}
