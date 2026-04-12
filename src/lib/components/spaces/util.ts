import type { SpaceNode } from '@/server/db/utils';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Flatten the space tree into a id → name map for breadcrumb label resolution
 */
export function flattenSpaces(
	nodes: SpaceNode[],
	map: SvelteMap<string, string> = new SvelteMap()
) {
	for (const node of nodes) {
		map.set(node.id, node.name);
		flattenSpaces(node.children, map);
	}
	return map;
}
