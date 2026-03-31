import { fail, error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { sql, eq, asc, isNull } from 'drizzle-orm';
import { todos } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { db } = await import('$lib/server/db/index.js');

	const todo = db.select().from(todos).where(eq(todos.id, params.id)).get();
	if (!todo) error(404, 'Todo not found');

	const children = db
		.select()
		.from(todos)
		.where(eq(todos.parentId, params.id))
		.orderBy(asc(todos.createdAt))
		.all();

	return { todo, children };
};

const renameSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1, 'Title is required'),
});

const toggleSchema = z.object({
	id: z.string().min(1),
});

const dueDateSchema = z.object({
	id: z.string().min(1),
	dueDate: z.string().optional(),
});

const deleteSchema = z.object({
	id: z.string().min(1),
});

const createChildSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	parentId: z.string().min(1),
});

export const actions: Actions = {
	rename: async ({ request }) => {
		const data = await request.formData();
		const result = renameSchema.safeParse({ id: data.get('id'), title: data.get('title') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		db.update(todos)
			.set({ title: result.data.title, updatedAt: new Date() })
			.where(eq(todos.id, result.data.id))
			.run();

		return { success: true };
	},

	toggle: async ({ request }) => {
		const data = await request.formData();
		const result = toggleSchema.safeParse({ id: data.get('id') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		const newStatus = todo.status === 'open' ? 'done' : 'open';
		db.update(todos)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(todos.id, result.data.id))
			.run();

		return { success: true };
	},

	setDueDate: async ({ request }) => {
		const data = await request.formData();
		const result = dueDateSchema.safeParse({ id: data.get('id'), dueDate: data.get('dueDate') || undefined });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		const dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null;
		db.update(todos)
			.set({ dueDate, updatedAt: new Date() })
			.where(eq(todos.id, result.data.id))
			.run();

		return { success: true };
	},

	createChild: async ({ request, params }) => {
		const data = await request.formData();
		const result = createChildSchema.safeParse({
			title: data.get('title'),
			parentId: data.get('parentId'),
		});
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const parent = db.select().from(todos).where(eq(todos.id, result.data.parentId)).get();
		if (!parent) return fail(404, { error: 'Parent todo not found' });

		// Count depth by traversing up
		let depth = 0;
		let current = parent;
		while (current.parentId) {
			depth++;
			current = db.select().from(todos).where(eq(todos.id, current.parentId)).get()!;
		}
		if (depth >= 2) return fail(400, { error: 'Todos can only be nested up to 3 levels deep' });

		const id = nanoid();
		const now = new Date();
		db.insert(todos).values({
			id,
			spaceId: parent.spaceId,
			parentId: result.data.parentId,
			title: result.data.title,
			status: 'open',
			createdAt: now,
			updatedAt: now,
		}).run();

		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteSchema.safeParse({ id: data.get('id') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		// Delete descendants depth-first (max 3 levels, so 3 nested subqueries suffice)
		db.transaction((tx) => {
			tx.run(sql`
				DELETE FROM todos WHERE parent_id IN (
					SELECT id FROM todos WHERE parent_id IN (
						SELECT id FROM todos WHERE parent_id = ${result.data.id}
					)
				)
			`);
			tx.run(sql`
				DELETE FROM todos WHERE parent_id IN (
					SELECT id FROM todos WHERE parent_id = ${result.data.id}
				)
			`);
			tx.run(sql`DELETE FROM todos WHERE parent_id = ${result.data.id}`);
			tx.run(sql`DELETE FROM todos WHERE id = ${result.data.id}`);
		});

		const returnTo = todo.parentId ? `/todos/${todo.parentId}` : `/spaces/${todo.spaceId}`;
		redirect(302, returnTo);
	},
};
