import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export type SearchResult = { note_id: string; title: string; snippet: string };

export function searchNotes(q: string): SearchResult[] {
	if (!q.trim()) return [];

	const ftsQuery = q
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => `"${w.replace(/"/g, '')}"*`)
		.join(' ');

	try {
		return db.all(sql`
      SELECT
        note_id,
        title,
        snippet(notes_fts, 2, '<mark>', '</mark>', '…', 24) AS snippet
      FROM notes_fts
      WHERE notes_fts MATCH ${ftsQuery}
      ORDER BY rank
      LIMIT 20
    `) as SearchResult[];
	} catch {
		return [];
	}
}
