import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  List,
  Portal,
  Snackbar,
  Surface,
  Text,
} from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useArchive } from '@/hooks/useArchive';
import type { ArchiveAction, ArchiveReport } from '@/hooks/useArchive';
import { ARCHIVE_ERRORS } from '@/modules/archive';
import type { AppError } from '@/modules/types';

const ERROR_MESSAGES = new Map<string, string>([
  [ARCHIVE_ERRORS.MALFORMED_JSON, 'That file is not valid JSON.'],
  [
    ARCHIVE_ERRORS.VERSION_MISMATCH,
    'That file was written by a different version of Stele.',
  ],
  [ARCHIVE_ERRORS.INVALID_SHAPE, 'That file is missing or misspells a field.'],
  [
    ARCHIVE_ERRORS.DANGLING_REFERENCE,
    'That file points at a folder or tag it does not contain.',
  ],
  [ARCHIVE_ERRORS.DUPLICATE_ID, 'That file uses the same id twice.'],
  [
    ARCHIVE_ERRORS.OVERLAPPING_DAYS,
    'Two dated notes in that file cover the same day.',
  ],
  [
    ARCHIVE_ERRORS.INCONSISTENT_DATABASE,
    'The database contradicts itself, so nothing was exported.',
  ],
  [ARCHIVE_ERRORS.FILE_FAILED, 'The file could not be read or written.'],
]);

const IMPORT_WARNINGS = new Map<ArchiveAction, string>([
  [
    'importData',
    'This erases every note, scaglia, tag, tavola and riflessione in Stele and replaces them with the contents of the file. It cannot be undone.',
  ],
  [
    'importSettings',
    'This replaces every preference in Stele with the contents of the file. It cannot be undone.',
  ],
]);

function describeError(error: AppError): string {
  const message = ERROR_MESSAGES.get(error.code) ?? 'Something went wrong.';
  return error.cause === undefined ? message : `${message}\n\n${error.cause}`;
}

function describeReport(report: ArchiveReport): string | null {
  if (report.cancelled) {
    return null;
  }

  const { summary } = report;
  if (summary === null) {
    return report.action === 'exportSettings'
      ? 'Settings exported.'
      : 'Settings imported. Restart Stele to see them applied.';
  }

  const counted = `${summary.notes} note, ${summary.highlights} scaglie, ${summary.tags} tag, ${summary.folders} tavole, ${summary.reflections} riflessioni`;
  return report.action === 'exportData'
    ? `Exported ${counted}.`
    : `Imported ${counted}. Restart Stele to see them.`;
}

export default function ArchiveScreen() {
  const { running, error, report, run, dismiss } = useArchive();
  const [pending, setPending] = useState<ArchiveAction | null>(null);

  const confirm = () => {
    const action = pending;
    setPending(null);
    if (action !== null) {
      void run(action);
    }
  };

  const notice = report === null ? null : describeReport(report);

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Subheader>Export</List.Subheader>
      <List.Item
        title="Export data"
        description="Notes, scaglie, tag, tavole and riflessioni, as one JSON file"
        left={props => <List.Icon {...props} icon="database-export-outline" />}
        right={() => (running === 'exportData' ? <ActivityIndicator /> : null)}
        disabled={running !== null}
        onPress={() => void run('exportData')}
      />
      <List.Item
        title="Export settings"
        description="Every preference, as a separate JSON file"
        left={props => <List.Icon {...props} icon="file-export-outline" />}
        right={() =>
          running === 'exportSettings' ? <ActivityIndicator /> : null
        }
        disabled={running !== null}
        onPress={() => void run('exportSettings')}
      />

      <List.Subheader>Import</List.Subheader>
      <List.Item
        title="Import data"
        description="Replaces everything currently in Stele"
        left={props => <List.Icon {...props} icon="database-import-outline" />}
        right={() => (running === 'importData' ? <ActivityIndicator /> : null)}
        disabled={running !== null}
        onPress={() => setPending('importData')}
      />
      <List.Item
        title="Import settings"
        description="Replaces every preference"
        left={props => <List.Icon {...props} icon="file-import-outline" />}
        right={() =>
          running === 'importSettings' ? <ActivityIndicator /> : null
        }
        disabled={running !== null}
        onPress={() => setPending('importSettings')}
      />

      <Text variant="bodySmall" style={styles.footnote}>
        An import checks the whole file before it writes anything. If the file
        is rejected, Stele is left exactly as it was.
      </Text>

      <Portal>
        <Dialog visible={pending !== null} onDismiss={() => setPending(null)}>
          <Dialog.Title>Are you sure?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {pending === null ? '' : IMPORT_WARNINGS.get(pending)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPending(null)}>Cancel</Button>
            <Button onPress={confirm}>Replace</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={error !== null} onDismiss={dismiss}>
          <Dialog.Title>That file was not imported</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {error === null ? '' : describeError(error)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismiss}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={notice !== null} onDismiss={dismiss}>
        {notice ?? ''}
      </Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  footnote: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
});
