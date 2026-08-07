// The version of the file format, not of the database. It rises when the
// shape of an export changes, which is not every time a migration runs.
export const ARCHIVE_SCHEMA_VERSION = 1;
export const SETTINGS_SCHEMA_VERSION = 1;

export const ARCHIVE_ERRORS = {
  MALFORMED_JSON: 'ARCHIVE_MALFORMED_JSON',
  VERSION_MISMATCH: 'ARCHIVE_VERSION_MISMATCH',
  INVALID_SHAPE: 'ARCHIVE_INVALID_SHAPE',
  DANGLING_REFERENCE: 'ARCHIVE_DANGLING_REFERENCE',
  DUPLICATE_ID: 'ARCHIVE_DUPLICATE_ID',
  OVERLAPPING_DAYS: 'ARCHIVE_OVERLAPPING_DAYS',
  INCONSISTENT_DATABASE: 'ARCHIVE_INCONSISTENT_DATABASE',
  FILE_FAILED: 'ARCHIVE_FILE_FAILED',
} as const;

export const ARCHIVE_MIME_TYPE = 'application/json';
export const ARCHIVE_JSON_INDENT = 2;

export const DATA_FILE_PREFIX = 'stele-data';
export const SETTINGS_FILE_PREFIX = 'stele-settings';
