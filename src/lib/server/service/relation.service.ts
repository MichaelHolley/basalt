import { eq, and, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db';
import { relations, notes, todos } from '$lib/server/db/schema';
import { normalizeRelation } from '$lib/server/db/utils';

export type RelatedItem = {
	relationId: string;
	type: 'note' | 'todo';
	id: string;
	title: string;
	href: string;
};

export function getRelationsForItem(type: 'note' | 'todo', id: string) {
	return db
		.select()
		.from(relations)
		.where(
			or(
				and(eq(relations.sourceType, type), eq(relations.sourceId, id)),
				and(eq(relations.targetType, type), eq(relations.targetId, id))
			)
		)
		.all();
}

export function resolveRelatedItems(
	itemRelations: ReturnType<typeof getRelationsForItem>,
	currentType: 'note' | 'todo',
	currentId: string
): RelatedItem[] {
	return itemRelations
		.map((r) => {
			const isSource = r.sourceType === currentType && r.sourceId === currentId;
			const otherType = isSource ? r.targetType : r.sourceType;
			const otherId = isSource ? r.targetId : r.sourceId;
			if (otherType === 'note') {
				const related = db.select().from(notes).where(eq(notes.id, otherId)).get();
				return related
					? {
							relationId: r.id,
							type: 'note' as const,
							id: related.id,
							title: related.title,
							href: `/spaces/${related.id}`
						}
					: null;
			} else {
				const related = db.select().from(todos).where(eq(todos.id, otherId)).get();
				return related
					? {
							relationId: r.id,
							type: 'todo' as const,
							id: related.id,
							title: related.title,
							href: `/spaces/${related.spaceId}/${related.id}`
						}
					: null;
			}
		})
		.filter(Boolean) as RelatedItem[];
}

export function createRelation(
	currentType: 'note' | 'todo',
	currentId: string,
	targetType: 'note' | 'todo',
	targetId: string
): void {
	if (currentType === targetType && currentId === targetId) {
		throw new Error('Cannot create a relation to itself');
	}

	if (currentType === 'todo' && targetType === 'todo') {
		throw new Error('Cannot create a relation between two todos');
	}

	const [source, target] = normalizeRelation(
		{ type: currentType, id: currentId },
		{ type: targetType, id: targetId }
	);

	const existing = db
		.select()
		.from(relations)
		.where(
			and(
				eq(relations.sourceType, source.type),
				eq(relations.sourceId, source.id),
				eq(relations.targetType, target.type),
				eq(relations.targetId, target.id)
			)
		)
		.get();
	if (existing) throw new Error('Relation already exists');

	db.insert(relations)
		.values({
			id: nanoid(),
			sourceType: source.type,
			sourceId: source.id,
			targetType: target.type,
			targetId: target.id,
			createdAt: new Date()
		})
		.run();
}

export function deleteRelation(id: string): void {
	db.delete(relations).where(eq(relations.id, id)).run();
}
