import type { spaces } from '../db/schema.js';
import type { TodoNode, Todo, SpaceNode } from '../db/types.js';

type Space = typeof spaces.$inferSelect;

export function buildTodoTree(flat: Todo[]): TodoNode[] {
	const map = new Map<string, TodoNode>();
	for (const t of flat) map.set(t.id, { ...t, children: [] });

	const roots: TodoNode[] = [];
	for (const t of flat) {
		const node = map.get(t.id)!;
		if (t.parentId && map.has(t.parentId)) {
			map.get(t.parentId)!.children.push(node);
		} else if (!t.parentId) {
			roots.push(node);
		}
	}
	return roots;
}

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
