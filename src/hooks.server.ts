import { configExists } from '$lib/server/config';
import { reconcileVault } from '$lib/server/service/reconcile.service';

// Initialize the database on startup only if config exists.
// If config doesn't exist the user is on first launch — db init happens after /setup.
if (configExists()) {
	await import('$lib/server/db/index');
	reconcileVault().catch((e) => console.warn('[reconcile] vault sync failed:', e));
}
