import type { spaces, notes, todos } from './schema.js';

type Space = typeof spaces.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Todo = typeof todos.$inferSelect;
export type TodoNode = Todo & { children: TodoNode[] };
export type TodoWithDepth = Todo & { depth: number };
export type SpaceNode = Space & { children: SpaceNode[] };
