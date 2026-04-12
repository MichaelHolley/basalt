import fs from 'fs';
import path from 'path';
import { getConfig } from '$lib/server/config';
import type { RequestHandler } from './$types';

const MIME_TYPES: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml'
};

export const GET: RequestHandler = async ({ params }) => {
	const config = getConfig();
	const vaultPath = path.resolve(config.vaultPath);

	const requestedPath = params.path;
	const resolved = path.resolve(path.join(vaultPath, requestedPath));

	if (!resolved.startsWith(vaultPath + path.sep) && resolved !== vaultPath) {
		return new Response(null, { status: 403 });
	}

	if (!fs.existsSync(resolved)) {
		return new Response(null, { status: 404 });
	}

	const ext = path.extname(resolved).slice(1).toLowerCase();
	const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

	const buffer = fs.readFileSync(resolved);
	return new Response(buffer, {
		headers: { 'Content-Type': contentType }
	});
};
