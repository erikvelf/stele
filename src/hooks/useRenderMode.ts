import { useCallback, useState } from 'react';

interface UseRenderModeOptions {
  noteId: string;
  isLoading: boolean;
  hasText: boolean;
}

interface UseRenderModeResult {
  isRenderMode: boolean;
  toggleRenderMode: () => void;
}

// Chooses the initial mode once the note has loaded: an empty note opens in the
// editor, a written one opens rendered. The choice re-arms when the screen
// swaps to another note without unmounting.
export function useRenderMode({
  noteId,
  isLoading,
  hasText,
}: UseRenderModeOptions): UseRenderModeResult {
  const [isRenderMode, setIsRenderMode] = useState(false);
  const [initializedNoteId, setInitializedNoteId] = useState<string | null>(
    null
  );

  // Applied during render rather than in an effect, so the first painted frame
  // is already in the right mode.
  if (!isLoading && initializedNoteId !== noteId) {
    setInitializedNoteId(noteId);
    setIsRenderMode(hasText);
  }

  const toggleRenderMode = useCallback(() => {
    setIsRenderMode(current => !current);
  }, []);

  return { isRenderMode, toggleRenderMode };
}
