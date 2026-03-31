import { fail, error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { sql, eq, asc } from 'drizzle-orm';
import { getConfig } from '$lib/server/config';
import { slugify } from '$lib/server/db/utils';
import { spaces, notes, todos } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { db } = await import('$lib/server/db/index.js');
	const config = getConfig();

	// Check if this path is a space
	const space = db.select().from(spaces).where(eq(spaces.id, params.id)).get();
	if (space) {
		const spaceNotes = db.select().from(notes).where(eq(notes.spaceId, space.id)).orderBy(asc(notes.title)).all();
		const spaceTodos = db.select().from(todos).where(eq(todos.spaceId, space.id)).orderBy(asc(todos.createdAt)).all();
		return { type: 'space' as const, space, notes: spaceNotes, todos: spaceTodos };
	}

	// Check if this path is a note (append .md)
	const noteId = `${params.id}.md`;
	const note = db.select().from(notes).where(eq(notes.id, noteId)).get();
	if (note) {
		const filePath = path.join(config.vaultPath, ...note.id.split('/'));
		const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
		return { type: 'note' as const, note, content };
	}

	error(404, 'Not found');
};

const renameSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1, 'Title is required'),
});

const deleteSchema = z.object({
	id: z.string().min(1),
});

export const actions: Actions = {
	rename: async ({ request }) => {
		const data = await request.formData();
		const result = renameSchema.safeParse({
			id: data.get('id'),
			title: data.get('title'),
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const config = getConfig();

		const note = db.select().from(notes).where(eq(notes.id, result.data.id)).get();
		if (!note) return fail(404, { error: 'Note not found' });

		const slug = slugify(result.data.title);
		const parts = result.data.id.split('/');
		parts[parts.length - 1] = `${slug}.md`;
		const newId = parts.join('/');

		if (newId !== result.data.id) {
			const existing = db.select().from(notes).where(eq(notes.id, newId)).get();
			if (existing)
				return fail(400, { error: `A note named "${result.data.title}" already exists in this space` });

			const oldPath = path.join(config.vaultPath, ...result.data.id.split('/'));
			const newPath = path.join(config.vaultPath, ...newId.split('/'));
			if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);

			db.run(sql`PRAGMA foreign_keys = OFF`);
			try {
				db.transaction((tx) => {
					tx.run(sql`
						UPDATE notes SET id = ${newId}, title = ${result.data.title}, updated_at = ${Date.now()}
						WHERE id = ${result.data.id}
					`);
				});
			} finally {
				db.run(sql`PRAGMA foreign_keys = ON`);
			}
		} else {
			db.update(notes)
				.set({ title: result.data.title, updatedAt: new Date() })
				.where(eq(notes.id, result.data.id))
				.run();
		}

		redirect(302, `/spaces/${newId.replace(/\.md$/, '')}`);
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteSchema.safeParse({ id: data.get('id') });

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const config = getConfig();

		const note = db.select().from(notes).where(eq(notes.id, result.data.id)).get();
		if (!note) return fail(404, { error: 'Note not found' });

		const filePath = path.join(config.vaultPath, ...result.data.id.split('/'));
		if (fs.existsSync(filePath)) fs.rmSync(filePath);

		db.delete(notes).where(eq(notes.id, result.data.id)).run();

		redirect(302, `/spaces/${note.spaceId}`);
	},
};
