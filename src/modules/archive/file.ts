import { format } from 'date-fns';
import { Directory, File } from 'expo-file-system';

import { err, ok } from '@/modules/types';
import type { Result } from '@/modules/types';

import {
  ARCHIVE_ERRORS,
  ARCHIVE_JSON_INDENT,
  ARCHIVE_MIME_TYPE,
} from './constants';

// The two platforms name the same event differently.
const PICKER_CANCELLED_CODES = new Set([
  'ERR_PICKER_CANCELLED',
  'ERR_FILE_PICKING_CANCELLED',
]);

function isPickerCancelled(cause: unknown): boolean {
  if (typeof cause !== 'object' || cause === null || !('code' in cause)) {
    return false;
  }

  const { code } = cause;
  return typeof code === 'string' && PICKER_CANCELLED_CODES.has(code);
}

export function archiveFileName(prefix: string, at: number): string {
  return `${prefix}-${format(new Date(at), 'yyyy-MM-dd-HHmm')}.json`;
}

// False means the directory picker was dismissed, which is not a failure.
export async function saveJson(
  fileName: string,
  contents: unknown
): Promise<Result<boolean>> {
  try {
    const directory = await Directory.pickDirectoryAsync();
    const file = directory.createFile(fileName, ARCHIVE_MIME_TYPE);
    file.write(JSON.stringify(contents, null, ARCHIVE_JSON_INDENT));
    return ok(true);
  } catch (cause) {
    if (isPickerCancelled(cause)) {
      return ok(false);
    }
    return err(ARCHIVE_ERRORS.FILE_FAILED, String(cause));
  }
}

// Null means the file picker was dismissed.
export async function pickJsonText(): Promise<Result<string | null>> {
  try {
    const picked = await File.pickFileAsync({
      mimeTypes: [ARCHIVE_MIME_TYPE],
    });
    if (picked.canceled) {
      return ok(null);
    }

    return ok(await picked.result.text());
  } catch (cause) {
    if (isPickerCancelled(cause)) {
      return ok(null);
    }
    return err(ARCHIVE_ERRORS.FILE_FAILED, String(cause));
  }
}
