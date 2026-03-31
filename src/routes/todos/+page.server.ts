import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { spaces, todos } from '$lib/server/db/schema';
import type { Actions } from './$types';

const createSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	spaceId: z.string().min(1, 'Space is required'),
	parentId: z.string().optional(),
});

function getTodoDepth(db: import('$lib/server/db/index.js').Db, todoId: string): number {
	let depth = 0;
	let current = db.select().from(todos).where(eq(todos.id, todoId)).get();
	while (current?.parentId) {
		depth++;
		current = db.select().from(todos).where(eq(todos.id, current.parentId)).get();
	}
	return depth;
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const result = createSchema.safeParse({
			title: data.get('title'),
			spaceId: data.get('spaceId'),
			parentId: data.get('parentId') || undefined,
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');

		const space = db.select().from(spaces).where(eq(spaces.id, result.data.spaceId)).get();
		if (!space) return fail(404, { error: 'Space not found' });

		if (result.data.parentId) {
			const parent = db.select().from(todos).where(eq(todos.id, result.data.parentId)).get();
			if (!parent) return fail(404, { error: 'Parent todo not found' });

			const parentDepth = getTodoDepth(db, result.data.parentId);
			if (parentDepth >= 2) {
				return fail(400, { error: 'Todos can only be nested up to 3 levels deep' });
			}
		}

		const id = nanoid();
		const now = new Date();
		db.insert(todos).values({
			id,
			spaceId: result.data.spaceId,
			parentId: result.data.parentId ?? null,
			title: result.data.title,
			status: 'open',
			createdAt: now,
			updatedAt: now,
		}).run();

		redirect(302, `/todos/${id}`);
	},
};
