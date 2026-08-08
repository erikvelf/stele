import { useCallback, useEffect, useState } from 'react';

import { createId } from '@/lib/id';
import {
  deleteFolder,
  JOURNAL_FOLDER_ID,
  listFolders,
  writeFolder,
} from '@/modules/folders';
import type { Folder } from '@/modules/folders';
import type { AppError } from '@/modules/types';

interface FolderInput {
  name: string;
  emoji: string;
  color: Folder['color'];
}

interface UseFoldersResult {
  folders: Folder[];
  error: AppError | null;
  isLoading: boolean;
  refresh: () => void;
  createFolder: (input: FolderInput) => Folder;
  updateFolder: (id: string, input: FolderInput) => void;
  removeFolder: (id: string) => void;
}

// The shelf's folder list — every folder except the diario, which PRD says
// stays out of the scaffale since the home page already surfaces it.
export function useFolders(): UseFoldersResult {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    void listFolders().then(result => {
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setFolders(result.data.filter(folder => folder.id !== JOURNAL_FOLDER_ID));
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFolder = useCallback((input: FolderInput): Folder => {
    const folder: Folder = { id: createId(), ...input };
    setFolders(previous => [...previous, folder]);
    void writeFolder(folder).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });
    return folder;
  }, []);

  const updateFolder = useCallback((id: string, input: FolderInput) => {
    const folder: Folder = { id, ...input };
    setFolders(previous =>
      previous.map(candidate => (candidate.id === id ? folder : candidate))
    );
    void writeFolder(folder).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });
  }, []);

  const removeFolder = useCallback((id: string) => {
    setFolders(previous => previous.filter(folder => folder.id !== id));
    void deleteFolder(id).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });
  }, []);

  return {
    folders,
    error,
    isLoading,
    refresh,
    createFolder,
    updateFolder,
    removeFolder,
  };
}
