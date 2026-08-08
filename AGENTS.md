# Stele

A personal journal. The product spec is `docs/PRD.md`.

## MANDATORY

For messages and answerse use always **asd-ste100 simplified technical english**
USE **CONTEXT ENGINE MCP** FOR GETTING CONTEXT WITH QUALITY IN REPSECT OF SEARCH PATTERNS

## Project structure

> **MANDATORY:** read `docs/guides/project-structure.md` before adding any component, hook, module, type, constant, or route. It is the constitution for code organization.

Read it when: adding a component · adding a hook · adding a type or schema · adding a constant · adding a module · adding a route · unsure where something goes.

**Quick reference — does not replace reading it:**

| Adding                                | Goes in                          |
| ------------------------------------- | -------------------------------- |
| A screen or navigator                 | `src/app/`                       |
| UI that knows one domain              | `src/components/[domain]/`       |
| Reusable UI, no domain knowledge      | `src/components/shared/`         |
| A primitive Paper lacks               | `src/components/ui/`             |
| A hook used by two or more components | `src/hooks/`                     |
| Business logic for one domain         | `src/modules/[domain]/`          |
| A persisted shape                     | `src/modules/[domain]/schema.ts` |
| A contract every module shares        | `src/modules/types/`             |
| A design token                        | `src/constants/layout.ts`        |
| A utility with no app knowledge       | `src/lib/`                       |

**Three rules that are easy to break by accident:**

- A domain module never imports another domain module. Composition is a hook.
- Only `src/app/` navigates. Components report events through callbacks.
- Cross-module imports go through the barrel, never into a module's files.

## Vocabulary

The PRD is written in the app's user-facing Italian. **The code is not.** `tavola` → `folder`, `scaglia` → `highlight`, `sasso` → a `note` with a date, `strati` → `log`, `diario` → `journal`, `scaffale` → `shelf`. Full table in the structure guide §1.

Italian appears in labels and copy only — never in types, functions, files, columns or routes.

## Expo

Expo has changed. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## TypeScript

**`any` is banned.** ESLint enforces it. Find the real type first — SDKs almost always export it. Use `unknown` when you genuinely cannot know, and narrow before use. A type assertion with `as` requires a comment justifying why it is safe.

**Data that crosses a boundary is a zod schema; its type is `z.infer`.** SQLite, settings storage, an imported export file. Never write the schema and the interface separately. Data that only lives in memory is a plain `interface`. (structure guide §5)

**`Result<T>` at I/O and parse boundaries, values everywhere else.** Pure functions return values and throw on broken invariants. Hooks return `{ data, error, isLoading }` and never propagate a `Result`. A rule the UI must display is data, not an error. (structure guide §7)

## Code quality

Write code you would be proud of, not code that works.

- **Extract, don't nest.** Past three levels, pull the inner logic into a named helper.
- **Early returns** over nested conditionals.
- **Name magic values for their purpose**, and let the expression show the derivation: `const ONE_DAY_MS = 24 * 60 * 60 * 1000`.
- **Keep functions small.** Past ~50 lines it is doing several things.
- **Complexity is a smell.** If ESLint complains, extract.

**Prototyping is fine; sloppiness is not.** Local helpers and local constants are the correct starting point — they graduate to a shared location when a second consumer appears. That governs _where_ code lives, never _how_ it is written. A local helper is typed as strictly as an exported one.

## Style

- **Paper first.** Build from react-native-paper, compose from it second, write a primitive last.
- **Colour comes from the theme.** `useTheme()`. Hex literals live in `src/modules/palette` and nowhere else.
- **Spacing comes from `constants/layout.ts`.** A value not on the scale is a request to change the scale.
- **Styles go in `StyleSheet.create` at the bottom of the file.** Inline styles only for values computed at render.

## Lint

**Never suppress a lint rule — fix the violation.** `eslint-comments/no-use` bans every disable comment, so a suppression is itself an error. There is no escape hatch by design.

Before reporting a task complete, run `pnpm typecheck` and `pnpm lint` and fix everything they report.

## Comments

Comments explain what the code does, not why a change was made. No rationale, no lint-workaround narration, no rejected-alternative notes — that belongs in the commit message.

## Commits

Conventional commits, subject line only. No body unless it is genuinely needed, and never a trailer — no `Co-Authored-By`, no `Generated with`.

```
type(scope): lowercase summary, second clause after a comma
```

- **type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`
- **scope**: the area touched — a feature (`notes`, `log`), a layer (`ui`, `hooks`, `deps`), or a tool (`eslint`, `expo`). Omit only when the change is genuinely global.
- **summary**: lowercase, imperative, no trailing period. When one commit does several related things, separate them with commas rather than splitting into a body.

```
feat(notes): add NoteSummary type, listNotesDetailed method, tag description
refactor(log): use Period type, memo TagPicker, add tag filtering
chore(eslint): allow 1024 magic number, disable no-await-in-loop for import
fix(hooks): remove redundant loading state from useReflection
style: format codebase
```

## Package manager

pnpm. Use `pnpm exec <bin>` for local binaries and `pnpm dlx <pkg>` for one-off remote tools, never `npx`. `.npmrc` sets `node-linker=hoisted` because Metro and Gradle autolinking cannot follow pnpm's symlinked layout.
