import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { DATABASE_NAME } from './constants';

const expoDatabase = openDatabaseSync(DATABASE_NAME);
expoDatabase.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDatabase);
