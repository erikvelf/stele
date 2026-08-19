import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import type { ComposedGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInRight,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { createId } from '@/lib/id';
import {
  mergedOrder,
  movedOrder,
  sameOrder,
  targetIndexFor,
  topOfId,
} from '@/lib/reorder';
import { haptics } from '@/modules/haptics';
import type { Tag } from '@/modules/highlights';

import { HighlightRow } from './HighlightRow';
import type { ReorderMotion } from './HighlightRow';

const DROP_SETTLE_MS = 200;
const TRANSITION_MS = 380;
const NO_HELD_ID = '';
const transitionEasing = Easing.out(Easing.cubic);
// A finger is never still. The hold survives this much drift; past it the
// page scrolls instead, exactly as it does anywhere else on the screen.
const DRAG_HOLD_MS = 250;
const DRAG_HOLD_SLOP = 24;

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
  onDragActiveChange?: (isActive: boolean) => void;
}

interface HighlightRowModel {
  id: string;
  text: string;
  tag: Tag | null;
  isDraft: boolean;
}

interface DragListeners {
  onReorderHighlights: (orderedIds: string[]) => void;
  onDragActiveChange: ((isActive: boolean) => void) | undefined;
  onTapHandle: (id: string) => void;
}

function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

interface DragReorderResult {
  renderIds: string[];
  motion: ReorderMotion;
  dragGestures: Map<string, ComposedGesture>;
  onRowLayout: (id: string, event: LayoutChangeEvent) => void;
}

interface DragShared extends ReorderMotion {
  isHeld: SharedValue<boolean>;
  grabOffset: SharedValue<number>;
}

interface DragHandlers {
  onBegin: () => void;
  onCross: () => void;
  onDrop: (next: string[]) => void;
  onTap: (id: string) => void;
}

function createRowGesture(
  id: string,
  shared: DragShared,
  handlers: DragHandlers
): ComposedGesture {
  const longPress = Gesture.LongPress()
    .minDuration(DRAG_HOLD_MS)
    .maxDistance(DRAG_HOLD_SLOP)
    .onStart(() => {
      shared.isHeld.value = true;
      shared.heldId.value = id;
      shared.heldOffset.value = 0;
      shared.grabOffset.value = 0;
      shared.targetIndex.value = shared.order.value.indexOf(id);
      runOnJS(handlers.onBegin)();
    });

  const tap = Gesture.Tap().onEnd((_event, isSuccessful) => {
    if (isSuccessful && !shared.isHeld.value) {
      runOnJS(handlers.onTap)(id);
    }
  });

  // Manual activation is the whole fix: a pan that is never judged can never
  // be rejected, so the scroll view cannot take the touch away before the
  // hold has had its say.
  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, manager) => {
      if (shared.isHeld.value) {
        manager.activate();
      }
    })
    .onStart(event => {
      shared.grabOffset.value = event.translationY;
    })
    .onUpdate(event => {
      if (!shared.isHeld.value) {
        return;
      }
      const travel = event.translationY - shared.grabOffset.value;
      shared.heldOffset.value = travel;
      const next = targetIndexFor(
        shared.order.value,
        shared.renderIds.value,
        shared.heights.value,
        id,
        travel
      );
      if (next !== shared.targetIndex.value) {
        shared.targetIndex.value = next;
        runOnJS(handlers.onCross)();
      }
    })
    // One callback writes the order, the release and the offset together, so
    // the row's own style never sees half a drop.
    .onFinalize(() => {
      if (!shared.isHeld.value) {
        return;
      }
      shared.isHeld.value = false;
      const current = shared.order.value;
      const slots = shared.renderIds.value;
      const heights = shared.heights.value;
      const next = movedOrder(current, id, shared.targetIndex.value);
      const settle =
        topOfId(next, slots, heights, id) -
        topOfId(current, slots, heights, id);
      shared.heldOffset.value = withTiming(
        settle,
        { duration: DROP_SETTLE_MS },
        isFinished => {
          if (isFinished) {
            shared.order.value = next;
            shared.heldId.value = NO_HELD_ID;
            shared.heldOffset.value = 0;
            runOnJS(handlers.onDrop)(next);
          }
        }
      );
    });

  return Gesture.Simultaneous(Gesture.Exclusive(longPress, tap), pan);
}

// Two sequences: `renderIds` is the order the rows are laid out in and never
// changes once a row is on screen, `order` is the order the reader sees and
// is expressed as a translation off the rendered slot. A drop rewrites
// `order` alone, so nothing in the tree moves and no layout pass can arrive
// a frame apart from the transforms that were meant to cancel it.
function useDragReorder(
  highlights: ResolvedHighlight[],
  listeners: DragListeners
): DragReorderResult {
  const [renderIds, setRenderIds] = useState(() => highlights.map(h => h.id));
  const [order, setOrder] = useState(renderIds);
  const [previousHighlights, setPreviousHighlights] = useState(highlights);

  const renderIdsValue = useSharedValue(renderIds);
  const orderValue = useSharedValue(order);
  const heights = useSharedValue<number[]>([]);
  const heldId = useSharedValue(NO_HELD_ID);
  const heldOffset = useSharedValue(0);
  const targetIndex = useSharedValue(0);
  const isHeld = useSharedValue(false);
  const grabOffset = useSharedValue(0);

  const heightsRef = useRef<Map<string, number>>(new Map());
  const renderIdsRef = useRef(renderIds);
  const orderRef = useRef(order);
  const listenersRef = useRef(listeners);

  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  if (previousHighlights !== highlights) {
    setPreviousHighlights(highlights);
    const ids = highlights.map(h => h.id);
    const nextRender = mergedOrder(renderIds, ids);
    if (!sameOrder(nextRender, renderIds)) {
      setRenderIds(nextRender);
    }
    const nextOrder = mergedOrder(order, ids);
    if (!sameOrder(nextOrder, order)) {
      setOrder(nextOrder);
    }
  }

  const publishHeights = useCallback(() => {
    heights.value = renderIdsRef.current.map(
      id => heightsRef.current.get(id) ?? 0
    );
  }, [heights]);

  useEffect(() => {
    renderIdsRef.current = renderIds;
    renderIdsValue.value = renderIds;
    publishHeights();
  }, [renderIds, renderIdsValue, publishHeights]);

  useEffect(() => {
    orderRef.current = order;
    orderValue.value = order;
  }, [order, orderValue]);

  const onRowLayout = useCallback(
    (id: string, event: LayoutChangeEvent) => {
      heightsRef.current.set(id, event.nativeEvent.layout.height);
      publishHeights();
    },
    [publishHeights]
  );

  const beginDrag = useCallback(() => {
    Keyboard.dismiss();
    haptics.pickUp();
    listenersRef.current.onDragActiveChange?.(true);
  }, []);

  const markCrossing = useCallback(() => {
    haptics.select();
  }, []);

  const tapHandle = useCallback((id: string) => {
    listenersRef.current.onTapHandle(id);
  }, []);

  // The order the worklet settled on is already on screen; this only records
  // it and persists it.
  const commitDrop = useCallback((next: string[]) => {
    haptics.drop();
    listenersRef.current.onDragActiveChange?.(false);
    if (sameOrder(next, orderRef.current)) {
      return;
    }
    setOrder(next);
    listenersRef.current.onReorderHighlights(next);
  }, []);

  const motion = useMemo(
    () => ({
      renderIds: renderIdsValue,
      order: orderValue,
      heights,
      heldId,
      heldOffset,
      targetIndex,
    }),
    [renderIdsValue, orderValue, heights, heldId, heldOffset, targetIndex]
  );

  const dragGestures = useMemo(() => {
    const shared = { ...motion, isHeld, grabOffset };
    const handlers = {
      onBegin: beginDrag,
      onCross: markCrossing,
      onDrop: commitDrop,
      onTap: tapHandle,
    };
    return new Map(
      renderIds.map(id => [id, createRowGesture(id, shared, handlers)])
    );
  }, [
    renderIds,
    motion,
    grabOffset,
    isHeld,
    beginDrag,
    commitDrop,
    markCrossing,
    tapHandle,
  ]);

  return { renderIds, motion, dragGestures, onRowLayout };
}

export function HighlightList({
  highlights,
  onChangeText,
  onAddHighlight,
  onFocusHighlight,
  onBlurHighlight,
  onReorderHighlights,
  onDragActiveChange,
}: HighlightListProps) {
  const [draftId, setDraftId] = useState(createId);
  const [draftText, setDraftText] = useState('');
  const [pendingRowId, setPendingRowId] = useState<string | undefined>(
    undefined
  );
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  // `isDraft` only turns false once the promotion has been committed, and a
  // burst of input events is delivered before that. A ref settles which of
  // them did the promoting while they are still arriving.
  const promotedIds = useRef<Set<string>>(new Set());

  const focusRow = useCallback(
    (id: string) => {
      setFocusedRowId(id);
      onFocusHighlight(id);
    },
    [onFocusHighlight]
  );

  const listeners = useMemo(
    () => ({ onReorderHighlights, onDragActiveChange, onTapHandle: focusRow }),
    [onReorderHighlights, onDragActiveChange, focusRow]
  );

  const { renderIds, motion, dragGestures, onRowLayout } = useDragReorder(
    highlights,
    listeners
  );

  const highlightById = useMemo(
    () => new Map(highlights.map(highlight => [highlight.id, highlight])),
    [highlights]
  );

  const rows: HighlightRowModel[] = [
    ...renderIds.flatMap(id => {
      const highlight = highlightById.get(id);
      return highlight ? [{ ...highlight, isDraft: false }] : [];
    }),
    { id: draftId, text: draftText, tag: null, isDraft: true },
  ];

  const handleChangeText = (row: HighlightRowModel, text: string) => {
    if (!row.isDraft || promotedIds.current.has(row.id)) {
      onChangeText(row.id, text);
      return;
    }
    if (isBlank(text)) {
      setDraftText(text);
      return;
    }
    promotedIds.current.add(row.id);
    onAddHighlight(row.id, text);
    setPendingRowId(row.id);
    setDraftId(createId());
    setDraftText('');
  };

  const handleBlur = (row: HighlightRowModel) => {
    setFocusedRowId(current => (current === row.id ? null : current));
    onBlurHighlight(row.id);
    if (!row.isDraft && isBlank(row.text)) {
      onChangeText(row.id, '');
    }
  };

  // Waits out the push-down of the rest of the list before sliding in, so the
  // motions read as one then the other, not at once.
  const enteringFor = (row: HighlightRowModel) =>
    row.id === pendingRowId
      ? SlideInRight.duration(TRANSITION_MS)
          .easing(transitionEasing)
          .delay(TRANSITION_MS)
          .withCallback(finished => {
            'worklet';
            if (finished) {
              runOnJS(setPendingRowId)(undefined);
            }
          })
      : undefined;

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.list}
        entering={FadeIn.duration(TRANSITION_MS)}
      >
        {rows.map(row => (
          <HighlightRow
            key={row.id}
            id={row.id}
            text={row.text}
            tag={row.tag}
            isFocused={row.id === focusedRowId}
            motion={motion}
            dragGesture={dragGestures.get(row.id)}
            entering={enteringFor(row)}
            exiting={FadeOut.duration(TRANSITION_MS)}
            onChangeText={text => handleChangeText(row, text)}
            onFocus={() => focusRow(row.id)}
            onBlur={() => handleBlur(row)}
            onLayout={event => onRowLayout(row.id, event)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  list: {
    gap: 0,
  },
});
