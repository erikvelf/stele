import { useCallback, useMemo, useState } from 'react';
import type {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';

import type { MarkdownFormat, TextSelection } from '@/lib/markdownFormat';
import { activeFormats, applyFormat } from '@/lib/markdownFormat';

const CARET_AT_START: TextSelection = { start: 0, end: 0 };

interface UseMarkdownFormatOptions {
  text: string;
  onChangeText: (text: string) => void;
}

interface UseMarkdownFormatResult {
  selection: TextSelection | undefined;
  formats: readonly MarkdownFormat[];
  isFocused: boolean;
  onSelectionChange: (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => void;
  onFocus: () => void;
  onBlur: () => void;
  onFormatPress: (format: MarkdownFormat) => void;
}

// The input keeps its own caret while the user types. A selection is pushed
// back to it only after a format press, and released as soon as the input
// reports it.
export function useMarkdownFormat({
  text,
  onChangeText,
}: UseMarkdownFormatOptions): UseMarkdownFormatResult {
  const [selection, setSelection] = useState<TextSelection>(CARET_AT_START);
  const [pendingSelection, setPendingSelection] =
    useState<TextSelection | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const onSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(event.nativeEvent.selection);
      setPendingSelection(null);
    },
    []
  );

  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  const onFormatPress = useCallback(
    (format: MarkdownFormat) => {
      const formatted = applyFormat(text, selection, format);
      setSelection(formatted.selection);
      setPendingSelection(formatted.selection);
      onChangeText(formatted.text);
    },
    [text, selection, onChangeText]
  );

  const formats = useMemo(
    () => activeFormats(text, selection),
    [text, selection]
  );

  return {
    selection: pendingSelection ?? undefined,
    formats,
    isFocused,
    onSelectionChange,
    onFocus,
    onBlur,
    onFormatPress,
  };
}
