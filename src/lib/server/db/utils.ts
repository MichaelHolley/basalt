export type RelationSide = { type: 'note' | 'todo'; id: string };

// Normalizes a relation pair so (A→B) and (B→A) always produce the same stored row.
// Sorts lexicographically by "type:id" key so the lesser key is always the source.
export function normalizeRelation(a: RelationSide, b: RelationSide): [RelationSide, RelationSide] {
	const keyA = `${a.type}:${a.id}`;
	const keyB = `${b.type}:${b.id}`;
	return keyA <= keyB ? [a, b] : [b, a];
}
