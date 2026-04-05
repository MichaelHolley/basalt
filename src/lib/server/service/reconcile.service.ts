import fs from 'fs';
import path from 'path';
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { notes, spaces } from '$lib/server/db/schema';
import { getConfig } from '$lib/server/config';

export async function reconcileVault(): Promise<void> {
	const { vaultPath } = getConfig();

	// ── Orphaned notes (file deleted outside app) ──────────────────────────────
	const allNotes = db.select({ id: notes.id }).from(notes).all();
	for (const note of allNotes) {
		const filePath = path.join(vaultPath, ...note.id.split('/'));
		if (!fs.existsSync(filePath)) {
			db.run(sql`DELETE FROM notes_fts WHERE note_id = ${note.id}`);
			db.run(
				sql`DELETE FROM relations WHERE (source_type = 'note' AND source_id = ${note.id}) OR (target_type = 'note' AND target_id = ${note.id})`
			);
			db.delete(notes).where(eq(notes.id, note.id)).run();
		}
	}

	// ── Orphaned spaces (directory deleted outside app) ────────────────────────
	const allSpaces = db.select({ id: spaces.id }).from(spaces).all();
	for (const space of allSpaces) {
		const dirPath = path.join(vaultPath, ...space.id.split('/'));
		if (!fs.existsSync(dirPath)) {
			db.run(sql`
				DELETE FROM notes_fts WHERE note_id IN (
					SELECT id FROM notes WHERE space_id = ${space.id} OR space_id LIKE ${space.id + '/%'}
				)
			`);
			db.delete(spaces).where(eq(spaces.id, space.id)).run();
		}
	}
}
