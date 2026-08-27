import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getConfig } from '$lib/server/config';
import { getSpace, createSpace, renameSpace, deleteSpace } from '$lib/server/service/space.service';
import type { Actions } from './$types';

const createSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	parentId: z.string().optional()
});

const renameSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1, 'Name is required')
});

const deleteSchema = z.object({
	id: z.string().min(1)
});

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const result = createSchema.safeParse({
			name: data.get('name'),
			parentId: data.get('parentId') || undefined
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const config = getConfig();

		let id: string;
		try {
			id = createSpace(result.data.name, result.data.parentId, config.vaultPath);
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}

		return { success: true, id };
	},

	rename: async ({ request }) => {
		const data = await request.formData();
		const result = renameSchema.safeParse({
			id: data.get('id'),
			name: data.get('name')
		});

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const config = getConfig();

		const existing = getSpace(result.data.id);
		if (!existing) return fail(404, { error: 'Space not found' });

		const newId = renameSpace(result.data.id, result.data.name, config.vaultPath);
		redirect(302, `/spaces/${newId}`);
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteSchema.safeParse({ id: data.get('id') });

		if (!result.success) return fail(400, { error: result.error.issues[0].message });

		const config = getConfig();
		const existing = getSpace(result.data.id);
		if (!existing) return fail(404, { error: 'Space not found' });

		deleteSpace(result.data.id, config.vaultPath);
		redirect(302, existing.parentId ? `/spaces/${existing.parentId}` : '/');
	}
};
