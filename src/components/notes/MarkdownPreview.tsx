import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import {
  EnrichedMarkdownText,
  type MarkdownStyle,
} from 'react-native-enriched-markdown';

interface MarkdownPreviewProps {
  markdown: string;
  fontSize?: number;
  lineHeight?: number;
  /** Clamps the render to a whole number of lines. Requires `lineHeight`. */
  maxLines?: number;
}

const FLUSH_BLOCK = { marginTop: 0, marginBottom: 0 };

export function MarkdownPreview({
  markdown,
  fontSize,
  lineHeight,
  maxLines,
}: MarkdownPreviewProps) {
  const theme = useTheme();
  const isClamped = maxLines !== undefined && lineHeight !== undefined;

  const markdownStyle = useMemo<MarkdownStyle>(() => {
    const color = theme.colors.onSurface;
    const sizing = {
      ...(fontSize !== undefined && { fontSize }),
      ...(lineHeight !== undefined && { lineHeight }),
      ...(isClamped && FLUSH_BLOCK),
    };
    const heading = { color, ...sizing };
    const paragraph = { color, ...sizing };

    return {
      paragraph,
      h1: heading,
      h2: heading,
      h3: heading,
      h4: heading,
      h5: heading,
      h6: heading,
      blockquote: {
        color,
        borderColor: theme.colors.outlineVariant,
        ...sizing,
      },
      list: { color, bulletColor: color, markerColor: color, ...sizing },
      code: { color, ...(fontSize !== undefined && { fontSize }) },
      codeBlock: {
        color,
        backgroundColor: theme.colors.surfaceVariant,
        ...(fontSize !== undefined && { fontSize }),
      },
      link: { color: theme.colors.primary, underline: true },
    };
  }, [theme, fontSize, lineHeight, isClamped]);

  const content = (
    <EnrichedMarkdownText markdown={markdown} markdownStyle={markdownStyle} />
  );

  if (!isClamped) {
    return content;
  }

  return (
    <View style={[styles.clamp, { maxHeight: lineHeight * maxLines }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  clamp: {
    overflow: 'hidden',
  },
});
