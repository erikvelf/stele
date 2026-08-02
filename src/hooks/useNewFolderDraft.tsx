import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { Folder } from '@/modules/folders';
import { DEFAULT_STONE_ID } from '@/modules/types';
import type { StoneId } from '@/modules/types';

const DEFAULT_EMOJI = '🗿';

interface NewFolderDraftContextValue {
  isSheetOpen: boolean;
  editingId: string | null;
  name: string;
  emoji: string;
  stoneId: StoneId;
  openSheet: () => void;
  openSheetFor: (folder: Folder) => void;
  closeSheet: () => void;
  setName: (name: string) => void;
  setEmoji: (emoji: string) => void;
  setStoneId: (stoneId: StoneId) => void;
  reset: () => void;
}

const NewFolderDraftContext = createContext<NewFolderDraftContextValue | null>(
  null
);

interface NewFolderDraftProviderProps {
  children: ReactNode;
}

// Holds the in-progress "new folder" form outside the sheet component, so
// the draft survives the round trip to the /folder/new-color screen and
// back — the sheet closes to let that screen push, then reopens with the
// chosen stone already applied.
export function NewFolderDraftProvider({
  children,
}: NewFolderDraftProviderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [stoneId, setStoneId] = useState<StoneId>(DEFAULT_STONE_ID);

  const value = useMemo<NewFolderDraftContextValue>(
    () => ({
      isSheetOpen,
      editingId,
      name,
      emoji,
      stoneId,
      // Neutral reopen — used both to start a fresh create (paired with
      // `reset()` at the call site) and to reopen mid-edit after the
      // color-picker round trip, so it must never touch `editingId` itself.
      openSheet: () => setIsSheetOpen(true),
      openSheetFor: folder => {
        setEditingId(folder.id);
        setName(folder.name);
        setEmoji(folder.emoji);
        // Every folder is written with a color from STONE_IDS — see the same
        // cast in FolderCard.
        setStoneId(folder.color as StoneId);
        setIsSheetOpen(true);
      },
      closeSheet: () => setIsSheetOpen(false),
      setName,
      setEmoji,
      setStoneId,
      reset: () => {
        setEditingId(null);
        setName('');
        setEmoji(DEFAULT_EMOJI);
        setStoneId(DEFAULT_STONE_ID);
      },
    }),
    [isSheetOpen, editingId, name, emoji, stoneId]
  );

  return (
    <NewFolderDraftContext.Provider value={value}>
      {children}
    </NewFolderDraftContext.Provider>
  );
}

export function useNewFolderDraft(): NewFolderDraftContextValue {
  const context = useContext(NewFolderDraftContext);
  if (!context) {
    throw new Error(
      'useNewFolderDraft must be used within a NewFolderDraftProvider'
    );
  }
  return context;
}
