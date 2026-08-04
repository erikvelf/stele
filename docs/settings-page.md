# Stele — Settings page

Planned entries for the Settings screen, grouped the way most local-first journal apps (Day One, Journey, Diarium) organize them. Currently implemented: **Aspetto** (appearance) and **App lock**. Everything below is a backlog, not a spec — flesh out each section into its own schema field when it gets built.

---

## 1. Security & Privacy

- **App lock** — require biometric or device auth to open the app. *(done)*
- **Auto-lock timeout** — lock again after N minutes in background, not just on full close.
- **Hide in app switcher / recents** — blur or replace the live screenshot the OS shows in the multitasking view (Android `FLAG_SECURE`, iOS privacy overlay on backgrounding) so a diary entry isn't visible to someone flipping through recent apps.

## 2. Backup & data

- **Export** — dump the SQLite data (notes, scaglie, tags, tavole) to a file the user can save wherever they want.
- **Import** — read that file back in, restoring the same entities.

No cloud sync planned — this stays local, so export/import doubles as the only backup path.

## 3. Notifications

- **Daily reminder to write** — a toggle plus a time picker for a local notification nudging the user to add a sasso.

## 4. Journal behaviour

There is one journal — tavole are not journals, they're loose lists (wishlist, bucket list) that live alongside it, not todos or note-taking.

- **Entry template** — default prompt/structure inserted into a new sasso. *(building now)*
- **Default number of scaglie slots shown** — PRD suggests five, not enforced.
- **Date format** — how dates render in the log.
- **First day of week** — affects calendar/log views. Not now, backlog.
- **On-this-day / memory surfacing** — resurface past sassi from the same date, with a toggle. Not now, backlog.
- **Weather metadata** — ping a weather API and attach conditions to a new sasso. No metadata capture exists yet, so this waits until that's built.
- Word/character count and markdown formatting are not applicable — entries are plain text, count is a stats concern, not a behaviour toggle.

## 5. About

- **Version number**
- **Licenses / acknowledgments**
- **Feedback / support link**
- **Privacy policy** — only needed if any data ever leaves the device; currently nothing does.
