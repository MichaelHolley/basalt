import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { writeConfig, DEFAULT_VAULT_PATH } from '$lib/server/config';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { defaultVaultPath: DEFAULT_VAULT_PATH };
};

const setupSchema = z.object({
	vaultPath: z.string().min(1, 'Vault path is required'),
});

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const result = setupSchema.safeParse({ vaultPath: data.get('vaultPath') });

		if (!result.success) {
			return { error: result.error.issues[0].message };
		}

		writeConfig({ vaultPath: result.data.vaultPath });
		redirect(302, '/');
	},
};
