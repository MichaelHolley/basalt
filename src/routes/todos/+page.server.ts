import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { getSpace } from "$lib/server/service/space.service";
import { createTodo } from "$lib/server/service/todo.service";
import type { Actions } from "./$types";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  spaceId: z.string().min(1, "Space is required"),
  parentId: z.string().optional(),
});

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const result = createSchema.safeParse({
      title: data.get("title"),
      spaceId: data.get("spaceId"),
      parentId: data.get("parentId") || undefined,
    });

    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const space = getSpace(result.data.spaceId);
    if (!space) return fail(404, { error: "Space not found" });

    let id: string;
    try {
      id = createTodo(result.data.title, result.data.spaceId, result.data.parentId);
    } catch (e) {
      return fail(400, { error: (e as Error).message });
    }

    redirect(302, `/spaces/${result.data.spaceId}/${id}`);
  },
};
