import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { InfoSwatch } from '@/components/ui';
import { buildTheme, seedFor, tonalPairFor } from '@/modules/palette';
import type { Folder } from '@/modules/folders';
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

const FolderCarouselItem = memo(function FolderCarouselItem({
  folder,
  size,
  isDark,
  onSelectFolder,
}: FolderCarouselItemProps) {
  const stoneId = folder.color as StoneId;
  const stoneTheme = useMemo(() => buildTheme(stoneId, isDark), [stoneId, isDark]);
  const { onContainer } = useMemo(
    () => tonalPairFor(stoneId, isDark),
    [stoneId, isDark]
  );

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
        labelColor={onContainer}
      />
    </Pressable>
  );
});

const AUTO_ADVANCE_INTERVAL_MS = 4000;
const RESUME_AFTER_TOUCH_MS = 6000;
// No FlatList primitive loops a data array, and any explicit "reset scroll
// to index 0" jump flashes even when the content underneath is identical.
// Repeating the folders enough times sidesteps the problem instead of
// solving it: the virtual list is long enough that neither the timer nor a
// swiping user reaches its real end in a normal session, so no reset is
// ever needed.
const LOOP_LAPS = 50;

function buildLoopData(folders: Folder[]): Folder[] {
  if (folders.length === 0) {
    return [];
  }
  return Array.from(
    { length: folders.length * LOOP_LAPS },
    (_, index) => folders[index % folders.length]
  );
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
    const startIndex = Math.floor(data.length / 2 / folders.length) * folders.length;
    currentIndexRef.current = startIndex;
    listRef.current?.scrollToIndex({ index: startIndex, animated: false });
  }, [folders.length, data.length]);

  useEffect(() => {
    if (data.length === 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (isTouchedRef.current) {
        return;
      }
      const nextIndex = currentIndexRef.current + 1;
      // The loop is long, not infinite — over a long enough idle session
      // nextIndex would eventually run past `data.length`. Wrap it back to
      // the equivalent position near the middle of the loop before that
      // happens; since every folders.length-th item is identical, the jump
      // (done without animation) is imperceptible.
      if (nextIndex >= data.length - folders.length) {
        const wrappedIndex =
          (nextIndex % folders.length) +
          Math.floor(data.length / 2 / folders.length) * folders.length;
        currentIndexRef.current = wrappedIndex;
        listRef.current?.scrollToIndex({ index: wrappedIndex, animated: false });
        return;
      }
      currentIndexRef.current = nextIndex;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, AUTO_ADVANCE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [data.length, folders.length]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentIndexRef.current = Math.round(
        event.nativeEvent.contentOffset.x / size
      );
      resumeTimeoutRef.current = setTimeout(() => {
        isTouchedRef.current = false;
      }, RESUME_AFTER_TOUCH_MS);
    },
    [size]
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
