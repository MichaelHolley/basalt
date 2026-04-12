import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getConfig } from '$lib/server/config';
import type { RequestHandler } from './$types';

const ALLOWED_MIME_TYPES: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg'
};

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file');
	const noteId = formData.get('noteId');

	if (!(file instanceof File)) return json({ error: 'file is required' }, { status: 400 });
	if (typeof noteId !== 'string' || !noteId)
		return json({ error: 'noteId is required' }, { status: 400 });

	const ext = ALLOWED_MIME_TYPES[file.type];
	if (!ext) return json({ error: 'Unsupported image type' }, { status: 415 });

	const spaceId = noteId.split('/').slice(0, -1).join('/');
	if (!spaceId) return json({ error: 'Invalid noteId' }, { status: 400 });

	const buffer = Buffer.from(await file.arrayBuffer());
	const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
	const filename = `${hash}.${ext}`;

	const config = getConfig();
	const assetsDir = path.join(config.vaultPath, ...spaceId.split('/'), 'assets');
	fs.mkdirSync(assetsDir, { recursive: true });

	const filePath = path.join(assetsDir, filename);
	fs.writeFileSync(filePath, buffer);

	return json({ url: `/api/images/${spaceId}/assets/${filename}` });
};
