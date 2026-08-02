import { DEFAULT_STONE_ID } from '@/modules/types';

import type { Folder } from './schema';

// The diario is not a distinct capability, just a folder that always exists
// under this id — PRD: "a tavola like any other." It stays out of the shelf
// listing (a screen/hook concern), not out of the folder table.
export const JOURNAL_FOLDER_ID = 'journal';

// Seeded once at bootstrap if the row is absent. A user who renames or
// recolors the diario keeps that change — seeding never overwrites it.
export const DEFAULT_JOURNAL_FOLDER: Folder = {
  id: JOURNAL_FOLDER_ID,
  name: 'Diario',
  color: DEFAULT_STONE_ID,
  emoji: '📖',
};
