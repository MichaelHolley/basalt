import { json } from '@sveltejs/kit';
import { searchNotes } from '$lib/server/service/search.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const results = searchNotes(q);
	return json({ results });
};
