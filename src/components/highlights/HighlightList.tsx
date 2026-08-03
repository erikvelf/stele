import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { PanGesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Divider, IconButton, Text, TextInput, useTheme } from 'react-native-paper';

import { FadingList } from '@/components/shared';
import { createId } from '@/lib/id';
import type { Tag } from '@/modules/highlights';

import { RADIUS, SPACING } from '@/constants/layout';

import { Tag as TagPill } from './Tag';

const BULLET_ICON_SIZE = 20;
const DEFAULT_ROW_SLOT_HEIGHT = 44;
const ROW_GAP = SPACING.sm;
const DRAG_MIN_DISTANCE = 10;
const DRAG_SNAP_DURATION_MS = 220;

// Tag already resolved by the caller; the list only renders it.
export interface ResolvedHighlight {
  id: string;
  text: string;
  tag: Tag | null;
}

interface HighlightListProps {
  highlights: ResolvedHighlight[];
  onChangeText: (id: string, text: string) => void;
  onAddHighlight: (id: string, text: string) => void;
  onFocusHighlight: (id: string) => void;
  onBlurHighlight: (id: string) => void;
  onReorderHighlights: (orderedIds: string[]) => void;
}

interface HighlightRow {
  id: string;
  text: string;
  tag: Tag | null;
  isDraft: boolean;
}

function rowSlotHeight(id: string, heights: Map<string, number>): number {
  return heights.get(id) ?? DEFAULT_ROW_SLOT_HEIGHT;
}

function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b.at(index));
}

// Sum of the slot heights of every row before `index` in `order` — the
// pixel offset of that slot's top edge from the top of the list.
function cumulativeOffset(order: string[], index: number, heights: Map<string, number>): number {
  let offset = 0;
  for (let i = 0; i < index; i += 1) {
    offset += rowSlotHeight(order.at(i) ?? '', heights);
  }
  return offset;
}

interface DragTarget {
  index: number;
  // Pixel offset of the target slot's top edge relative to the start slot's
  // — i.e. how far the dragged row must ultimately travel to land there.
  // Doubles as the live index: whenever it changes, that's a crossing.
  settleY: number;
}

// Walks from `startIndex` in the drag direction, crossing into a neighbor's
// slot once the finger has passed its midpoint. Runs entirely on the UI
// thread inside the pan worklet — computing this in JS would mean the
// result always lagged one bridge round-trip behind the finger.
function computeDragTarget(
  startOrderHeights: number[],
  startIndex: number,
  translationY: number
): DragTarget {
  'worklet';
  if (translationY === 0) {
    return { index: startIndex, settleY: 0 };
  }
  const direction = translationY > 0 ? 1 : -1;
  let remaining = Math.abs(translationY);
  let index = startIndex;
  let settleY = 0;
  for (
    let neighborIndex = index + direction;
    neighborIndex >= 0 && neighborIndex < startOrderHeights.length;
    neighborIndex += direction
  ) {
    const neighborHeight = startOrderHeights.at(neighborIndex) ?? DEFAULT_ROW_SLOT_HEIGHT;
    if (remaining < neighborHeight / 2) {
      break;
    }
    remaining -= neighborHeight;
    index = neighborIndex;
    settleY += direction * neighborHeight;
  }
  return { index, settleY };
}

interface HighlightRowContentProps {
  row: HighlightRow;
  isFocused: boolean;
  isDragged: boolean;
  dragHandle: React.ReactNode;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

// Pure row visuals — tag/bullet, text field, drag handle slot — shared by
// the in-list row and the floating overlay copy shown while it's dragged.
function HighlightRowContent({
  row,
  isFocused,
  isDragged,
  dragHandle,
  onChangeText,
  onFocus,
  onBlur,
}: HighlightRowContentProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.colors.surface },
        isFocused && { backgroundColor: theme.colors.surfaceVariant },
        isDragged && [styles.rowDragged, { backgroundColor: theme.colors.elevation.level3 }],
      ]}
    >
      <TextInput
        mode="flat"
        dense
        multiline
        placeholder="Un piccolo traguardo…"
        value={row.text}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        style={styles.input}
        contentStyle={styles.inputContent}
        underlineStyle={styles.inputUnderline}
      />
      <View style={styles.trailingSlot}>
        {dragHandle}
        {row.tag ? <TagPill tag={row.tag} isSmall /> : null}
      </View>
    </View>
  );
}

interface HighlightRowViewProps {
  row: HighlightRow;
  index: number;
  isFocused: boolean;
  isDragged: boolean;
  dragGesture: PanGesture | undefined;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

// A single in-list row. While it's the dragged row it renders invisible
// (opacity 0) but still occupies its slot, so FadingList keeps animating
// the gap for it — the visible, finger-tracking copy is a separate overlay
// the parent renders outside the list, immune to the list's own layout
// reflow. `dragGesture` is built and owned by the parent (one per row,
// memoized by id) since it mutates shared values the parent owns.
function HighlightRowView({
  row,
  index,
  isFocused,
  isDragged,
  dragGesture,
  onChangeText,
  onFocus,
  onBlur,
  onLayout,
}: HighlightRowViewProps) {
  return (
    <View onLayout={onLayout} style={isDragged && styles.rowHidden}>
      {index > 0 ? <Divider /> : null}
      <HighlightRowContent
        row={row}
        isFocused={isFocused}
        isDragged={isDragged}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        dragHandle={
          dragGesture ? (
            <GestureDetector gesture={dragGesture}>
              <IconButton icon="menu" size={BULLET_ICON_SIZE} onPress={onFocus} />
            </GestureDetector>
          ) : (
            <IconButton icon="menu" size={BULLET_ICON_SIZE} onPress={onFocus} />
          )
        }
      />
    </View>
  );
}

interface DragOverlayProps {
  row: HighlightRow;
  top: number;
  translateY: ReturnType<typeof useSharedValue<number>>;
}

// The visible copy of the row being dragged: absolutely positioned at its
// original slot, then offset by a shared value the gesture drives directly
// (finger-follow while active, eased to the target slot on release). Never
// participates in the list's own layout, so it can't be caught mid-frame by
// a reflow the way the in-list row was.
function DragOverlay({ row, top, translateY }: DragOverlayProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.dragOverlay, { top }, animatedStyle]} pointerEvents="none">
      <HighlightRowContent
        row={row}
        isFocused={false}
        isDragged
        onChangeText={() => {}}
        onFocus={() => {}}
        onBlur={() => {}}
        dragHandle={<IconButton icon="menu" size={BULLET_ICON_SIZE} disabled />}
      />
    </Animated.View>
  );
}

interface DragState {
  id: string;
  originTop: number;
}

// One-line entries, each optionally tagged. A trailing empty draft row
// commits to `highlights` once typed into; blurring a row left empty
// deletes it.
//
// Row order lives in local `orderedIds` state rather than being derived
// fresh from `highlights` every render, so a drag in progress (or a drop
// not yet reflected by the parent) is never overwritten mid-flight. When
// `highlights` changes for reasons other than our own reorder — add,
// delete, edit — the new id set is merged into the existing order during
// render (comparing against the previous `highlights` kept in state, the
// sanctioned way to adjust state from a prop change without an extra
// render pass), so new rows appear in the same commit as the prop change.
export function HighlightList({
  highlights,
  onChangeText,
  onAddHighlight,
  onFocusHighlight,
  onBlurHighlight,
  onReorderHighlights,
}: HighlightListProps) {
  const theme = useTheme();
  const [draftId, setDraftId] = useState(createId);
  const [draftText, setDraftText] = useState('');
  const [pendingRowId, setPendingRowId] = useState<string | undefined>(undefined);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState(() => highlights.map(h => h.id));
  const [previousHighlights, setPreviousHighlights] = useState(highlights);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragTranslateY = useSharedValue(0);
  const dragStartHeights = useSharedValue<number[]>([]);
  const dragStartIndex = useSharedValue(0);
  const rowHeightsRef = useRef<Map<string, number>>(new Map());
  const dragStartOrderRef = useRef<string[]>([]);
  const lastTargetIndexRef = useRef(0);
  const orderedIdsRef = useRef(orderedIds);

  if (previousHighlights !== highlights) {
    setPreviousHighlights(highlights);
    const nextIds = new Set(highlights.map(h => h.id));
    const kept = orderedIds.filter(id => nextIds.has(id));
    const addedIds = highlights.map(h => h.id).filter(id => !orderedIds.includes(id));
    const merged = [...kept, ...addedIds];
    if (!sameOrder(merged, orderedIds)) {
      setOrderedIds(merged);
    }
  }

  useEffect(() => {
    orderedIdsRef.current = orderedIds;
  }, [orderedIds]);

  const handleRowLayout = (id: string, event: LayoutChangeEvent) => {
    rowHeightsRef.current.set(id, event.nativeEvent.layout.height + ROW_GAP);
  };

  const handleDragStart = useCallback(
    (id: string) => {
      Keyboard.dismiss();
      const startOrder = orderedIdsRef.current;
      dragStartOrderRef.current = startOrder;
      const startIndex = startOrder.indexOf(id);
      lastTargetIndexRef.current = startIndex;
      dragTranslateY.value = 0;
      dragStartHeights.value = startOrder.map(rowId => rowSlotHeight(rowId, rowHeightsRef.current));
      dragStartIndex.value = startIndex;
      setDrag({ id, originTop: cumulativeOffset(startOrder, startIndex, rowHeightsRef.current) });
    },
    [dragTranslateY, dragStartHeights, dragStartIndex]
  );

  const handleDragUpdate = useCallback((id: string, targetIndex: number) => {
    if (targetIndex === lastTargetIndexRef.current) {
      return;
    }
    lastTargetIndexRef.current = targetIndex;
    const nextOrder = dragStartOrderRef.current.filter(rowId => rowId !== id);
    nextOrder.splice(targetIndex, 0, id);
    setOrderedIds(nextOrder);
    orderedIdsRef.current = nextOrder;
  }, []);

  const handleDragEnd = useCallback(
    (id: string, settleY: number) => {
      dragTranslateY.value = withTiming(settleY, { duration: DRAG_SNAP_DURATION_MS }, finished => {
        if (finished) {
          runOnJS(setDrag)(null);
        }
      });
      const from = dragStartOrderRef.current.indexOf(id);
      if (from !== lastTargetIndexRef.current) {
        onReorderHighlights(orderedIdsRef.current);
      }
    },
    [dragTranslateY, onReorderHighlights]
  );

  // One gesture per highlight, memoized by id set so an in-progress pan is
  // never handed a fresh Gesture instance — reordering `orderedIds` mid-drag
  // must not recreate this map. Built (and its shared-value mutations owned)
  // here rather than per row, since the row component only reads them.
  const dragGestures = useMemo(() => {
    const gestures = new Map<string, PanGesture>();
    for (const highlight of highlights) {
      const { id } = highlight;
      gestures.set(
        id,
        Gesture.Pan()
          .minDistance(DRAG_MIN_DISTANCE)
          .onStart(() => {
            runOnJS(handleDragStart)(id);
          })
          .onUpdate(event => {
            dragTranslateY.value = event.translationY;
            const { index: targetIndex } = computeDragTarget(
              dragStartHeights.value,
              dragStartIndex.value,
              event.translationY
            );
            runOnJS(handleDragUpdate)(id, targetIndex);
          })
          .onEnd(event => {
            const { settleY } = computeDragTarget(
              dragStartHeights.value,
              dragStartIndex.value,
              event.translationY
            );
            runOnJS(handleDragEnd)(id, settleY);
          })
      );
    }
    return gestures;
  }, [
    highlights,
    dragTranslateY,
    dragStartHeights,
    dragStartIndex,
    handleDragStart,
    handleDragUpdate,
    handleDragEnd,
  ]);

  const highlightById = useMemo(
    () => new Map(highlights.map(highlight => [highlight.id, highlight])),
    [highlights]
  );

  const rows: HighlightRow[] = [
    ...orderedIds.flatMap(id => {
      const highlight = highlightById.get(id);
      return highlight
        ? [{ id: highlight.id, text: highlight.text, tag: highlight.tag, isDraft: false }]
        : [];
    }),
    { id: draftId, text: draftText, tag: null, isDraft: true },
  ];

  const draggedRow = drag ? rows.find(row => row.id === drag.id) : undefined;

  const handleChangeText = (row: HighlightRow, text: string) => {
    if (!row.isDraft) {
      onChangeText(row.id, text);
      return;
    }
    if (text.length === 0) {
      setDraftText(text);
      return;
    }
    onAddHighlight(draftId, text);
    setPendingRowId(draftId);
    setDraftId(createId());
    setDraftText('');
  };

  const handleBlur = (row: HighlightRow) => {
    setFocusedRowId(current => (current === row.id ? null : current));
    onBlurHighlight(row.id);
    if (!row.isDraft && row.text.trim().length === 0) {
      onChangeText(row.id, '');
    }
  };

  const renderRow = (row: HighlightRow, index: number) => (
    <HighlightRowView
      row={row}
      index={index}
      isFocused={row.id === focusedRowId}
      isDragged={row.id === drag?.id}
      dragGesture={dragGestures.get(row.id)}
      onChangeText={text => handleChangeText(row, text)}
      onFocus={() => {
        setFocusedRowId(row.id);
        onFocusHighlight(row.id);
      }}
      onBlur={() => handleBlur(row)}
      onLayout={event => handleRowLayout(row.id, event)}
    />
  );

  return (
    <View style={styles.container}>
      <FadingList
        items={rows}
        keyExtractor={row => row.id}
        pendingId={pendingRowId}
        onTopItemSettled={() => setPendingRowId(undefined)}
        renderItem={renderRow}
      />
      {drag && draggedRow ? (
        <DragOverlay row={draggedRow} top={drag.originTop} translateY={dragTranslateY} />
      ) : null}
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        5 è il numero che di solito basta, non un limite
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  rowHidden: {
    opacity: 0,
  },
  rowDragged: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dragOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inputContent: {
    paddingHorizontal: 0,
  },
  inputUnderline: {
    display: 'none',
  },
  trailingSlot: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
});
