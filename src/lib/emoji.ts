import emojiGroups from 'unicode-emoji-json/data-by-group.json';

export interface EmojiEntry {
  emoji: string;
  name: string;
  slug: string;
}

export interface EmojiCategory {
  name: string;
  slug: string;
  emojis: EmojiEntry[];
}

let cachedCategories: EmojiCategory[] | undefined;

export function getEmojiCategories(): EmojiCategory[] {
  if (!cachedCategories) {
    cachedCategories = emojiGroups.map(group => ({
      name: group.name,
      slug: group.slug,
      emojis: group.emojis.map(({ emoji, name, slug }) => ({
        emoji,
        name,
        slug,
      })),
    }));
  }
  return cachedCategories;
}

export function searchEmojis(
  query: string,
  categories: EmojiCategory[]
): EmojiEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  return categories
    .flatMap(category => category.emojis)
    .filter(entry => entry.name.toLowerCase().includes(normalized));
}
