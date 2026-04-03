# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Basalt** is a local-first, single-user notes and todos app. No auth, no cloud — runs entirely on your machine.

- **Framework**: SvelteKit with Svelte 5 (rune mode)
- **Database**: SQLite via Drizzle ORM (uses `bun:sqlite` natively)
- **Editor**: Milkdown Crepe (WYSIWYG markdown)
- **UI**: shadcn-svelte + Tailwind CSS v4
- **Runtime**: Bun

## Commands

```bash
bun --bun vite dev         # Start dev server
vite build                 # Production build
bun run check              # Type-check (svelte-check)
bun run check:watch        # Type-check in watch mode
bunx drizzle-kit generate  # Generate migrations from schema changes
bunx drizzle-kit migrate   # Apply migrations
```

No test suite is configured.

## Data Storage

- `~/Documents/Basalt/` — `.md` note files on disk
- `~/.config/basalt/basalt.db` — SQLite index with FTS5
- `~/.config/basalt/config.json` — Vault path configuration

On first run, the app redirects to `/setup` to configure the vault path.

## Architecture

### Server/DB Layer (`src/lib/server/`)

- `db/schema.ts` — Drizzle schema definitions
- `db/index.ts` — DB init: runs migrations, enables `PRAGMA foreign_keys`, sets up FTS5
- `db/utils.ts` — Shared DB utilities
- `config.ts` — Reads/writes `~/.config/basalt/config.json`

Migration-Files and related files must be generated. Any modification is prohibitted or must be before migrating.

### Data Flow

- `+layout.server.ts` pre-loads global data available across all routes
- CRUD operations use SvelteKit **form actions** (not REST endpoints), defined in `+page.server.ts` files

### State & Reactivity

Svelte 5 runes (`$state`, `$derived`, `$effect`) are used throughout. Rune mode is enabled globally via `svelte.config.js`.

### UI Components

- shadcn-svelte components live in `src/lib/components/ui/`
- `cn()` utility (clsx + tailwind-merge) is in `src/lib/utils.ts`
- Path alias `@/*` maps to `src/lib/*`
