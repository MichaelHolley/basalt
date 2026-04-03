import path from 'path';
import os from 'os';
import { getConfig } from '$lib/server/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const config = getConfig();
	return {
		vaultPath: config.vaultPath,
		dbPath: path.join(os.homedir(), '.config', 'basalt', 'basalt.db'),
		configPath: path.join(os.homedir(), '.config', 'basalt', 'config.json'),
	};
};
