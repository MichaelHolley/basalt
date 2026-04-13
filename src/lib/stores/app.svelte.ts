import { page } from '$app/state';
import type { SpaceNode, Note } from '$lib/server/db/tree';

class AppStore {
	spaces = $state<SpaceNode[]>([]);
	notesBySpace = $state<Record<string, Note[]>>({});

	activeSpaceId = $derived.by<string | null>(() => {
		const pd = page.data as Record<string, unknown>;
		if (pd.type === 'space') return (pd.space as { id: string } | undefined)?.id ?? null;
		if (pd.type === 'note') return (pd.note as { spaceId: string } | undefined)?.spaceId ?? null;
		if (pd.type === 'todo') return (pd.todo as { spaceId: string } | undefined)?.spaceId ?? null;
		return null;
	});

	activeNoteId = $derived.by<string | null>(() => {
		const pd = page.data as Record<string, unknown>;
		if (pd.type === 'note') return (pd.note as { id: string } | undefined)?.id ?? null;
		return null;
	});

	activeNoteTitle = $derived.by<string | null>(() => {
		const pd = page.data as Record<string, unknown>;
		if (pd.type === 'note') return (pd.note as { title: string } | undefined)?.title ?? null;
		return null;
	});

	set(spaces: SpaceNode[], notesBySpace: Record<string, Note[]>) {
		this.spaces = spaces;
		this.notesBySpace = notesBySpace;
	}
}

export const appStore = new AppStore();
