import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { InfoSwatch } from '@/components/ui';
import { contrastColor } from '@/lib/contrastColor';
import type { Folder } from '@/modules/folders';
import { buildTheme, seedFor } from '@/modules/palette';
import type { StoneId } from '@/modules/types';

interface FoldersCarouselProps {
  folders: Folder[];
  size: number;
  onSelectFolder: (folder: Folder) => void;
}

interface FolderCarouselItemProps {
  folder: Folder;
  size: number;
  isDark: boolean;
  onSelectFolder: (folder: Folder) => void;
}

function FolderCarouselItemComponent({
  folder,
  size,
  isDark,
  onSelectFolder,
}: FolderCarouselItemProps) {
  const stoneId = folder.color as StoneId;
  const stoneTheme = useMemo(
    () => buildTheme(stoneId, isDark),
    [stoneId, isDark]
  );
  const labelColor = useMemo(() => contrastColor(seedFor(stoneId)), [stoneId]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelectFolder(folder)}
    >
      <InfoSwatch
        size={size}
        color={seedFor(stoneId)}
        shadeColor={stoneTheme.colors.shadow}
        icon={<Text style={styles.emoji}>{folder.emoji}</Text>}
        label={folder.name}
        labelColor={labelColor}
      />
    </Pressable>
  );
}

const FolderCarouselItem = memo(FolderCarouselItemComponent);

const AUTO_ADVANCE_INTERVAL_MS = 4000;
const RESUME_AFTER_TOUCH_MS = 6000;
// No FlatList primitive loops a data array. Three laps (previous, current,
// next) are enough: whenever the resting index drifts into the outer laps,
// it gets silently re-centred into the middle lap before any further
// scrolling happens. The re-centred index always points at the same folder
// (same index modulo folders.length) as the position it replaces, so the
// jump renders an identical frame and is genuinely invisible — not just
// rare, as a bigger repeated array would only make it.
const LOOP_LAPS = 3;
const MIDDLE_LAP = 1;

function buildLoopData(folders: Folder[]): Folder[] {
  if (folders.length === 0) {
    return [];
  }
  return Array.from(
    { length: folders.length * LOOP_LAPS },
    (_, index) => folders[index % folders.length]
  );
}

function centerInMiddleLap(index: number, foldersLength: number): number {
  const offset = ((index % foldersLength) + foldersLength) % foldersLength;
  return MIDDLE_LAP * foldersLength + offset;
}

export function FoldersCarousel({
  folders,
  size,
  onSelectFolder,
}: FoldersCarouselProps) {
  const theme = useTheme();
  const listRef = useRef<FlatList<Folder>>(null);
  const currentIndexRef = useRef(0);
  const isTouchedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const data = useMemo(() => buildLoopData(folders), [folders]);

  useEffect(() => {
    if (data.length === 0) {
      return;
    }
    const startIndex = MIDDLE_LAP * folders.length;
    currentIndexRef.current = startIndex;
    listRef.current?.scrollToIndex({ index: startIndex, animated: false });
  }, [folders.length, data.length]);

  useEffect(() => {
    if (data.length === 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (isTouchedRef.current || AppState.currentState !== 'active') {
        return;
      }
      // Re-centre before advancing, not after: a drifted resting index gets
      // silently snapped back into the middle lap (same folder, so no
      // visible change) so the upcoming animated step never runs off the
      // small looped array.
      let base = currentIndexRef.current;
      if (base < folders.length || base >= 2 * folders.length) {
        base = centerInMiddleLap(base, folders.length);
        currentIndexRef.current = base;
        listRef.current?.scrollToIndex({ index: base, animated: false });
      }
      const nextIndex = base + 1;
      currentIndexRef.current = nextIndex;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, AUTO_ADVANCE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [data.length, folders.length]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const settledIndex = Math.round(event.nativeEvent.contentOffset.x / size);
      if (settledIndex < folders.length || settledIndex >= 2 * folders.length) {
        const centeredIndex = centerInMiddleLap(settledIndex, folders.length);
        currentIndexRef.current = centeredIndex;
        listRef.current?.scrollToIndex({
          index: centeredIndex,
          animated: false,
        });
      } else {
        currentIndexRef.current = settledIndex;
      }
      resumeTimeoutRef.current = setTimeout(() => {
        isTouchedRef.current = false;
      }, RESUME_AFTER_TOUCH_MS);
    },
    [size, folders.length]
  );

  const handleTouchStart = useCallback(() => {
    isTouchedRef.current = true;
    clearTimeout(resumeTimeoutRef.current);
  }, []);

  useEffect(() => () => clearTimeout(resumeTimeoutRef.current), []);

  const renderItem = useCallback(
    ({ item: folder }: { item: Folder }) => (
      <FolderCarouselItem
        folder={folder}
        size={size}
        isDark={theme.dark}
        onSelectFolder={onSelectFolder}
      />
    ),
    [size, theme.dark, onSelectFolder]
  );

  if (folders.length === 0 || size <= 0) {
    return null;
  }

  return (
    <FlatList
      ref={listRef}
      data={data}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.viewport, { width: size, height: size }]}
      keyExtractor={(folder, index) => `${folder.id}-${index}`}
      getItemLayout={(_, index) => ({
        length: size,
        offset: size * index,
        index,
      })}
      onScrollBeginDrag={handleTouchStart}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      renderItem={renderItem}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={3}
      removeClippedSubviews
    />
  );
}

const EMOJI_FONT_SIZE = 28;

const styles = StyleSheet.create({
  viewport: {
    flexGrow: 0,
  },
  emoji: {
    fontSize: EMOJI_FONT_SIZE,
  },
});
