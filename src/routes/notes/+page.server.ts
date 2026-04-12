import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getConfig } from '$lib/server/config';
import { getSpace } from '$lib/server/service/space.service';
import { createNote } from '$lib/server/service/note.service';
import type { Actions } from './$types';

const createSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	spaceId: z.string().min(1, 'Space is required')
});

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const result = createSchema.safeParse({
			title: data.get('title'),
			spaceId: data.get('spaceId')
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const config = getConfig();

		const space = getSpace(result.data.spaceId);
		if (!space) return fail(404, { error: 'Space not found' });

		let id: string;
		try {
			id = createNote(result.data.title, result.data.spaceId, config.vaultPath);
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		redirect(302, `/spaces/${id}`);
	}
};
