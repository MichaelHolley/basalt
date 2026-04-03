import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { getConfig } from '$lib/server/config';
import { slugify, renameSpace } from '$lib/server/db/utils';
import { spaces, notes } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Actions } from './$types';

const createSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	parentId: z.string().optional(),
});

const renameSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1, 'Name is required'),
});

const deleteSchema = z.object({
	id: z.string().min(1),
});

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const result = createSchema.safeParse({
			name: data.get('name'),
			parentId: data.get('parentId') || undefined,
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const config = getConfig();
		const slug = slugify(result.data.name);
		const id = result.data.parentId ? `${result.data.parentId}/${slug}` : slug;

		const existing = db.select().from(spaces).where(eq(spaces.id, id)).get();
		if (existing) return fail(400, { error: `A space named "${result.data.name}" already exists here` });

		const folderPath = path.join(config.vaultPath, ...id.split('/'));
		fs.mkdirSync(folderPath, { recursive: true });

		db.insert(spaces).values({
			id,
			parentId: result.data.parentId ?? null,
			name: result.data.name,
			createdAt: new Date(),
		}).run();

		return { success: true };
	},

	rename: async ({ request }) => {
		const data = await request.formData();
		const result = renameSchema.safeParse({
			id: data.get('id'),
			name: data.get('name'),
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const config = getConfig();

		const existing = db.select().from(spaces).where(eq(spaces.id, result.data.id)).get();
		if (!existing) return fail(404, { error: 'Space not found' });

		renameSpace(db, result.data.id, result.data.name, config.vaultPath);
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteSchema.safeParse({ id: data.get('id') });

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const config = getConfig();

		const folderPath = path.join(config.vaultPath, ...result.data.id.split('/'));
		if (fs.existsSync(folderPath)) {
			fs.rmSync(folderPath, { recursive: true, force: true });
		}

		// Clean FTS entries for all notes in this space and its subspaces before cascade delete
		db.run(sql`
			DELETE FROM notes_fts WHERE note_id IN (
				SELECT id FROM notes WHERE space_id = ${result.data.id} OR space_id LIKE ${result.data.id + '/%'}
			)
		`);
		db.delete(spaces).where(eq(spaces.id, result.data.id)).run();
		return { success: true };
	},
};
