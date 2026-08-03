import { getDayOfYear } from 'date-fns';

import { CREATION_VERBS } from './constants';
import type { CreationVerb } from './constants';

// Stable per day, different per salt.
export function pickCreationVerb(date: Date, salt: number): CreationVerb {
  const index = (getDayOfYear(date) + salt) % CREATION_VERBS.length;
  return CREATION_VERBS.at(index) ?? CREATION_VERBS[0];
}
