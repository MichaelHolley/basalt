import { eq, asc, desc, or, inArray, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db';
import { todos } from '$lib/server/db/schema';

export function getTopLevelTodos() {
	return db.select().from(todos).where(isNull(todos.parentId)).orderBy(asc(todos.createdAt)).all();
}

export function getTodosBySpace(spaceId: string) {
	return db
		.select()
		.from(todos)
		.where(eq(todos.spaceId, spaceId))
		.orderBy(asc(todos.createdAt))
		.all();
}

export function getTodosByRootSpace(rootSpace: string) {
	return db
		.select()
		.from(todos)
		.where(or(eq(todos.spaceId, rootSpace), sql`${todos.spaceId} LIKE ${rootSpace + '/%'}`))
		.orderBy(asc(todos.createdAt))
		.all();
}

export function getTodo(id: string) {
	return db.select().from(todos).where(eq(todos.id, id)).get() ?? null;
}

export function getTodoChildren(parentId: string) {
	return db
		.select()
		.from(todos)
		.where(eq(todos.parentId, parentId))
		.orderBy(asc(todos.createdAt))
		.all();
}

export function getTodoGrandchildren(parentIds: string[]) {
	return db
		.select()
		.from(todos)
		.where(inArray(todos.parentId, parentIds))
		.orderBy(asc(todos.createdAt))
		.all();
}

export function getTodoDepth(todoId: string): number {
	let depth = 0;
	let current = getTodo(todoId);
	while (current?.parentId) {
		depth++;
		current = getTodo(current.parentId);
	}
	return depth;
}

export function createTodo(title: string, spaceId: string, parentId?: string): string {
	if (parentId) {
		const parent = getTodo(parentId);
		if (!parent) throw new Error('Parent todo not found');
		const parentDepth = getTodoDepth(parentId);
		if (parentDepth >= 2) throw new Error('Todos can only be nested up to 3 levels deep');
	}

	const id = nanoid();
	const now = new Date();
	db.insert(todos)
		.values({
			id,
			spaceId,
			parentId: parentId ?? null,
			title,
			status: 'open',
			createdAt: now,
			updatedAt: now
		})
		.run();
	return id;
}

export function renameTodo(id: string, title: string): void {
	const todo = getTodo(id);
	if (!todo) throw new Error('Todo not found');
	db.update(todos).set({ title, updatedAt: new Date() }).where(eq(todos.id, id)).run();
}

export function toggleTodo(id: string): void {
	const todo = getTodo(id);
	if (!todo) throw new Error('Todo not found');
	db.update(todos)
		.set({ status: todo.status === 'open' ? 'done' : 'open', updatedAt: new Date() })
		.where(eq(todos.id, id))
		.run();
}

export function setTodoDueDate(id: string, dueDate: Date | null): void {
	const todo = getTodo(id);
	if (!todo) throw new Error('Todo not found');
	db.update(todos).set({ dueDate, updatedAt: new Date() }).where(eq(todos.id, id)).run();
}

export function getOpenTodos(limit: number) {
	return db
		.select()
		.from(todos)
		.where(eq(todos.status, 'open'))
		.orderBy(sql`${todos.dueDate} ASC NULLS LAST`, asc(todos.createdAt))
		.limit(limit)
		.all();
}

export function deleteTodo(id: string): { spaceId: string; parentId: string | null } {
	const todo = getTodo(id);
	if (!todo) throw new Error('Todo not found');

	db.transaction((tx) => {
		tx.run(sql`
      DELETE FROM relations WHERE
        (source_type = 'todo' AND source_id IN (
          SELECT id FROM todos WHERE id = ${id}
          UNION SELECT id FROM todos WHERE parent_id = ${id}
          UNION SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${id})
          UNION SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${id}))
        )) OR
        (target_type = 'todo' AND target_id IN (
          SELECT id FROM todos WHERE id = ${id}
          UNION SELECT id FROM todos WHERE parent_id = ${id}
          UNION SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${id})
          UNION SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${id}))
        ))
    `);
		tx.run(
			sql`DELETE FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${id}))`
		);
		tx.run(
			sql`DELETE FROM todos WHERE parent_id IN (SELECT id FROM todos WHERE parent_id = ${id})`
		);
		tx.run(sql`DELETE FROM todos WHERE parent_id = ${id}`);
		tx.run(sql`DELETE FROM todos WHERE id = ${id}`);
	});

	return { spaceId: todo.spaceId, parentId: todo.parentId };
}
