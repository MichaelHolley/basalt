# Basalt

A local-first, single-user notes app. Notes are stored as plain `.md` files on disk inside a vault directory you choose. A SQLite database acts as a fast index for querying, search, and structured data — it's always a cache and can be deleted and rebuilt at any time.

## Features

- **Spaces** — organize notes and todos into nestable folders
- **Notes** — WYSIWYG markdown editing via Milkdown, autosaved as `.md` files on disk
- **Todos** — nested up to 3 levels deep, with status toggling and due dates
- **Full-text search** — FTS5 index updated on every note save
- **No auth, no cloud** — single user, runs entirely on your machine

## Stack

- [SvelteKit](https://kit.svelte.dev) — framework
- [Drizzle ORM](https://orm.drizzle.team) + `bun:sqlite` — database
- [Milkdown Crepe](https://milkdown.dev) — WYSIWYG markdown editor
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn-svelte](https://www.shadcn-svelte.com) — styling

## Setup

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.0

```bash
bun install
bun dev
```

Open [http://localhost:5173](http://localhost:5173). On first launch you'll be prompted to choose a vault directory (defaults to `~/Documents/Basalt/`).

## Data layout

| Location | Contents |
|---|---|
| `~/Documents/Basalt/` *(or custom)* | `.md` note files mirroring the space folder structure |
| `~/.config/basalt/basalt.db` | SQLite index: spaces, notes metadata, todos, FTS |
| `~/.config/basalt/config.json` | Vault path |

> The SQLite database is a cache — deleting it and restarting the app rebuilds the index from disk.
