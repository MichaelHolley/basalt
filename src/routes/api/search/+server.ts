import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return json({ results: [] });

	const { db } = await import('$lib/server/db/index.js');

	// Build a prefix-search query: each word becomes "word*", joined with spaces (implicit AND)
	const ftsQuery = q
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => `"${w.replace(/"/g, '')}"*`)
		.join(' ');

	let results: { note_id: string; title: string; snippet: string }[] = [];
	try {
		results = db.all(sql`
			SELECT
				note_id,
				title,
				snippet(notes_fts, 2, '<mark>', '</mark>', '…', 12) AS snippet
			FROM notes_fts
			WHERE notes_fts MATCH ${ftsQuery}
			ORDER BY rank
			LIMIT 20
		`) as { note_id: string; title: string; snippet: string }[];
	} catch {
		// Malformed FTS query — return empty
	}

	return json({ results });
};
