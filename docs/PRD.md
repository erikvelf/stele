# Stele — PRD

Draft. Sections 1–5 written; features, non-goals, open questions and decisions log still to come.

---

## 1. What this is

Stele is a personal journal built around rocks.

Everything in Stele is a note, and notes live in folders called **tavole**. Bucket list, things to buy, things to improve, productivity plans — each is a tavola holding ordinary notes.

One tavola is special: the **diario**. Its notes carry a date and are displayed differently — an activity grid, a day list, week and month views. A dated note is a **sasso**.

Each day you write a sasso about the day and pull out of it the handful of things that actually mattered. Those pieces accumulate into one continuous record you can read end to end, filter by subject, and zoom out from a day to a week to a month to a year.

The app is for one person: the one writing it.

---

## 2. Why

Three things this is meant to do that nothing currently does well:

**See how you've evolved.** A pile of daily notes is not a record of change, because you never re-read them in order. What makes change visible is the continuous log — the same kind of thing, written across years, read in sequence. The difficulty of what you wrote goes up and you can watch it happen.

**Track real progress on a subject.** "Am I actually getting better at integration?" is not a question a calendar can answer, because the work is scattered across dozens of non-adjacent days. Tags cut across time and make that visible: everything about `math`, in order, however far back it goes.

**Keep permanent intentions next to the record.** Bucket lists, things you want to buy, things you want to change about how you work — these currently live in scattered notes and messages to yourself, where they sink under everything written after them. They belong here rather than in a general notes app because they are the same kind of thinking as a reflection, only at a longer wavelength: what you meant to do, sitting beside what you actually did. A shelf you pass every day, not an archive you never open.

The idea came out of an existing habit: a diary with a "top 5 small wins and highlights of the day" section. Stele is that habit, made queryable.

---

## 3. Naming & tone

**Stele** — the standing stone bearing an inscribed record. The word is identical in Italian and English, needs no translation, and is monumental in exactly the way a decades-long personal record should feel. It also carries the accidental echo of *stellar*, which is a perk rather than a problem.

It was chosen over the two runners-up for a specific reason: it sits at the **container** level. *Lapis* names the writing instrument and *tavola* names the record, so making either the app name would have burned a word the product needs internally. Stele leaves both free:

- **lapis** is the verb — the action of writing a day. The FAB is not "add note", it is *lapis your day*.
- **tavola** is a folder of notes, borrowed from *le Dodici Tavole*. The name is just the rock vocabulary applied to a folder — nothing more is implied by it. Tavole are ordinary, mutable notes you edit whenever you want.

**Tone.** The rock vocabulary is not decoration — it is how the app talks about itself, and it should be consistent enough that the words feel like a real world rather than a theme. It should not be solemn about it. Room for:

- *You reached rock bottom* at the end of a finished list
- 🗿 used liberally, and not always where it makes sense

**Visual direction.** Grey on grey — light grey against dark, the way a carved surface reads. The icon is an inscribed tablet in the spirit of Minecraft armour trim, but unpixelated: a writing surface with marks cut into it, lit from above against a white or black gradient.

---

## 4. Vocabulary

| Word | Meaning |
|---|---|
| **Stele** | the app |
| **Nota** | the one content type. Markdown, optionally a date. Lives in a tavola |
| **Tavola** | a folder of notes, customised with a colour and an emoji |
| **Diario** | the one tavola whose notes must have a date. It backs the main page; otherwise identical to any other tavola |
| **Sasso** | a dated note in the diario — prose and its highlights |
| **Scaglia** | one highlight entry. A flake struck off a stone: the day is the stone, the scaglie are what you chip off it |
| **Strati** | the continuous log — every scaglia ever, in layers, read top to bottom |
| **Tag** | a label you create and put on scaglie (`math`, `cs`, `new`) |
| **Carrello** | the week — a cartload of stones |
| **Cippo** | the month. A *cippo miliario* is the Roman milestone, the carved stone set every mile telling travellers how far they had come |
| **Montagna** | the year |
| **Scaffale** | the shelf — the page holding all your tavole |
| **Macigno** | a boulder — a past sasso resurfaced by the home page |
| **Lapis** | the verb: to write a day. Latin for stone, Italian for pencil |

The vocabulary is user-facing only. Internal names describe the data, not the metaphor.

---

## 5. Principles

Five rules, in priority order, meant to settle future arguments rather than describe features.

**1. Capture must be fast.** Entries get written on a train, standing up, in under a minute. Every additional field the app expects you to fill is another way to fall behind, and falling behind is how journals get abandoned. When a feature and this rule conflict, the feature loses.

**2. Nothing may nag.** No streaks, no reminders that you missed yesterday, no empty states that imply failure. A month with four entries is a valid month. The app records what happened; it does not have opinions about it.

**3. The archive outlives the app.** The value of this data increases every year — year twelve is worth far more than year one — which means a phone dying, the framework breaking, or you losing interest in maintaining the code must never cost you the archive. Everything must be exportable into a form that rebuilds completely, and that export is a first-class feature rather than a button nobody has pressed. Because the archive is text and nothing else, it is also readable without Stele: a single file you can open in any editor decades from now and still have your years.

**4. Rendering is a UI concern, storage is text.** Notes are stored as plain source. Markdown is what renders them today; Typst becomes possible once its HTML output ships. Swapping the renderer must never require touching the data.

Stele holds text and nothing else — no photos, no audio, no attachments. Text is simple, and text is enough for what the app is for: reflection is written, not photographed.

**5. One note, many presentations.** There is a single content type. A note holds Markdown and optionally a date. A tavola is a folder of notes.

The **diario** is the one tavola whose notes are *required* to have a date, and it is what the main page renders. That is the only thing that makes it special. Notes in any other tavola may carry a date too — it simply isn't demanded of them. No tavola has a capability another lacks; everything is built against the note, so the editor, Markdown, search and export work identically everywhere. Since the main page already surfaces the diario, it can be hidden from the scaffale rather than listed twice.

This does not make tavole part of the daily flow. They are not saved searches, tag threads, or anything derived from your sassi — just folders with notes in them. Making them derived was considered and rejected: it made both concepts vaguer.

---

## 6. Screens

### 6.1 Home

The home page answers one question on open: *what have I been doing lately?* It is a vertical scroll of four blocks, with the writing action always reachable.

**Activity grid.** The main block at the top: a GitHub-contributions-style grid of one month, one cell per day, shaded by how much you wrote. Tapping a cell opens that day's note. Swiping moves to the previous or next month; future months cannot be reached. Its job is to make the shape of a month legible at a glance — the dense stretches, the gaps — without reading a word.

**Macigno roulette.** Directly beneath the grid, a small block surfacing one past sasso at random — a boulder pulled up from the pile. This is the mechanism that makes old entries worth having written.

**Tavole carousel.** Below the roulette, a horizontal strip of rectangles, one per tavola. Each is filled with that tavola's chosen colour and shows its emoji and name — nothing else. The strip advances on its own every few seconds so that the things you wrote down drift past you instead of sitting in a folder you never open, and you can swipe to move through them yourself. Tapping one opens the tavola.

**The day list.** Below everything, an infinite list of your diario notes in reverse chronological order, **separated by week**. Each entry is a card: a title and the first ~200 characters as a preview.

**FAB.** Always present, floating over the scroll: *lapis*. Opens a new note for today, or today's existing one if you already started it.

### 6.2 Sasso

Two parts, written in one screen.

**The body.** Free-form Markdown. This is where you talk about the day at whatever length you feel like — a line, or ten paragraphs. No title field required; if you don't write one, the first line serves as the title in lists.

The editor is a text input and nothing more: you type source, it renders Markdown. No toolbar, no insert menu, no formatting buttons. Every control it doesn't have is a control that can't stand between you and writing the day.

**The scaglie.** The top things of the day — small wins, highlights, things learned. A short list of one-line entries, each of which can carry tags you create (`math`, `cs`, `new`). These are the pieces that leave the day and flow into Strati; the body stays where it is.

**Multi-day sassi.** Days are slots, and every note in the diario occupies a contiguous run of them. A normal sasso occupies one; a note covering a trip, an illness, or any stretch that is genuinely one continuous thing occupies several.

Slots are exclusive: **a range can only be drawn over days that are free.** Two notes never cover the same day, so every cell in the activity grid maps to exactly one note and there is no conflict to resolve — the collision simply can't be created. This means the range picker has to show which days are already taken and stop a selection at the first occupied one, otherwise the rule is invisible until it rejects you.

Five is not a limit — you can write more. It is the number that tends to represent a day well, so the UI suggests it without enforcing it.

Tags go on scaglie only. Notes are not tagged.

### 6.3 Strati

The continuous record. Every scaglia ever written, in layers, newest or oldest first as you choose, infinite scroll.

This is the screen the whole app is built to produce. Its purpose is re-reading: watching what you cared about change, and seeing progress on a subject that is invisible day to day because it is scattered across dozens of non-adjacent days.

- **Grouping** by day and by week, with headers marking each layer.
- **Sorting** — you choose the direction and the grouping.
- **Tag filter** — narrow to `math` and the screen becomes the history of one subject, in order. This is the answer to "am I actually making progress on integration?"
- **Drill through** — tapping a scaglia opens the sasso it was struck from, so the log is an index into the days rather than a replacement for them.

### 6.4 Carrello and Cippo

The week and the month are the same record at lower resolution — a blurrier render of the data you already have, the way a progressive JPEG shows you the picture before the detail arrives. They are zoom levels of Strati, not separate documents.

At each level you see the scaglie of that period, grouped, plus everything Strati offers: filtering, sorting, drilling through to the day.

**Optional reflection.** Each week and each month can hold a short free-text reflection, pinned at the top of that window. It is never requested, never prompted, and blank by default. A month view shows the reflections of the weeks it contains alongside the accumulated scaglie.

**Beneath the marked pieces, the raw days remain browsable.** Some months you want to read the whole log rather than the highlights, so scanning day by day through the full entries is always available.

### 6.5 Montagna

The year brings everything together: the whole log, day by day, and the monthly logs above it. Nothing is summarised away — a year is the complete record of what you marked, read at the largest scale the app offers.

It also carries the reflections written at month level, and can hold one of its own.

There is no activity grid at year scale. A month of cells reads as the shape of a month; twelve of them read as a list of everything you didn't write, which is the one thing principle 2 forbids.

Because a year holds far more than fits on a screen, months are the structure that makes it navigable — collapsed by default and opened to reveal the days inside.

### 6.6 Tavole and the scaffale

A tavola is a folder of notes, customised with a colour and an emoji: bucket list, things to buy, things to improve, productivity plan. The notes inside are ordinary notes — the same editor, the same Markdown as a sasso — and you edit them whenever you want.

The **scaffale** is the page listing your tavole and their contents. The home carousel is the other way in.

The diario is a tavola like any other; it is simply the one the main page renders, and it can be hidden from the scaffale so it isn't listed in two places.

A note belongs to exactly one tavola — the one it was created in — and can be moved to another. It is never in two places at once.

### 6.7 Settings

- **Theme** — dark, light, or follow the system
- **Primary colour** — a choice of accents against the grey
- **App icon** — alternate icons to switch between

### 6.8 Search

Every tavola is searchable, and the home page searches the diario.

Search covers the words in your notes. Alongside it, scaglie can be filtered by tag — the same filtering that drives Strati, available wherever you're looking.

### 6.9 Export

Stele exports all of your data: every note, scaglia, tag and tavola, in one JSON file, complete enough to rebuild the app's contents from nothing. Since there is nothing but text to export, the file is self-contained and readable on its own.

---

## Notes on this document

Non-goals and a decisions log were considered and dropped: the principles in section 5 and the rationale carried inline through sections 3, 5 and 6.4 already do that work.
