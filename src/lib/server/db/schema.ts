import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const spaces = sqliteTable('spaces', {
	id: text('id').primaryKey(), // relative path from vault root e.g. "work/clients"
	parentId: text('parent_id'), // self-referential, null for top-level spaces
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const notes = sqliteTable('notes', {
	id: text('id').primaryKey(), // relative file path e.g. "work/standup.md"
	spaceId: text('space_id')
		.notNull()
		.references(() => spaces.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const todos = sqliteTable('todos', {
	id: text('id').primaryKey(), // nanoid
	spaceId: text('space_id')
		.notNull()
		.references(() => spaces.id, { onDelete: 'cascade' }),
	parentId: text('parent_id'), // self-referential, max depth 3 enforced in app logic
	title: text('title').notNull(),
	status: text('status', { enum: ['open', 'done'] })
		.notNull()
		.default('open'),
	dueDate: integer('due_date', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Bidirectional relations between notes and todos.
// Pairs are normalized lexicographically before insert so (A→B) and (B→A) are the same row.
export const relations = sqliteTable(
	'relations',
	{
		id: text('id').primaryKey(), // nanoid
		sourceType: text('source_type', { enum: ['note', 'todo'] }).notNull(),
		sourceId: text('source_id').notNull(),
		targetType: text('target_type', { enum: ['note', 'todo'] }).notNull(),
		targetId: text('target_id').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [
		uniqueIndex('relations_pair_unique').on(t.sourceType, t.sourceId, t.targetType, t.targetId)
	]
);
