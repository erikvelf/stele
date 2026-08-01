# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Commits

Conventional commits, subject line only. No body unless it is genuinely needed, and never a trailer — no `Co-Authored-By`, no `Generated with`.

```
type(scope): lowercase summary, second clause after a comma
```

- **type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`
- **scope**: the area touched — a feature (`notes`, `kb`), a layer (`ui`, `hooks`, `deps`), or a tool (`eslint`, `tauri`). Omit only when the change is genuinely global.
- **summary**: lowercase, imperative, no trailing period. When one commit does several related things, separate them with commas rather than splitting into a body.

```
feat(notes): add NoteSummary type, listNotesDetailed method, tag description
refactor(kb): use Conversation components, memo SubjectPicker, add subject filtering
chore(eslint): allow 1024 magic number, disable no-await-in-loop for Ollama service
fix(hooks): remove redundant loading state from useAsyncOperation
style: format codebase
```

# Comments

Comments explain what the code does, not why a change was made. No rationale, no lint-workaround narration, no rejected-alternative notes — that belongs in the commit message.

# Package manager

pnpm. Use `pnpm exec <bin>` for local binaries and `pnpm dlx <pkg>` for one-off remote tools, never `npx`. `.npmrc` sets `node-linker=hoisted` because Metro and Gradle autolinking cannot follow pnpm's symlinked layout.
