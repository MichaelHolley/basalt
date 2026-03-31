import { fail, error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { sql, eq, asc } from 'drizzle-orm';
import { getConfig } from '$lib/server/config';
import { slugify, buildTodoTree } from '$lib/server/db/utils';
import { spaces, notes, todos } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { db } = await import('$lib/server/db/index.js');
	const config = getConfig();

	// Check if this path is a space
	const space = db.select().from(spaces).where(eq(spaces.id, params.id)).get();
	if (space) {
		const spaceNotes = db.select().from(notes).where(eq(notes.spaceId, space.id)).orderBy(asc(notes.title)).all();
		const spaceTodosFlat = db.select().from(todos).where(eq(todos.spaceId, space.id)).orderBy(asc(todos.createdAt)).all();
		return { type: 'space' as const, space, notes: spaceNotes, todos: buildTodoTree(spaceTodosFlat) };
	}

	// Check if this path is a note (append .md)
	const noteId = `${params.id}.md`;
	const note = db.select().from(notes).where(eq(notes.id, noteId)).get();
	if (note) {
		const filePath = path.join(config.vaultPath, ...note.id.split('/'));
		const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
		return { type: 'note' as const, note, content };
	}

	// Check if the last segment is a todo nanoid
	const segments = params.id.split('/');
	const todoId = segments[segments.length - 1];
	const todo = db.select().from(todos).where(eq(todos.id, todoId)).get();
	if (todo) {
		const children = db.select().from(todos).where(eq(todos.parentId, todoId)).orderBy(asc(todos.createdAt)).all();
		return { type: 'todo' as const, todo, children };
	}

	error(404, 'Not found');
};

// ── Shared schemas ────────────────────────────────────────────────────────────

const noteRenameSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1, 'Title is required'),
});

const noteDeleteSchema = z.object({
	id: z.string().min(1),
});

const todoRenameSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1, 'Title is required'),
});

const todoToggleSchema = z.object({
	id: z.string().min(1),
});

const todoDueDateSchema = z.object({
	id: z.string().min(1),
	dueDate: z.string().optional(),
});

const todoDeleteSchema = z.object({
	id: z.string().min(1),
});

const createChildSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	parentId: z.string().min(1),
});

// ── Actions ───────────────────────────────────────────────────────────────────

export const actions: Actions = {
	// Note actions
	rename: async ({ request }) => {
		const data = await request.formData();
		const result = noteRenameSchema.safeParse({ id: data.get('id'), title: data.get('title') });
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
			if (existing) return fail(400, { error: `A note named "${result.data.title}" already exists in this space` });

			const oldPath = path.join(config.vaultPath, ...result.data.id.split('/'));
			const newPath = path.join(config.vaultPath, ...newId.split('/'));
			if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);

			db.run(sql`PRAGMA foreign_keys = OFF`);
			try {
				db.transaction((tx) => {
					tx.run(sql`UPDATE notes SET id = ${newId}, title = ${result.data.title}, updated_at = ${Date.now()} WHERE id = ${result.data.id}`);
				});
			} finally {
				db.run(sql`PRAGMA foreign_keys = ON`);
			}
		} else {
			db.update(notes).set({ title: result.data.title, updatedAt: new Date() }).where(eq(notes.id, result.data.id)).run();
		}

		redirect(302, `/spaces/${newId.replace(/\.md$/, '')}`);
	},

	deleteNote: async ({ request }) => {
		const data = await request.formData();
		const result = noteDeleteSchema.safeParse({ id: data.get('id') });
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

	// Todo actions
	renameTodo: async ({ request }) => {
		const data = await request.formData();
		const result = todoRenameSchema.safeParse({ id: data.get('id'), title: data.get('title') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		db.update(todos).set({ title: result.data.title, updatedAt: new Date() }).where(eq(todos.id, result.data.id)).run();
		return { success: true };
	},

	toggle: async ({ request }) => {
		const data = await request.formData();
		const result = todoToggleSchema.safeParse({ id: data.get('id') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		db.update(todos).set({ status: todo.status === 'open' ? 'done' : 'open', updatedAt: new Date() }).where(eq(todos.id, result.data.id)).run();
		return { success: true };
	},

	setDueDate: async ({ request }) => {
		const data = await request.formData();
		const result = todoDueDateSchema.safeParse({ id: data.get('id'), dueDate: data.get('dueDate') || undefined });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		const dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null;
		db.update(todos).set({ dueDate, updatedAt: new Date() }).where(eq(todos.id, result.data.id)).run();
		return { success: true };
	},

	createChild: async ({ request }) => {
		const data = await request.formData();
		const result = createChildSchema.safeParse({ title: data.get('title'), parentId: data.get('parentId') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const parent = db.select().from(todos).where(eq(todos.id, result.data.parentId)).get();
		if (!parent) return fail(404, { error: 'Parent todo not found' });

		let depth = 0;
		let current = parent;
		while (current.parentId) {
			depth++;
			current = db.select().from(todos).where(eq(todos.id, current.parentId)).get()!;
		}
		if (depth >= 2) return fail(400, { error: 'Todos can only be nested up to 3 levels deep' });

		const id = nanoid();
		const now = new Date();
		db.insert(todos).values({ id, spaceId: parent.spaceId, parentId: result.data.parentId, title: result.data.title, status: 'open', createdAt: now, updatedAt: now }).run();
		return { success: true };
	},

	deleteTodo: async ({ request }) => {
		const data = await request.formData();
		const result = todoDeleteSchema.safeParse({ id: data.get('id') });
		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const { db } = await import('$lib/server/db/index.js');
		const todo = db.select().from(todos).where(eq(todos.id, result.data.id)).get();
		if (!todo) return fail(404, { error: 'Todo not found' });

		db.transaction((tx) => {
			tx.run(sql`DELETE FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${result.data.id}))`);
			tx.run(sql`DELETE FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${result.data.id})`);
			tx.run(sql`DELETE FROM todos WHERE parent_id = ${result.data.id}`);
			tx.run(sql`DELETE FROM todos WHERE id = ${result.data.id}`);
		});

		const returnTo = todo.parentId ? `/spaces/${todo.spaceId}/${todo.parentId}` : `/spaces/${todo.spaceId}`;
		redirect(302, returnTo);
	},
};
