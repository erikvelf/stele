import { useCallback, useSyncExternalStore } from 'react';

import { createId } from '@/lib/id';
import { deleteTag, listTags, writeTag } from '@/modules/highlights';
import type { Tag } from '@/modules/highlights';
import type { AppError } from '@/modules/types';

interface UseTagsResult {
  tags: Tag[];
  error: AppError | null;
  isLoading: boolean;
  createTag: (input: { name: string; color: string }) => void;
  updateTag: (id: string, input: { name: string; color: string }) => void;
  removeTag: (id: string) => void;
}

// A module-level store, not per-hook state, so that every screen holding a
// useTags() — the tag list, a note's tag picker, and so on — sees the same
// tags and stays in sync the instant one of them writes.
let tags: Tag[] = [];
let error: AppError | null = null;
let isLoading = true;
let hasStartedLoad = false;
const listeners = new Set<() => void>();

interface TagsSnapshot {
  tags: Tag[];
  error: AppError | null;
  isLoading: boolean;
}

// Cached so getSnapshot returns a stable reference between mutations.
let snapshot: TagsSnapshot = { tags, error, isLoading };

function notify() {
  snapshot = { tags, error, isLoading };
  listeners.forEach(listener => listener());
}

function ensureLoaded() {
  if (hasStartedLoad) {
    return;
  }
  hasStartedLoad = true;
  void listTags().then(result => {
    if (result.success) {
      ({ data: tags } = result);
    } else {
      ({ error } = result);
    }
    isLoading = false;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

// Loads every tag once and keeps every consumer's mirror in sync with
// create/update/delete.
export function useTags(): UseTagsResult {
  ensureLoaded();

  const state = useSyncExternalStore(subscribe, getSnapshot);

  const createTag = useCallback((input: { name: string; color: string }) => {
    const tag: Tag = { id: createId(), name: input.name, color: input.color };
    tags = [...tags, tag];
    notify();
    void writeTag(tag).then(result => {
      if (!result.success) {
        ({ error } = result);
        notify();
      }
    });
  }, []);

  const updateTag = useCallback(
    (id: string, input: { name: string; color: string }) => {
      tags = tags.map(tag =>
        tag.id === id ? { ...tag, name: input.name, color: input.color } : tag
      );
      notify();
      void writeTag({ id, name: input.name, color: input.color }).then(
        result => {
          if (!result.success) {
            ({ error } = result);
            notify();
          }
        }
      );
    },
    []
  );

  const removeTag = useCallback((id: string) => {
    tags = tags.filter(tag => tag.id !== id);
    notify();
    void deleteTag(id).then(result => {
      if (!result.success) {
        ({ error } = result);
        notify();
      }
    });
  }, []);

  return {
    tags: state.tags,
    error: state.error,
    isLoading: state.isLoading,
    createTag,
    updateTag,
    removeTag,
  };
}
