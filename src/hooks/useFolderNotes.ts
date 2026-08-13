import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@/hooks/useTranslation';
import { createId } from '@/lib/id';
import {
  deleteNote,
  listFolderNotes,
  moveNoteToFolder,
  type Note,
  writeNote,
} from '@/modules/notes';
import type { AppError } from '@/modules/types';

interface UseFolderNotesResult {
  notes: Note[];
  error: AppError | null;
  isLoading: boolean;
  refresh: () => void;
  createNote: () => string;
  moveNote: (id: string, targetFolderId: string) => void;
  removeNote: (id: string) => void;
}

export function useFolderNotes(folderId: string): UseFolderNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const refresh = useCallback(() => {
    void listFolderNotes(folderId).then(result => {
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setNotes(result.data);
      setIsLoading(false);
    });
  }, [folderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback((): string => {
    const note: Note = {
      id: createId(),
      text: `# ${t('notes.defaultTitle')}`,
      folder_id: folderId,
      created_at: Date.now(),
    };

    setNotes(previous => [note, ...previous]);

    void writeNote(note).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });

    return note.id;
  }, [folderId, t]);

  const moveNote = useCallback((id: string, targetFolderId: string) => {
    setNotes(previous => previous.filter(note => note.id !== id));
    void moveNoteToFolder(id, targetFolderId).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(previous => previous.filter(note => note.id !== id));
    void deleteNote(id).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });
  }, []);

  return { notes, error, isLoading, refresh, createNote, moveNote, removeNote };
}
