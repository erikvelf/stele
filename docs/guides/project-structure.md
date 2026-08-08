# Project Structure

> **This is the project's constitution for code organization.** Read it before adding any component, hook, module, type, constant, or route.

---

## 1. Vocabulary

The PRD is written in the app's user-facing vocabulary. The code is not. PRD §4: _"The vocabulary is user-facing only. Internal names describe the data, not the metaphor."_

The PRD is the spec, so every implementer reads it first and it hands them `scaglia`, `tavola`, `sasso` on every page. Translate at the door, using this table.

| PRD / UI                    | Code                      | Definition                                                       |
| --------------------------- | ------------------------- | ---------------------------------------------------------------- |
| stele                       | —                         | The app. No code equivalent.                                     |
| nota                        | `note`                    | The one content type: source text, photos, an optional date.     |
| sasso                       | `note`                    | A `note` that has a date. Not a separate type.                   |
| tavola                      | `folder`                  | A named, coloured container of notes. A note belongs to exactly one. |
| diario                      | `journal`                 | The one `folder` whose notes require a date.                     |
| scaffale                    | `shelf`                   | The collection of all folders. Has no table, no id, no ordering. |
| scaglia                     | `highlight`               | A one-line entry struck off a note, carrying tags.               |
| strati                      | `log`                     | Every highlight in sequence.                                     |
| tag                         | `tag`                     | A label on a highlight. Notes are not tagged.                    |
| carrello / cippo / montagna | `week` / `month` / `year` | Values of `Period`, alongside `day`.                             |
| macigno                     | `resurfacedNote`          | A past note surfaced at random.                                  |
| lapis (verb)                | `composeToday`            | Open today's note, creating it if absent.                        |

Italian appears in screen titles, labels, empty-state copy, and one label map per domain in the UI layer. It appears nowhere else: not in table names, columns, types, functions, files, folders, or route paths.

Renaming a user-facing word is therefore a change to a label map, and nothing on disk moves.

---

## 2. Folder map

```
src/
├── app/              expo-router routes and layouts. Screens.
├── components/
│   ├── ui/           primitives react-native-paper does not provide
│   ├── shared/       cross-domain UI with no domain knowledge
│   └── [domain]/     UI that knows one domain
├── hooks/            the React bridge: modules → render state
├── modules/          business logic. No React.
│   ├── [domain]/     one domain each, barrel-exported
│   └── types/        universal contracts
├── constants/        design tokens and error codes
└── lib/              utilities with zero domain knowledge
```

| Folder                  | Owns                                           | Knows the domain | Contains React |
| ----------------------- | ---------------------------------------------- | ---------------- | -------------- |
| `app/`                  | Routes, navigators, screen composition         | Orchestrates     | Yes            |
| `components/ui/`        | Primitives Paper lacks                         | No               | Yes            |
| `components/shared/`    | Reusable UI across domains                     | No               | Yes            |
| `components/[domain]/`  | UI for one domain                              | One domain       | Yes            |
| `hooks/`                | Reactive state, service orchestration          | Yes              | Yes            |
| `modules/[domain]/`     | Business logic and persistence for one domain  | Yes              | **No**         |
| `modules/types/`        | `Result<T>` and contracts every module shares  | Contracts only   | No             |
| `constants/`            | Design tokens, error codes                     | No               | No             |
| `lib/`                  | Pure utilities                                 | **No**           | No             |

**`lib/` versus `modules/`.** If the file could be copied into an unrelated project and still work, it belongs in `lib/`. Otherwise it belongs in `modules/`. `lib/` imports nothing from `src/`.

**react-native-paper is the primitive layer.** It is a dependency, not a folder. Build from Paper components first, compose from them second, write a custom primitive last. `components/ui/` holds only what Paper does not provide.

**Layouts are routes.** `_layout.tsx` files live in `app/` and contain navigator configuration only. There is no `components/layout/`.

### Domains

| Module               | Owns                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `modules/db`         | SQLite connection and migrations. Infrastructure, not a domain.                          |
| `modules/notes`      | Notes, their source text and dates, and the day-slot ranges of the journal.              |
| `modules/highlights` | Highlights and their tags.                                                               |
| `modules/folders`    | Folders, their colour and emoji, and the journal's date requirement.                     |
| `modules/log`        | Grouping, sorting and filtering highlights by period and tag. Pure: given data, returns data. |
| `modules/media`      | Photo import, compression, and app-owned copies.                                         |
| `modules/archive`    | JSON export and import.                                                                  |
| `modules/settings`   | The settings registry and persisted preferences.                                         |
| `modules/palette`    | Accent seeds and MD3 theme construction.                                                 |

A module is created when a domain acquires logic of its own, not in advance.

---

## 3. The dependency graph

Dependencies run one way, from the outside in. A file may import from any layer below it and none above it.

```
app/                     screens, routes, navigators
  ↓
components/              ui/ · shared/ · [domain]/
  ↓
hooks/                   reactive state, orchestration
  ↓
modules/[domain]/        business logic
  ↓
modules/db/ · modules/types/
  ↓
lib/ · constants/        no app knowledge
```

| Layer                                     | May import                                                        | Is imported by                                       |
| ----------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `lib/`, `constants/`                      | external packages only                                            | everything                                           |
| `modules/types/`                          | `lib/`, `constants/`                                              | every module, hooks, components, app                 |
| `modules/db/`                             | `lib/`, `constants/`, `modules/types/`                            | modules, hooks                                       |
| `modules/[domain]/`                       | `lib/`, `constants/`, `modules/types/`, `modules/db/`             | `hooks/`, `app/`, its own `components/[domain]/`     |
| `hooks/`                                  | everything below                                                  | `components/`, `app/`                                |
| `components/ui/`, `components/shared/`    | `lib/`, `constants/`, `hooks/`                                    | `components/[domain]/`, `app/`                       |
| `components/[domain]/`                    | the above, plus its own domain's **types**                        | `app/`, the same domain                              |
| `app/`                                    | everything                                                        | nothing                                              |

### Four rules

**1. A domain module never imports another domain module.** Only `modules/db` and `modules/types` are shared. Work that needs two domains is orchestration, and orchestration lives in a hook.

The single exception is a foreign key. A `schema.ts` may import another domain's `schema.ts`, and nothing else of it, because a Drizzle `.references()` takes the referenced table object and `PRAGMA foreign_keys = ON` makes the constraint real. A `schema.ts` holds shape and no logic, so the import moves no behaviour across the boundary and closes no cycle.

**2. A component imports its domain's types, never its functions.** Components receive data through props and hooks. A component that calls a module directly has taken on fetching, error handling and lifecycle that belong a layer up.

**3. Composition across domains happens in `app/`.** A screen may use several domains. A component may not: `components/shared/` has no domain knowledge, and `components/[domain]/` has exactly one.

**4. Cross-boundary imports go through the barrel.** `import { … } from '@/modules/notes'`, never `'@/modules/notes/note-service'`. Files inside a module import each other by relative path. The barrel is the module's public API; everything else is an implementation detail and may be restructured freely.

### Enforcement

`import/no-cycle` makes any violation that closes a loop a build error. Direction is enforced by `import/no-restricted-paths` zones, so a component importing a module function, or one domain reaching into another, fails lint rather than review.

---

## 4. Where does this code go?

```
START — what are you writing?

Does it render?
├── YES → Is it a route or navigator configuration?
│   ├── YES → app/                        (_layout.tsx for navigators)
│   └── NO  → Does it know a domain?
│       ├── YES → components/[domain]/
│       └── NO  → Does react-native-paper provide it?
│           ├── YES → use Paper. Write nothing.
│           └── NO  → Is it a single visual element, composing nothing?
│               ├── YES → components/ui/
│               └── NO  → components/shared/
│
└── NO → Does it call a React hook?
    ├── YES → Is it used by more than one component?
    │   ├── YES → hooks/
    │   └── NO  → keep it in the component file
    │
    └── NO → Does it know about Stele's domain?
        ├── YES → Is it a value rather than logic?
        │   ├── YES → modules/[domain]/constants.ts        (§6)
        │   └── NO  → modules/[domain]/
        └── NO  → Is it a value rather than logic?
            ├── YES → constants/                           (§6)
            └── NO  → lib/
```

Rendering decides the layer. The domain only decides the folder within it.

### Lookup

| Writing                                  | Goes in                          |
| ---------------------------------------- | -------------------------------- |
| A screen at a route                      | `app/`                           |
| A navigator configuration                | `app/_layout.tsx`                |
| UI that knows one domain                 | `components/[domain]/`           |
| Reusable UI with no domain knowledge     | `components/shared/`             |
| A primitive Paper does not provide       | `components/ui/`                 |
| A hook used by two or more components    | `hooks/`                         |
| A hook used by one component             | that component's file            |
| Business logic for one domain            | `modules/[domain]/`              |
| A persisted shape                        | `modules/[domain]/schema.ts`     |
| An in-memory domain type                 | `modules/[domain]/types.ts`      |
| A contract every module shares           | `modules/types/`                 |
| A business rule expressed as a value     | `modules/[domain]/constants.ts`  |
| A design token                           | `constants/layout.ts`            |
| An error code                            | `constants/error-codes.ts`       |
| A utility with no app knowledge          | `lib/`                           |

### Start local

A helper, constant or type used in one place stays in the file that uses it. It moves to a shared location when a second consumer appears, and not before.

This governs **where** code lives, never **how** it is written. A local helper is typed as strictly as an exported one.

---

## 5. Types

### The axis: does it cross a boundary?

**Data that crosses a boundary is defined as a zod schema, and its TypeScript type is derived with `z.infer`.** A boundary is SQLite, settings storage, an imported export file — anywhere bytes outlive the process. Never write the schema and the interface separately; they drift, and the drift is silent.

**Data that stays in memory is a plain `interface`.** Props, view models, function arguments. A schema there is cost with no benefit.

The test: _could this value have been produced by an older version of the app, or by a file on disk?_ If yes, it is a schema.

### Placement

```
modules/types/                    contracts every module shares
         ▲
modules/[domain]/schema.ts        persisted entities
modules/[domain]/types.ts         in-memory domain types
         ▲
components/[domain]/types.ts      shared by two or more components in one domain
         ▲
inline in the component file      props — the default
```

```
Where does this type go?

Is it a component's props?
├── YES → Used by another component?
│   ├── YES → components/[domain]/types.ts
│   └── NO  → inline in the component file
│
└── NO → Is it a domain entity?
    ├── YES → Persisted?
    │   ├── YES → modules/[domain]/schema.ts
    │   └── NO  → modules/[domain]/types.ts
    └── NO  → Used by every module?
        ├── YES → modules/types/
        └── NO  → inline where it is used
```

| Type                                  | Used by                    | Location                     |
| ------------------------------------- | -------------------------- | ---------------------------- |
| `Note`, `Highlight`, `Folder`         | modules, hooks, components | `modules/[domain]/schema.ts` |
| `Period`                              | `log` and its components   | `modules/log/types.ts`       |
| `Result<T>`                           | everywhere                 | `modules/types/`             |
| `ActivityGridProps`                   | only `ActivityGrid`        | inline                       |
| A layout cell computed for rendering  | only its component         | inline                       |

### Props are inline

A component and its props interface are exported from the same file, so one import brings both and one file is the whole story.

```ts
export interface ActivityGridProps { … }
export function ActivityGrid({ … }: ActivityGridProps) { … }
```

### Branded types

Brand a type when validity is a property of a **whole collection** rather than of any single value — an invariant no structural type can express. A branded type can only be obtained by parsing, so no function can be handed an invalid one.

The exclusivity rule of PRD §6.2 — two notes never cover the same day — is a property of the set of ranges, not of any range:

```ts
export const dateDayRangesSchema = z
  .array(dateDayRangeSchema)
  .superRefine(/* no two ranges share a day */)
  .brand<'DateDayRanges'>();

export type DateDayRanges = z.infer<typeof dateDayRangesSchema>;
```

Do not brand what a schema can already express. A non-empty string is `z.string().min(1)`.

### Derive, never restate

The schema is the artifact. Everything else is produced from it.

| Wanted                                    | Derived by                        |
| ----------------------------------------- | --------------------------------- |
| The TypeScript type                       | `z.infer<typeof schema>`          |
| Default values                            | `schema.parse({})`                |
| A union of ids                            | `z.enum(IDS)`, `IDS` from the data |
| A union from a non-persisted constant     | `(typeof OBJ)[keyof typeof OBJ]`  |
| A narrower signature                      | `Pick`, `Omit`, `Partial`         |

`Omit<Tag, 'id'>` states that an id cannot be changed, and needs no runtime check to enforce it.

---

## 6. Constants

### Four kinds, four homes

| Kind                  | Example                                               | Home                              |
| --------------------- | ----------------------------------------------------- | --------------------------------- |
| **Design token**      | `SPACING`, `RADIUS`, `ICON_SIZE`, `FAB_CLEARANCE`     | `constants/layout.ts`             |
| **Domain rule**       | `SUGGESTED_HIGHLIGHTS_PER_DAY`, `MAX_PHOTOS_PER_NOTE` | `modules/[domain]/constants.ts`   |
| **Error code**        | `NOTES_ERRORS.RANGE_OCCUPIED`                         | `constants/error-codes.ts`        |
| **Local tuning value**| a coefficient used once inside one function           | module scope in that file, not exported |

### Promotion

A local value moves to `modules/[domain]/constants.ts` when a second consumer appears, and to `constants/` when consumers exist outside the domain. Never earlier.

**Design tokens are exempt.** A token is shared by definition: its purpose is that the next screen uses the same value. A spacing value written directly into a screen is a defect even the first time.

### Naming

Name a constant for its **purpose**, and let the expression show its **derivation**.

```ts
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // purpose named, derivation visible
```

Do not decompose a derivation into a chain of named parts, and do not name a constant after its value.

A name carries the rule it encodes. PRD §6.2 says five highlights is a suggestion and not a limit, so the constant is `SUGGESTED_HIGHLIGHTS_PER_DAY` — and nothing enforces it, because nothing named _suggested_ should.

### Error codes

Codes are one `as const` object per domain, with the union derived from the object so runtime values and compile-time types cannot drift:

```ts
export const NOTES_ERRORS = {
  NOT_FOUND: 'NOT_FOUND',
  RANGE_OCCUPIED: 'RANGE_OCCUPIED',
} as const;

export type NotesErrorCode = (typeof NOTES_ERRORS)[keyof typeof NOTES_ERRORS];
```

Every failure carries a code. Until a failure needs a message of its own, it carries `COMMON_ERRORS.UNDEFINED`:

```ts
export const COMMON_ERRORS = {
  UNDEFINED: 'UNDEFINED_ERROR',
} as const;

export type CommonErrorCode =
  (typeof COMMON_ERRORS)[keyof typeof COMMON_ERRORS];
```

`COMMON_ERRORS.UNDEFINED` is the default, not a catch-all for the unexpected. A `Result` never carries an absent or invented code, and the UI shows one generic message for all of them.

A domain code is introduced only when the UI must say something specific about that failure. Replacing `COMMON_ERRORS.UNDEFINED` with one is a local change: the call site already returns an error, and only the message changes.

### Colour is not a constant

Colour comes from the Paper theme through `useTheme()`. Hex literals appear in `modules/palette` and nowhere else — not in `constants/`, not in a `StyleSheet`, not inline.

### The layout scale

`constants/layout.ts` is the single source of spacing, radii and sizes. Every such value in the app is one of these:

```ts
export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 20, full: 999 } as const;
export const FAB_CLEARANCE = 96;
```

A value that is not on the scale is a request to change the scale.

---

## 7. Errors

### The shape

```ts
// modules/types/result.ts
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export interface AppError {
  code: string;
  cause?: string;
}

export function ok<T>(data: T): Result<T>;
export function err(code: string, cause?: string): Result<never>;
```

`ok` and `err` are constructors — the only way a `Result` is built, so no call site writes the object literal by hand. `code` is `string` so that every domain's derived union is assignable to it. `cause` is for the log, never for the user.

### Reading a `Result`

`Result<T>` is a discriminated union on `success`. Branch on it directly; TypeScript narrows, and no cast is needed.

```ts
const result = await readNote(id);
if (!result.success) {
  showMessage(result.error);
  return;
}
result.data.title; // narrowed to Note
```

There is no unwrap helper and no predicate for this. The single exception is filtering, where TypeScript cannot narrow element types through `Array.filter` unless the callback is a type predicate:

```ts
export function isOk<T>(
  result: Result<T>
): result is Extract<Result<T>, { success: true }> {
  return result.success;
}

const notes = results.filter(isOk).map(result => result.data);
```

`isOk` is for filtering collections. Branching on a single `Result` uses `result.success`.

### Where `Result` is returned

| Code                                       | Returns                        |
| ------------------------------------------ | ------------------------------ |
| Touches SQLite, the filesystem, or images  | `Result<T>`                    |
| Parses persisted or imported bytes         | `Result<T>`                    |
| Pure function that cannot fail             | the value                      |
| A domain rule the UI must display          | plain data                     |
| A hook                                     | `{ data, error, isLoading }`   |
| A screen or component                      | nothing; it renders            |

**The test:** _can this fail for a reason that is not a bug, and does the caller have a sensible response other than crashing?_ Both yes, and it returns `Result<T>`. Otherwise it returns the value.

### What never returns `Result`

**Pure functions.** A function of its inputs cannot fail. Wrapping it forces every caller to write a branch that can never be taken, and the only legal way to leave that branch is to throw — which is what the function should have done in the first place.

**Invariant violations.** When a parse rejects data the app itself just built, that is a broken invariant, not a runtime condition. It throws, and it crashes loudly. `Result` would invite a caller to continue with corrupt state.

**Hooks.** A hook already owns a failure channel. Returning `Result` from one makes components unwrap a result inside a component that also has loading state. Translating `Result` into render state is precisely a hook's job.

**Wrappers around `safeParse`.** `safeParse` is already a result. Adapt it once, at the edge of the module, and expose one shape.

### Domain rules are data, not errors

A rule the interface must **show** is a return value. A failure the user can only be **told** is an error.

The exclusivity rule is data: the range picker has to display which days are taken and stop a drag at the first occupied one. So `findFreeRunFrom(day)` returns the available span. It does not fail because a day is occupied.

### Import failure is graceful, always

PRD §5 principle 3 requires the archive to outlive the app. An export file written by any version parses with `safeParse` and returns `Result` — never a throw, never a cast. An unknown field degrades; it does not crash.

---

## 8. Module anatomy

```
modules/[domain]/
├── schema.ts      persisted shapes (zod) and their inferred types
├── types.ts       in-memory domain types
├── constants.ts   business rules expressed as values
├── queries.ts     the operations
└── index.ts       the barrel — the module's entire public API
```

Only `index.ts` is mandatory. Add files as a module needs them; split `queries.ts` when it grows.

### The barrel

Everything outside the module imports from `@/modules/[domain]`. Files inside import each other by relative path.

**If it is not exported from `index.ts`, it does not exist outside the module.** That is what allows internals to be restructured without touching a consumer.

### Functions, not classes

A module exports functions. An object is introduced only when something must persist across calls — a database handle, a cache.

An interface is introduced only when a second implementation exists. A contract with one implementor is indirection with no beneficiary.

### Operations are atomic

A module function answers one question: read this, write that, list those, delete this. It never answers _"read this, then check that, then update the other, then refresh the screen."_

**If a function would call one module and then another, it is a hook.**

```
BAD   modules/notes → saveNoteAndReindexSearch()
GOOD  hooks/useSaveNote → calls notes, then search
```

Composition is a hook's job precisely because a module may not import another module.

### Entity or workflow artifact

A module owns its **entity**. Anything that exists only because a screen works a certain way belongs to a hook.

**The test:** would this data still mean something if the screen that produces it were removed? If not, it is a workflow artifact.

A note's text, date and photos are the entity. An unsaved editor buffer, an autosave timer and a draft range being dragged are workflow artifacts: `modules/notes` never learns they exist.

### Read lazily

Listing returns identity, not contents. `listNotes()` returns ids and titles; body text and photos are read when a screen opens one. There is no `listNotesWithEverything()`.

This is what keeps the day list and the activity grid cheap as the archive grows, which by PRD §2 is the point of the archive.

---

## 9. The three layers in action

```
Screens — app/
  ├── render hooks
  ├── call module functions directly for one-off actions
  ├── wire hooks to one another
  └── own all navigation

Hooks — hooks/
  ├── own reactive state: data, error, isLoading
  ├── orchestrate several modules
  └── manage lifecycle: autosave, create-on-first-write, refresh

Modules — modules/
  ├── own one domain
  ├── expose atomic operations
  └── know nothing of screens, workflows or navigation
```

### One-off actions bypass hooks

Delete, rename, move, export. They fire once, handle a result, and refresh. The screen calls the module directly, then calls the hook's refresh. Wrapping them in a hook adds indirection and no reactive state.

A hook is for what re-renders. An action is for what happens once.

### When a hook exists

| Situation                            | Hook                          |
| ------------------------------------ | ----------------------------- |
| Wrapping a module in reactive state  | yes — `hooks/`                |
| Coordinating two or more modules     | yes — `hooks/`                |
| Used by one component only           | no — keep it in that file     |
| Pure logic with no React             | no — `modules/`               |

### Navigation belongs to screens

Only files in `app/` navigate. A component reports what happened through a callback prop — `onSelectDay`, `onOpenFolder` — and the screen decides where it leads.

A component that calls the router has hard-coded one destination and can no longer be used on a second screen. The activity grid appears on the home screen and in the year view; it must not know that a day opens a note.

### Screens stay thin

A screen composes: hooks for state, components for rendering, module calls for actions. Anything in a screen that is neither state, rendering nor an action has escaped its layer.

---

## 10. Worked example: adding a domain

PRD §6.4 — each week and each month may hold a short reflection, pinned above that period's highlights.

### 1. Name it

The PRD gives it no metaphor word, and `reflection` already describes the data. It is stored per period, and `Period` is needed by both `log` and `reflections`.

**A type needed by two domains is not owned by either.** `Period` moves to `modules/types/`. This is the pyramid in §5 and the rule in §3 that a domain module never imports another domain module — together they say the shared type rises rather than one domain reaching sideways.

### 2. Schema first

A reflection is persisted, so it is a schema and its type is derived.

```ts
// modules/reflections/schema.ts
export const reflectionSchema = z.object({
  id: z.string().min(1),
  period: periodSchema,
  start_timestamp: z.number().int(),
  body: z.string(),
});

export type Reflection = z.infer<typeof reflectionSchema>;
```

### 3. Atomic operations

```ts
// modules/reflections/queries.ts
export async function readReflection(
  period: Period,
  start: number
): Promise<Result<Reflection | null>>;

export async function writeReflection(
  reflection: Reflection
): Promise<Result<void>>;
```

`Result` because these touch SQLite. `null` rather than an error for an absent reflection: the PRD says a reflection is blank by default and never requested, so _not written yet_ is the ordinary case, and the ordinary case is data.

### 4. The barrel

```ts
// modules/reflections/index.ts
export { readReflection, writeReflection } from './queries';
export { reflectionSchema } from './schema';
export type { Reflection } from './schema';
```

### 5. The hook

```ts
// hooks/useReflection.ts
export function useReflection(
  period: Period,
  start: number
): {
  reflection: Reflection | null;
  error: AppError | null;
  isLoading: boolean;
  save: (body: string) => void;
};
```

The hook translates `Result` into render state, and owns the debounce that decides when typing becomes a write. The debounce is a workflow artifact: `modules/reflections` never learns it exists.

### 6. The component

```
components/reflections/ReflectionCard.tsx
```

Props inline. It receives a body and an `onChange`, and calls no module and no router.

### 7. The screen

The month screen renders `useReflection`, passes its value to `ReflectionCard`, and owns any navigation the card reports.

### Resulting shape

```
modules/types/period.ts          Period, shared by log and reflections
modules/reflections/schema.ts
modules/reflections/queries.ts
modules/reflections/index.ts
hooks/useReflection.ts
components/reflections/ReflectionCard.tsx
app/(tabs)/…                     composes them
```

| Step                        | Rule                                                    |
| --------------------------- | ------------------------------------------------------- |
| `Period` moved up           | §3 domains never import domains; §5 cross-domain types rise |
| Schema before type          | §5 persisted data is schema-first                       |
| `null`, not an error        | §7 the ordinary case is data                            |
| `Result` on both queries    | §7 SQLite is a boundary                                 |
| Debounce in the hook        | §8 workflow artifacts are not entities                  |
| Card has no router          | §9 navigation belongs to screens                        |

---

## 11. Naming

### Files

| Kind                  | Convention        | Example                                       |
| --------------------- | ----------------- | --------------------------------------------- |
| Route or layout       | lowercase kebab   | `folders.tsx`, `note/[id].tsx`, `_layout.tsx` |
| Component             | PascalCase        | `ActivityGrid.tsx`                            |
| Hook                  | `useCamelCase`    | `useReflection.ts`                            |
| Module file           | kebab-case        | `queries.ts`, `build-theme.ts`                |
| Schema and type files | kebab-case        | `schema.ts`, `types.ts`                       |
| Constants file        | kebab-case        | `layout.ts`, `error-codes.ts`                 |
| Folder                | kebab-case        | `components/reflections/`                     |

**Files under `app/` are exempt from PascalCase.** expo-router derives the route from the filename, so a route file's name is a URL and is lowercase for that reason. This is the only exception, and it is not a style choice.

### Exports

| Kind             | Convention                  | Example              |
| ---------------- | --------------------------- | -------------------- |
| Component        | PascalCase                  | `ActivityGrid`       |
| Props interface  | component name + `Props`    | `ActivityGridProps`  |
| Hook             | `useCamelCase`              | `useReflection`      |
| Schema           | camelCase + `Schema`        | `reflectionSchema`   |
| Inferred type    | PascalCase, singular        | `Reflection`         |
| Constant         | SCREAMING_SNAKE             | `FAB_CLEARANCE`      |
| Constant group   | SCREAMING_SNAKE, `as const` | `NOTES_ERRORS`       |
| Function         | camelCase, verb first       | `readReflection`     |

### Rules

**A schema and its type share a stem.** `reflectionSchema` produces `Reflection`. Reading one name tells you the other exists.

**No `I` prefix on interfaces.** If a contract and an implementation both exist, the implementation carries the qualifier: `SqliteNoteStore` implements `NoteStore`.

**Booleans read as assertions.** `isLoading`, `hasPhotos`, `requiresDate`. A boolean that needs a comment to say which way round it runs is misnamed.

**Module functions begin with the operation.** `read`, `write`, `list`, `delete`, `find`, `count`. The verb states the cost: `list` is cheap and returns identity, `read` fetches contents.

**Callbacks name the event, not the reaction.** `onSelectDay`, not `onOpenNote`. A component reports what the user did; deciding what it causes belongs to the screen, and a prop named for the consequence has already made that decision.
