import { fail, error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { getConfig } from "$lib/server/config";
import { buildTodoTree } from "$lib/server/db/utils";
import type { TodoWithDepth } from "$lib/server/db/utils";
import { getSpace } from "$lib/server/service/space.service";
import { getNote, getNotesBySpace, getNotesByRootSpace, renameNote, deleteNote } from "$lib/server/service/note.service";
import { getTodo, getTodosBySpace, getTodosByRootSpace, getTodoChildren, getTodoGrandchildren, renameTodo, toggleTodo, setTodoDueDate, createTodo, deleteTodo } from "$lib/server/service/todo.service";
import { getRelationsForItem, resolveRelatedItems, createRelation, deleteRelation } from "$lib/server/service/relation.service";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const config = getConfig();

  // Check if this path is a space
  const space = getSpace(params.id);
  if (space) {
    return {
      type: "space" as const,
      space,
      notes: getNotesBySpace(space.id),
      todos: buildTodoTree(getTodosBySpace(space.id)),
    };
  }

  // Check if this path is a note (append .md)
  const noteId = `${params.id}.md`;
  const note = getNote(noteId);
  if (note) {
    const filePath = path.join(config.vaultPath, ...note.id.split("/"));
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
    const noteRelations = getRelationsForItem("note", note.id);
    const relatedItems = resolveRelatedItems(noteRelations, "note", note.id);
    const rootSpace = note.spaceId.split("/")[0];

    return {
      type: "note" as const,
      note,
      content,
      relatedItems,
      allNotes: getNotesByRootSpace(rootSpace),
      allTodos: getTodosByRootSpace(rootSpace),
    };
  }

  // Check if the last segment is a todo nanoid
  const segments = params.id.split("/");
  const todoId = segments[segments.length - 1];
  const todo = getTodo(todoId);
  if (todo) {
    const directChildren = getTodoChildren(todoId);
    const grandchildren =
      directChildren.length > 0 ? getTodoGrandchildren(directChildren.map((c) => c.id)) : [];

    const children: TodoWithDepth[] = [];
    for (const child of directChildren) {
      children.push({ ...child, depth: 1 });
      for (const gc of grandchildren.filter((gc) => gc.parentId === child.id)) {
        children.push({ ...gc, depth: 2 });
      }
    }

    const todoRelations = getRelationsForItem("todo", todo.id);
    const relatedItems = resolveRelatedItems(todoRelations, "todo", todo.id);
    const rootSpace = todo.spaceId.split("/")[0];

    return {
      type: "todo" as const,
      todo,
      children,
      relatedItems,
      allNotes: getNotesByRootSpace(rootSpace),
      allTodos: getTodosByRootSpace(rootSpace),
    };
  }

  error(404, "Not found");
};

// ── Shared schemas ────────────────────────────────────────────────────────────

const noteRenameSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required"),
});

const noteDeleteSchema = z.object({
  id: z.string().min(1),
});

const todoRenameSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required"),
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
  title: z.string().min(1, "Title is required"),
  parentId: z.string().min(1),
});

const createRelationSchema = z.object({
  currentType: z.enum(["note", "todo"]),
  currentId: z.string().min(1),
  targetType: z.enum(["note", "todo"]),
  targetId: z.string().min(1),
});

const deleteRelationSchema = z.object({
  id: z.string().min(1),
});

// ── Actions ───────────────────────────────────────────────────────────────────

export const actions: Actions = {
  // Note actions
  rename: async ({ request }) => {
    const data = await request.formData();
    const result = noteRenameSchema.safeParse({
      id: data.get("id"),
      title: data.get("title"),
    });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const config = getConfig();
    const note = getNote(result.data.id);
    if (!note) return fail(404, { error: "Note not found" });

    let newId: string;
    try {
      newId = renameNote(result.data.id, result.data.title, config.vaultPath);
    } catch (e) {
      return fail(400, { error: (e as Error).message });
    }

    redirect(302, `/spaces/${newId.replace(/\.md$/, "")}`);
  },

  deleteNote: async ({ request }) => {
    const data = await request.formData();
    const result = noteDeleteSchema.safeParse({ id: data.get("id") });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const config = getConfig();
    const note = getNote(result.data.id);
    if (!note) return fail(404, { error: "Note not found" });

    const spaceId = deleteNote(result.data.id, config.vaultPath);
    redirect(302, `/spaces/${spaceId}`);
  },

  // Todo actions
  renameTodo: async ({ request }) => {
    const data = await request.formData();
    const result = todoRenameSchema.safeParse({
      id: data.get("id"),
      title: data.get("title"),
    });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const todo = getTodo(result.data.id);
    if (!todo) return fail(404, { error: "Todo not found" });

    renameTodo(result.data.id, result.data.title);
    return { success: true };
  },

  toggle: async ({ request }) => {
    const data = await request.formData();
    const result = todoToggleSchema.safeParse({ id: data.get("id") });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const todo = getTodo(result.data.id);
    if (!todo) return fail(404, { error: "Todo not found" });

    toggleTodo(result.data.id);
    return { success: true };
  },

  setDueDate: async ({ request }) => {
    const data = await request.formData();
    const result = todoDueDateSchema.safeParse({
      id: data.get("id"),
      dueDate: data.get("dueDate") || undefined,
    });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const todo = getTodo(result.data.id);
    if (!todo) return fail(404, { error: "Todo not found" });

    const dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null;
    setTodoDueDate(result.data.id, dueDate);
    return { success: true };
  },

  createChild: async ({ request }) => {
    const data = await request.formData();
    const result = createChildSchema.safeParse({
      title: data.get("title"),
      parentId: data.get("parentId"),
    });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const parent = getTodo(result.data.parentId);
    if (!parent) return fail(404, { error: "Parent todo not found" });

    try {
      createTodo(result.data.title, parent.spaceId, result.data.parentId);
    } catch (e) {
      return fail(400, { error: (e as Error).message });
    }
    return { success: true };
  },

  createRelation: async ({ request }) => {
    const data = await request.formData();
    const result = createRelationSchema.safeParse({
      currentType: data.get("currentType"),
      currentId: data.get("currentId"),
      targetType: data.get("targetType"),
      targetId: data.get("targetId"),
    });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const { currentType, currentId, targetType, targetId } = result.data;

    try {
      createRelation(currentType, currentId, targetType, targetId);
    } catch (e) {
      return fail(400, { error: (e as Error).message });
    }
    return { success: true };
  },

  deleteRelation: async ({ request }) => {
    const data = await request.formData();
    const result = deleteRelationSchema.safeParse({ id: data.get("id") });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    deleteRelation(result.data.id);
    return { success: true };
  },

  deleteTodo: async ({ request }) => {
    const data = await request.formData();
    const result = todoDeleteSchema.safeParse({ id: data.get("id") });
    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const todo = getTodo(result.data.id);
    if (!todo) return fail(404, { error: "Todo not found" });

    const { spaceId, parentId } = deleteTodo(result.data.id);
    const returnTo = parentId
      ? `/spaces/${spaceId}/${parentId}`
      : `/spaces/${spaceId}`;
    redirect(302, returnTo);
  },
};
