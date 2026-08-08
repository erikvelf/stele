import type { Translate } from '@/modules/i18n';
import type { StoneFamily } from '@/modules/palette';
import type { StoneId } from '@/modules/types';

export function familyLabel(family: StoneFamily, t: Translate): string {
  return t(`stoneFamilies.${family}`);
}

export function stoneLabel(id: StoneId, t: Translate): string {
  return t(`stones.${id}`);
}
