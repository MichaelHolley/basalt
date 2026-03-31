import { redirect } from '@sveltejs/kit';
import { configExists } from '$lib/server/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const isSetup = url.pathname === '/setup';

	if (!configExists() && !isSetup) {
		redirect(302, '/setup');
	}

	if (configExists() && isSetup) {
		redirect(302, '/');
	}
};
