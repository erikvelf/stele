# Stele 🗿

A personal journal, and the notes you want to keep next to it.

Stele is my own take on keeping a diary. It came out of a habit I already had — writing the day and pulling out the top five small wins and highlights — and it is that habit made queryable. It works fully offline, stores everything in SQLite on the device, and exports the whole archive to a single JSON file.

The product spec is [`docs/PRD.md`](docs/PRD.md).

<!-- TODO: header icon — assets/images/icon.png, scaled to 256px -->

<!-- TODO: hero row, one table row of 4 — the loop: write → see → read → zoom out
     1. write the day + strike the flakes  ...  note/[id]
     2. the activity grid, filled          ...  (tabs)/index
     3. Layers unfiltered next to Layers filtered to one tag  ...  (tabs)/log
     4. Marker resolution, month reflection pinned on top     ...  (tabs)/log

     the rest, in a <details> block or beside their bullet below:
     - tag a flake, tag picker open        ...  note/[id]
     - range a stone, taken days blocked   ...  note/[id]        (better as a gif)
     - write a week or month reflection    ...  reflection editor
     - a tablet open, Markdown rendering   ...  folder/[id]
     - the export sheet                    ...  archive
     - the stone palette / icon picker     ...  color, app-icon

     capture rules:
     - turn OFF screen-capture blocking in privacy-security first, or every shot is black
     - dark theme, one accent for all shots, English locale
     - seed ~3 months of real content; an empty grid makes the app look unused
     - one device: Pixel-class emulator, 1080x2400
     - save ~400px wide PNG in docs/assets/screenshots/ -->


## How it works

1. You write a **journal note** for the day: free-form Markdown, at whatever length you feel like.
2. You pull out of it a handful of **highlights** — small wins, things learned, things that happened. Each one can carry tags you create (`math`, `cs`, `new`).
3. The highlights leave the day and flow into one continuous log you can read end to end, filter by tag, and drill back through into the day they came from.

As weeks and months pass, **reflections** unlock: a short free-text summary of the week, then of the month, then of the year. The same record at lower resolution — the way a progressive JPEG shows the picture before the detail arrives.

## The rock vocabulary

A **stele** is a standing stone with a record cut into it — the thing people used when they wanted writing to outlast them. The whole app is named after that, and everything inside it is named out of the same quarry.

| In the app | Italian | What it is |
| --- | --- | --- |
| **Stone** | Sasso | one journal note — a day, and the highlights struck off it |
| **Flake** | Scaglia | one highlight. A chip knocked off a stone |
| **Layers** | Strati | every flake ever, stacked in order, read top to bottom |
| **Basket** | Gerla | the week — a load of stones carried together |
| **Marker** | Cippo | the month. A *cippo miliario* is the Roman milestone, the carved stone set every mile to tell travellers how far they had come |
| **Mountain** | Montagna | the year — the stones and their markers, piled up |
| **Tablet** | Tavola | a folder of notes, after *le Dodici Tavole* |
| **Shelf** | Scaffale | the page holding your tablets |

The accent colours are stones too — basalt, slate, travertine, lapis lazuli, porphyry, malachite, cinnabar, amber, and eleven more, all read against the grey.

<!-- TODO: the 18 stone icons as one composed 6x3 grid, ~600px wide,
     built from assets/icons/previews/*.png — one image, not 18 tags -->


## What it does

- **Multi-day notes** — sometimes a day continues. A note can cover a range, 6 to 8 August, when that stretch is genuinely one thing. Ranges are exclusive, so two notes never cover the same day.
- **Highlights** — small shards of the day, taggable, so progress on a subject scattered across dozens of non-adjacent days becomes visible.
- **Reflections** — optional summaries at week, month and year level.
- **Stats** — basic for now, and the part most likely to grow.
- **Shelf and folders** — folders of ordinary notes with Markdown: bucket list, things to buy, things to improve. Not todos — the things you meant to do, sitting beside what you actually did.
- **Export and import** — every note, highlight, tag and folder in one JSON file, complete enough to rebuild from nothing and simple enough to edit by hand.
- **Appearance** — Italian and English, theme, accent colour, haptics, alternate app icons.
- **Local authentication** — device biometrics or passcode to open the journal.
- **Reminders** — a local notification when you want a nudge to write.
- **Templates** — prefill new journal notes so you never start from a blank screen.

## Your data

Everything is local. The app stores notes in SQLite on the device and needs no network access — there is no account, no sync, no server, and no HTTP client in the dependency tree. The archive is text and nothing else, which is what makes the JSON export readable on its own, years from now, with or without this app.

## Stack

Expo SDK 57 · React Native · expo-router · react-native-paper · Drizzle ORM over expo-sqlite · zod · MMKV for settings · TypeScript.

## Running it

```bash
pnpm install
pnpm android   # or: pnpm ios
```

`expo-sqlite`, local authentication and dynamic app icons are native modules, so a development build is required — Expo Go will not run this app.

## Repository

- [`docs/PRD.md`](docs/PRD.md) — what the app is, why it exists, and the naming
- [`docs/guides/project-structure.md`](docs/guides/project-structure.md) — how the code is organised
- [`AGENTS.md`](AGENTS.md) — the conventions the code is held to

## Contributing

This is a personal project I built to use myself. I am not looking for contributions, and features land when I find I want them. You are welcome to read it, fork it, or take ideas from it.
