import { json } from "@sveltejs/kit";
import { z } from "zod";
import { getConfig } from "$lib/server/config";
import { getNote, saveNoteContent } from "$lib/server/service/note.service";
import type { RequestHandler } from "./$types";

const bodySchema = z.object({
  id: z.string().min(1),
  content: z.string(),
});

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const result = bodySchema.safeParse(body);
  if (!result.success)
    return json({ error: result.error.issues[0].message }, { status: 400 });

  const config = getConfig();

  const note = getNote(result.data.id);
  if (!note) return json({ error: "Note not found" }, { status: 404 });

  saveNoteContent(result.data.id, result.data.content, config.vaultPath);
  return json({ ok: true });
};
