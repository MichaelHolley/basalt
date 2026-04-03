import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { getConfig } from "$lib/server/config";
import { slugify } from "$lib/server/db/utils";
import { spaces, notes } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import type { Actions } from "./$types";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  spaceId: z.string().min(1, "Space is required"),
});

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const result = createSchema.safeParse({
      title: data.get("title"),
      spaceId: data.get("spaceId"),
    });

    if (!result.success)
      return fail(400, { error: result.error.issues[0].message });

    const config = getConfig();

    const space = db
      .select()
      .from(spaces)
      .where(eq(spaces.id, result.data.spaceId))
      .get();
    if (!space) return fail(404, { error: "Space not found" });

    const slug = slugify(result.data.title);
    const id = `${result.data.spaceId}/${slug}.md`;

    const existing = db.select().from(notes).where(eq(notes.id, id)).get();
    if (existing)
      return fail(400, {
        error: `A note named "${result.data.title}" already exists in this space`,
      });

    const filePath = path.join(config.vaultPath, ...id.split("/"));
    fs.writeFileSync(filePath, "", "utf-8");

    const now = new Date();
    db.insert(notes)
      .values({
        id,
        spaceId: result.data.spaceId,
        title: result.data.title,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    db.run(
      sql`INSERT INTO notes_fts(note_id, title, body) VALUES (${id}, ${result.data.title}, '')`,
    );

    redirect(302, `/spaces/${id.replace(/\.md$/, "")}`);
  },
};
