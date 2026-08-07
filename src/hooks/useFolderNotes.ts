import { useCallback, useEffect, useState } from 'react';

import { createId } from '@/lib/id';
import {
  deleteNote,
  listFolderNotes,
  writeNote,
  writeNoteCreated,
  writeNoteFolder,
  type Note,
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

// A folder's plain notes, newest first — the note_created join gives them an
// order without requiring the date_day_range a journal sasso needs.
export function useFolderNotes(folderId: string): UseFolderNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const noteId = createId();
    const note: Note = { id: noteId, text: '' };

    setNotes(previous => [note, ...previous]);

    void Promise.all([
      writeNote(note),
      writeNoteCreated({ note_id: noteId, created_at: Date.now() }),
      writeNoteFolder({ note_id: noteId, folder_id: folderId }),
    ]).then(([writeResult]) => {
      if (!writeResult.success) {
        setError(writeResult.error);
      }
    });

    return noteId;
  }, [folderId]);

  const moveNote = useCallback((id: string, targetFolderId: string) => {
    setNotes(previous => previous.filter(note => note.id !== id));
    void writeNoteFolder({ note_id: id, folder_id: targetFolderId }).then(
      result => {
        if (!result.success) {
          setError(result.error);
        }
      }
    );
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
