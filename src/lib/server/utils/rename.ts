import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import type { Db } from '$lib/server/db/index.js';
import { slugify } from './text.js';

// Renames a space: updates all affected paths in SQLite and renames the folder on disk.
// Returns the new space id.
export function renameSpace(db: Db, oldId: string, newName: string, vaultPath: string): string {
	const parts = oldId.split('/');
	parts[parts.length - 1] = slugify(newName);
	const newId = parts.join('/');

	if (newId === oldId) {
		// Only the display name changed, no path movement needed
		db.run(sql`UPDATE spaces SET name = ${newName} WHERE id = ${oldId}`);
		return oldId;
	}

	const prefixLen = oldId.length; // used with SQLite's 1-indexed substr

	// FK constraints must be off while updating primary keys
	db.run(sql`PRAGMA foreign_keys = OFF`);
	try {
		db.transaction((tx) => {
			// Update ids and space_ids of all notes under this space
			tx.run(sql`
				UPDATE notes SET
					id = ${newId} || substr(id, ${prefixLen + 1}),
					space_id = CASE
						WHEN space_id = ${oldId} THEN ${newId}
						ELSE ${newId} || substr(space_id, ${prefixLen + 1})
					END
				WHERE id LIKE ${oldId + '/%'}
			`);

			// Keep FTS note_id in sync with the updated note ids
			tx.run(sql`
				UPDATE notes_fts SET note_id = ${newId} || substr(note_id, ${prefixLen + 1})
				WHERE note_id LIKE ${oldId + '/%'}
			`);

			// Update ids and parent_ids of all descendant spaces
			tx.run(sql`
				UPDATE spaces SET
					id = ${newId} || substr(id, ${prefixLen + 1}),
					parent_id = CASE
						WHEN parent_id = ${oldId} THEN ${newId}
						ELSE ${newId} || substr(parent_id, ${prefixLen + 1})
					END
				WHERE id LIKE ${oldId + '/%'}
			`);

			// Update the space itself last (after children are updated)
			tx.run(sql`
				UPDATE spaces SET id = ${newId}, name = ${newName}
				WHERE id = ${oldId}
			`);
		});
	} finally {
		db.run(sql`PRAGMA foreign_keys = ON`);
	}

	// Rename folder on disk
	const oldFolder = path.join(vaultPath, ...oldId.split('/'));
	const newFolder = path.join(vaultPath, ...newId.split('/'));
	if (fs.existsSync(oldFolder)) {
		fs.renameSync(oldFolder, newFolder);
	}

	return newId;
}
