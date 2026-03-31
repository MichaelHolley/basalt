import { sql } from 'drizzle-orm';
import { asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import type { Db } from './index.js';
import { spaces, notes } from './schema.js';

type Space = typeof spaces.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type SpaceNode = Space & { children: SpaceNode[] };

// Assembles a flat list of spaces (ordered by path) into a nested tree.
export function buildTree(flat: Space[]): SpaceNode[] {
	const map = new Map<string, SpaceNode>();
	for (const s of flat) map.set(s.id, { ...s, children: [] });

	const roots: SpaceNode[] = [];
	for (const s of flat) {
		const node = map.get(s.id)!;
		if (s.parentId && map.has(s.parentId)) {
			map.get(s.parentId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}
	return roots;
}

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

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

export { asc };
