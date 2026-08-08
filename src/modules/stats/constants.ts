// Sedimentary, igneous and metamorphic verbs in one pool. Each entry is a key
// under `creationVerbs` in the translation catalogs.
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
