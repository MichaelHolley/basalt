import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { sql } from 'drizzle-orm';
import path from 'path';
import os from 'os';
import fs from 'fs';
import * as schema from './schema.js';

const DB_PATH = path.join(os.homedir(), '.config', 'basalt', 'basalt.db');
const MIGRATIONS_PATH = path.resolve(process.cwd(), 'migrations');

function createDb() {
	fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

	const sqlite = new Database(DB_PATH);
	sqlite.exec('PRAGMA foreign_keys = ON');
	const db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: MIGRATIONS_PATH });

	// FTS5 virtual table for full-text search — not managed by Drizzle migrations
	db.run(sql`
		CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
		USING fts5(note_id UNINDEXED, title, body)
	`);

	return db;
}

export const db = createDb();
export type Db = typeof db;
