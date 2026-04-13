import { redirect } from '@sveltejs/kit';
import { configExists } from '$lib/server/config';
import { buildTree } from '$lib/server/utils/tree';
import { getAllSpaces } from '$lib/server/service/space.service';
import { getAllNotes } from '$lib/server/service/note.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	const isSetup = url.pathname === '/setup';

	if (!configExists()) {
		if (!isSetup) redirect(302, '/setup');
		return {};
	}

	if (isSetup) redirect(302, '/');

	const flat = getAllSpaces();
	const allNotes = getAllNotes();

	const notesBySpace: Record<string, typeof allNotes> = {};
	for (const note of allNotes) {
		if (!notesBySpace[note.spaceId]) notesBySpace[note.spaceId] = [];
		notesBySpace[note.spaceId].push(note);
	}

	return { spaces: buildTree(flat), notesBySpace };
};
