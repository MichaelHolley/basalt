import { redirect } from '@sveltejs/kit';
import { configExists } from '$lib/server/config';
import { buildTree } from '$lib/server/db/utils';
import { spaces } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	const isSetup = url.pathname === '/setup';

	if (!configExists()) {
		if (!isSetup) redirect(302, '/setup');
		return {};
	}

	if (isSetup) redirect(302, '/');

	const { db } = await import('$lib/server/db/index.js');
	const flat = db.select().from(spaces).orderBy(asc(spaces.id)).all();
	return { spaces: buildTree(flat) };
};
