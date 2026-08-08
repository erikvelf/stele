import { useCallback, useState } from 'react';

import { COMMON_ERRORS } from '@/constants/error-codes';
import {
  exportArchive,
  exportSettings,
  importArchive,
  importSettings,
} from '@/modules/archive';
import type { ArchiveOutcome } from '@/modules/archive';
import { haptics } from '@/modules/haptics';
import type { AppError, Result } from '@/modules/types';

export type ArchiveAction =
  'exportData' | 'exportSettings' | 'importData' | 'importSettings';

export interface ArchiveReport extends ArchiveOutcome {
  action: ArchiveAction;
}

function operationFor(
  action: ArchiveAction,
  at: number
): Promise<Result<ArchiveOutcome>> {
  if (action === 'exportData') {
    return exportArchive(at);
  }
  if (action === 'exportSettings') {
    return exportSettings(at);
  }
  if (action === 'importData') {
    return importArchive();
  }
  return importSettings();
}

export function useArchive() {
  const [running, setRunning] = useState<ArchiveAction | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [report, setReport] = useState<ArchiveReport | null>(null);

  const run = useCallback(async (action: ArchiveAction) => {
    setRunning(action);
    setError(null);
    setReport(null);

    try {
      const result = await operationFor(action, Date.now());
      if (result.success) {
        setReport({ action, ...result.data });
        if (!result.data.cancelled) {
          haptics.succeed();
        }
      } else {
        setError(result.error);
        haptics.fail();
      }
    } catch (cause) {
      setError({ code: COMMON_ERRORS.UNDEFINED, cause: String(cause) });
      haptics.fail();
    } finally {
      setRunning(null);
    }
  }, []);

  const dismiss = useCallback(() => {
    setError(null);
    setReport(null);
  }, []);

  return { running, error, report, run, dismiss };
}
