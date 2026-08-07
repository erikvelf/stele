import { readAllSettings, writeAllSettings } from '@/modules/settings';
import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import {
  ARCHIVE_ERRORS,
  ARCHIVE_SCHEMA_VERSION,
  DATA_FILE_PREFIX,
  SETTINGS_FILE_PREFIX,
  SETTINGS_SCHEMA_VERSION,
} from './constants';
import { archiveFileName, pickJsonText, saveJson } from './file';
import { readArchiveTables, writeArchiveTables } from './queries';
import { archiveSchema, settingsArchiveSchema } from './schema';
import type { Archive, SettingsArchive } from './schema';
import { fromArchive, toArchive } from './serialize';
import { formatIssues, validateArchive } from './validate';

export interface ArchiveSummary {
  folders: number;
  tags: number;
  notes: number;
  highlights: number;
  reflections: number;
}

// `cancelled` records a dismissed file picker, which is not a failure and not
// a result. A summary is present only where there was data to count.
export interface ArchiveOutcome {
  cancelled: boolean;
  summary: ArchiveSummary | null;
}

function parseJson(text: string): Result<unknown> {
  try {
    return ok(JSON.parse(text));
  } catch (cause) {
    return err(ARCHIVE_ERRORS.MALFORMED_JSON, String(cause));
  }
}

function readSchemaVersion(value: unknown): number | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('schemaVersion' in value)
  ) {
    return null;
  }

  const { schemaVersion } = value;
  return typeof schemaVersion === 'number' ? schemaVersion : null;
}

// A mismatch refuses rather than guessing: the file says what it is, and
// migrating it is a text edit the reader can make deliberately.
function checkVersion(value: unknown, expected: number): Result<void> {
  const found = readSchemaVersion(value);
  if (found === expected) {
    return ok(undefined);
  }

  return err(
    ARCHIVE_ERRORS.VERSION_MISMATCH,
    `file is version ${found ?? 'unknown'}, this app reads version ${expected}`
  );
}

function parseArchive(text: string): Result<Archive> {
  const json = parseJson(text);
  if (!json.success) {
    return json;
  }

  const version = checkVersion(json.data, ARCHIVE_SCHEMA_VERSION);
  if (!version.success) {
    return version;
  }

  const parsed = archiveSchema.safeParse(json.data);
  if (!parsed.success) {
    return err(ARCHIVE_ERRORS.INVALID_SHAPE, formatIssues(parsed.error));
  }

  return ok(parsed.data);
}

function parseSettingsArchive(text: string): Result<SettingsArchive> {
  const json = parseJson(text);
  if (!json.success) {
    return json;
  }

  const version = checkVersion(json.data, SETTINGS_SCHEMA_VERSION);
  if (!version.success) {
    return version;
  }

  const parsed = settingsArchiveSchema.safeParse(json.data);
  if (!parsed.success) {
    return err(ARCHIVE_ERRORS.INVALID_SHAPE, formatIssues(parsed.error));
  }

  return ok(parsed.data);
}

function summarize(archive: Archive): ArchiveSummary {
  return {
    folders: archive.folders.length,
    tags: archive.tags.length,
    notes: archive.notes.length,
    highlights: archive.notes.reduce(
      (total, note) => total + note.highlights.length,
      0
    ),
    reflections: archive.reflections.length,
  };
}

export async function exportArchive(
  at: number
): Promise<Result<ArchiveOutcome>> {
  const tables = await readArchiveTables();
  if (!tables.success) {
    return tables;
  }

  let archive: Archive;
  try {
    archive = toArchive(tables.data, at);
  } catch (cause) {
    return err(ARCHIVE_ERRORS.INCONSISTENT_DATABASE, String(cause));
  }

  const saved = await saveJson(archiveFileName(DATA_FILE_PREFIX, at), archive);
  if (!saved.success) {
    return saved;
  }

  return saved.data
    ? ok({ cancelled: false, summary: summarize(archive) })
    : ok({ cancelled: true, summary: null });
}

// Null means the picker was dismissed. Nothing is written until the file has
// parsed, matched the version, and passed every reference check.
export async function importArchive(): Promise<Result<ArchiveOutcome>> {
  const text = await pickJsonText();
  if (!text.success) {
    return text;
  }
  if (text.data === null) {
    return ok({ cancelled: true, summary: null });
  }

  const parsed = parseArchive(text.data);
  if (!parsed.success) {
    return parsed;
  }

  const validated = validateArchive(parsed.data);
  if (!validated.success) {
    return validated;
  }

  const written = await writeArchiveTables(fromArchive(parsed.data));
  if (!written.success) {
    return written;
  }

  return ok({ cancelled: false, summary: summarize(parsed.data) });
}

export async function exportSettings(
  at: number
): Promise<Result<ArchiveOutcome>> {
  const contents: SettingsArchive = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    exportedAt: at,
    settings: readAllSettings(),
  };

  const saved = await saveJson(
    archiveFileName(SETTINGS_FILE_PREFIX, at),
    contents
  );
  if (!saved.success) {
    return saved;
  }

  return ok({ cancelled: !saved.data, summary: null });
}

export async function importSettings(): Promise<Result<ArchiveOutcome>> {
  const text = await pickJsonText();
  if (!text.success) {
    return text;
  }
  if (text.data === null) {
    return ok({ cancelled: true, summary: null });
  }

  const parsed = parseSettingsArchive(text.data);
  if (!parsed.success) {
    return parsed;
  }

  writeAllSettings(parsed.data.settings);
  return ok({ cancelled: false, summary: null });
}
