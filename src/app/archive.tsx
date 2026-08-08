import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  Snackbar,
  Surface,
  Text,
} from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useArchive } from '@/hooks/useArchive';
import type { ArchiveAction, ArchiveReport } from '@/hooks/useArchive';
import { useTranslation } from '@/hooks/useTranslation';
import type { Translate } from '@/modules/i18n';
import type { AppError } from '@/modules/types';

interface ArchiveEntry {
  action: ArchiveAction;
  icon: string;
}

const EXPORT_ENTRIES: ArchiveEntry[] = [
  { action: 'exportData', icon: 'database-export-outline' },
  { action: 'exportSettings', icon: 'file-export-outline' },
];

const IMPORT_ENTRIES: ArchiveEntry[] = [
  { action: 'importData', icon: 'database-import-outline' },
  { action: 'importSettings', icon: 'file-import-outline' },
];

// The error code names its own message, so a new code needs a catalog entry
// and nothing else. An unmapped one falls back to the generic message.
function describeError(error: AppError, t: Translate): string {
  const message = t(`archive.errors.${error.code}`, {
    defaultValue: t('archive.errors.unknown'),
  });
  return error.cause === undefined ? message : `${message}\n\n${error.cause}`;
}

function describeReport(report: ArchiveReport, t: Translate): string | null {
  if (report.cancelled) {
    return null;
  }

  const { summary } = report;
  if (summary === null) {
    return report.action === 'exportSettings'
      ? t('archive.report.settingsExported')
      : t('archive.report.settingsImported');
  }

  const counted = t('archive.report.counted', {
    journalNotes: summary.journalNotes,
    notes: summary.notes,
    highlights: summary.highlights,
    tags: summary.tags,
    folders: summary.folders,
    reflections: summary.reflections,
  });
  return report.action === 'exportData'
    ? t('archive.report.exported', { counted })
    : t('archive.report.imported', { counted });
}

interface ArchiveItemProps {
  entry: ArchiveEntry;
  running: ArchiveAction | null;
  onPress: (action: ArchiveAction) => void;
}

function ArchiveItem({ entry, running, onPress }: ArchiveItemProps) {
  const { t } = useTranslation();

  return (
    <List.Item
      title={t(`archive.${entry.action}.title`)}
      description={t(`archive.${entry.action}.description`)}
      left={props => <List.Icon {...props} icon={entry.icon} />}
      right={props =>
        running === entry.action ? (
          <ActivityIndicator />
        ) : (
          <List.Icon {...props} icon="chevron-right" />
        )
      }
      disabled={running !== null}
      onPress={() => onPress(entry.action)}
    />
  );
}

export default function ArchiveScreen() {
  const { t } = useTranslation();
  const { running, error, report, run, dismiss } = useArchive();
  const [pending, setPending] = useState<ArchiveAction | null>(null);

  const confirm = () => {
    const action = pending;
    setPending(null);
    if (action !== null) {
      void run(action);
    }
  };

  const notice = report === null ? null : describeReport(report, t);

  return (
    <Surface style={styles.screen} elevation={0}>
      <Text variant="titleLarge" style={styles.section}>
        {t('archive.export')}
      </Text>
      {EXPORT_ENTRIES.map(entry => (
        <ArchiveItem
          key={entry.action}
          entry={entry}
          running={running}
          onPress={action => void run(action)}
        />
      ))}

      <Divider />

      <Text variant="titleLarge" style={styles.section}>
        {t('archive.import')}
      </Text>
      {IMPORT_ENTRIES.map(entry => (
        <ArchiveItem
          key={entry.action}
          entry={entry}
          running={running}
          onPress={setPending}
        />
      ))}

      <Divider />

      <Text variant="bodySmall" style={styles.footnote}>
        {t('archive.footnote')}
      </Text>

      <Portal>
        <Dialog visible={pending !== null} onDismiss={() => setPending(null)}>
          <Dialog.Title>{t('archive.confirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {pending === null ? '' : t(`archive.warnings.${pending}`)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPending(null)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={confirm}>{t('archive.replace')}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={error !== null} onDismiss={dismiss}>
          <Dialog.Title>{t('archive.notImportedTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {error === null ? '' : describeError(error, t)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dismiss}>{t('common.close')}</Button>
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
  section: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  footnote: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
});
