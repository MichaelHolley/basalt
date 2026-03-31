import { json } from '@sveltejs/kit';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { sql, eq } from 'drizzle-orm';
import { getConfig } from '$lib/server/config';
import { notes } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
	id: z.string().min(1),
	content: z.string(),
});

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const result = bodySchema.safeParse(body);
	if (!result.success) return json({ error: result.error.issues[0].message }, { status: 400 });

	const { db } = await import('$lib/server/db/index.js');
	const config = getConfig();

	const note = db.select().from(notes).where(eq(notes.id, result.data.id)).get();
	if (!note) return json({ error: 'Note not found' }, { status: 404 });

	// Write content to disk
	const filePath = path.join(config.vaultPath, ...note.id.split('/'));
	fs.writeFileSync(filePath, result.data.content, 'utf-8');

	// Update updatedAt timestamp
	db.update(notes).set({ updatedAt: new Date() }).where(eq(notes.id, result.data.id)).run();

	// Update FTS5 index
	db.run(sql`DELETE FROM notes_fts WHERE note_id = ${result.data.id}`);
	db.run(sql`
		INSERT INTO notes_fts(note_id, title, body)
		VALUES (${result.data.id}, ${note.title}, ${result.data.content})
	`);

	return json({ ok: true });
};
