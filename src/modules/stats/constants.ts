// Sedimentary, igneous and metamorphic verbs in one pool. Also future i18n keys.
export const CREATION_VERBS = [
  'deposited',
  'compacted',
  'settled',
  'layered',
  'cemented',
  'crystallized',
  'forged',
  'cooled',
  'erupted',
  'folded',
  'pressed',
  'hardened',
] as const;

export type CreationVerb = (typeof CREATION_VERBS)[number];
