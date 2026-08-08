import { err, ok } from '@/modules/types';
import type { Result, StoneId } from '@/modules/types';

import { APP_ICON_ERRORS, appIconKeyFor } from './constants';

import { setAppIcon } from '@howincodes/expo-dynamic-app-icon';

// iOS confirms the change with a system alert and resolves once it is done.
// Android only queues it here and swaps the icon once the app pauses.
const APPLY_IN_BACKGROUND = false;

export async function applyAppIcon(stoneId: StoneId): Promise<Result<void>> {
  try {
    const applied = await setAppIcon(
      appIconKeyFor(stoneId),
      APPLY_IN_BACKGROUND
    );
    if (applied === false) {
      return err(APP_ICON_ERRORS.APPLY_FAILED, stoneId);
    }
    return ok(undefined);
  } catch (cause) {
    return err(APP_ICON_ERRORS.APPLY_FAILED, String(cause));
  }
}
