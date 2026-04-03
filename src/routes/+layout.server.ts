import { redirect } from "@sveltejs/kit";
import { configExists } from "$lib/server/config";
import { buildTree } from "$lib/server/db/utils";
import { spaces, notes, todos } from "$lib/server/db/schema";
import { asc, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ url }) => {
  const isSetup = url.pathname === "/setup";

  if (!configExists()) {
    if (!isSetup) redirect(302, "/setup");
    return {};
  }

  if (isSetup) redirect(302, "/");

  const flat = db.select().from(spaces).orderBy(asc(spaces.id)).all();
  const allNotes = db.select().from(notes).orderBy(asc(notes.title)).all();
  const topLevelTodos = db
    .select()
    .from(todos)
    .where(isNull(todos.parentId))
    .orderBy(asc(todos.createdAt))
    .all();

  const notesBySpace: Record<string, typeof allNotes> = {};
  for (const note of allNotes) {
    if (!notesBySpace[note.spaceId]) notesBySpace[note.spaceId] = [];
    notesBySpace[note.spaceId].push(note);
  }

  const todosBySpace: Record<string, typeof topLevelTodos> = {};
  for (const todo of topLevelTodos) {
    if (!todosBySpace[todo.spaceId]) todosBySpace[todo.spaceId] = [];
    todosBySpace[todo.spaceId].push(todo);
  }

  return { spaces: buildTree(flat), notesBySpace, todosBySpace };
};
