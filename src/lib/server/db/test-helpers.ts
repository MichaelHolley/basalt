import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql } from 'drizzle-orm';
import path from 'path';
import * as schema from './schema.js';

const MIGRATIONS_PATH = path.resolve(process.cwd(), 'migrations');

export function createTestDb() {
	const sqlite = new Database(':memory:');
	const db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: MIGRATIONS_PATH });

	db.run(sql`
		CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
		USING fts5(note_id UNINDEXED, title, body)
	`);

	return db;
}
