<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Command from '$lib/components/ui/command';
	import type { SpaceNode } from '$lib/server/db/utils';
	import { ArrowLeft, FileText, FolderPlus, ListTodo } from '@lucide/svelte';
	import { Debounced, watch } from 'runed';
	import { SvelteMap } from 'svelte/reactivity';

	// ── Types ──────────────────────────────────────────────────────────────────
	type CreateAction = 'note' | 'todo' | 'space';

	interface CreateCommand {
		action: CreateAction;
		label: string;
		icon: typeof FileText;
	}

	// ── Props ──────────────────────────────────────────────────────────────────
	let { spaces = [] }: { spaces: SpaceNode[] } = $props();

	// ── State ──────────────────────────────────────────────────────────────────
	let open = $state(false);
	let query = $state('');
	let results = $state<{ note_id: string; title: string; snippet: string }[]>([]);
	let createMode = $state<CreateAction | null>(null);
	let nameValue = $state('');
	let nameInputEl = $state<HTMLInputElement | null>(null);
	let createFormEl = $state<HTMLFormElement | null>(null);
	const debouncedQuery = new Debounced(() => query, 200);

	const createCommands: CreateCommand[] = [
		{ action: 'note', label: 'New Note', icon: FileText },
		{ action: 'todo', label: 'New Todo', icon: ListTodo },
		{ action: 'space', label: 'New Space', icon: FolderPlus }
	];

	// ── Derived ────────────────────────────────────────────────────────────────
	let activeSpaceId = $derived.by(() => {
		const pd = $page.data as Record<string, unknown>;
		if (pd.type === 'space') return (pd.space as { id: string } | undefined)?.id ?? null;
		if (pd.type === 'note') return (pd.note as { spaceId: string } | undefined)?.spaceId ?? null;
		if (pd.type === 'todo') return (pd.todo as { spaceId: string } | undefined)?.spaceId ?? null;
		return null;
	});

	let spaceNameMap = $derived.by(() => {
		const map = new SvelteMap<string, string>();
		function flatten(nodes: SpaceNode[]) {
			for (const n of nodes) {
				map.set(n.id, n.name);
				flatten(n.children);
			}
		}
		flatten(spaces);
		return map;
	});

	let activeSpaceName = $derived(
		activeSpaceId ? (spaceNameMap.get(activeSpaceId) ?? activeSpaceId) : null
	);

	let visibleCreateCommands = $derived(
		query.trim()
			? createCommands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()))
			: createCommands
	);

	// ── Effects ────────────────────────────────────────────────────────────────
	$effect(() => {
		if (!open) {
			query = '';
			results = [];
			createMode = null;
			nameValue = '';
		}
	});

	$effect(() => {
		if (!query.trim()) {
			results = [];
			debouncedQuery.cancel();
		}
	});

	$effect(() => {
		if (createMode && nameInputEl) {
			nameInputEl.focus();
		}
	});

	$effect(() => {
		function captureEsc(e: KeyboardEvent) {
			if (e.key === 'Escape' && createMode !== null && open) {
				e.stopImmediatePropagation();
				e.preventDefault();
				createMode = null;
				nameValue = '';
			}
		}
		window.addEventListener('keydown', captureEsc, true);
		return () => window.removeEventListener('keydown', captureEsc, true);
	});

	watch(
		() => debouncedQuery.current,
		() => {
			if (!debouncedQuery.current.trim()) return;
			fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.current)}`)
				.then((res) => res.json())
				.then((data) => (results = data.results ?? []));
		},
		{ lazy: true }
	);

	// ── Functions ──────────────────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = true;
		}
	}

	function selectCreateAction(action: CreateAction) {
		createMode = action;
		query = '';
		nameValue = '';
	}

	function submitCreate() {
		if (!nameValue.trim()) return;
		if (createMode !== 'space' && !activeSpaceId) return;
		createFormEl?.requestSubmit();
	}

	function createLabel(action: CreateAction): string {
		if (action === 'note') return 'New Note';
		if (action === 'todo') return 'New Todo';
		return 'New Space';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog bind:open shouldFilter={false}>
	{#if createMode}
		{#if createMode === 'space'}
			<form
				bind:this={createFormEl}
				method="POST"
				action="/spaces?/create"
				use:enhance={() =>
					async ({ result, update }) => {
						if (result.type === 'success' && result.data?.id) {
							open = false;
							nameValue = '';
							await goto(`/spaces/${result.data.id}`);
							await update({ invalidateAll: true });
						} else {
							await update();
						}
					}}
			>
				{#if activeSpaceId}
					<input type="hidden" name="parentId" value={activeSpaceId} />
				{/if}
				<input type="hidden" name="name" value={nameValue} />
			</form>
		{:else}
			<form
				bind:this={createFormEl}
				method="POST"
				action={createMode === 'note' ? '/notes?/create' : '/todos?/create'}
				use:enhance={() =>
					({ update }) => {
						open = false;
						nameValue = '';
						return update({ invalidateAll: true });
					}}
			>
				<input type="hidden" name="spaceId" value={activeSpaceId ?? ''} />
				<input type="hidden" name="title" value={nameValue} />
			</form>
		{/if}

		<div class="flex items-center gap-2 border-b p-1 pb-1">
			<button
				type="button"
				class="flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground"
				onclick={() => {
					createMode = null;
					nameValue = '';
				}}
				aria-label="Back to search"
			>
				<ArrowLeft class="size-4" />
			</button>
			<span class="text-xs font-medium text-muted-foreground">{createLabel(createMode)}</span>
			{#if createMode === 'space'}
				<span class="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
					{activeSpaceName ?? 'root'}
				</span>
			{:else if activeSpaceName}
				<span
					class="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
					title={activeSpaceId ?? ''}
				>
					{activeSpaceName}
				</span>
			{/if}
			<input
				bind:this={nameInputEl}
				bind:value={nameValue}
				class="h-8 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
				placeholder="Enter name…"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						submitCreate();
					}
				}}
			/>
		</div>

		<div class="px-3 py-4 text-center text-xs text-muted-foreground">
			{#if createMode === 'space' || activeSpaceId}
				Press <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Enter</kbd> to create ·
				<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
			{:else}
				<span class="text-amber-500">No active space — navigate to a space first</span>
				·
				<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
			{/if}
		</div>
	{:else}
		<Command.Input placeholder="Search notes…" bind:value={query} />
		<Command.List>
			{#if query.trim() && results.length === 0 && visibleCreateCommands.length === 0}
				<Command.Empty>No results found.</Command.Empty>
			{/if}
			{#if results.length > 0}
				<Command.Group heading="Notes">
					{#each results as result (result.note_id)}
						<Command.LinkItem
							href="/spaces/{result.note_id.replace(/\.md$/, '')}"
							onclick={() => (open = false)}
						>
							<FileText class="mt-0.5 shrink-0 self-start" />
							<div class="flex min-w-0 flex-col">
								<span class="truncate">{result.title}</span>
								{#if result.snippet}
									<span class="line-clamp-2 text-xs text-muted-foreground">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html result.snippet}
									</span>
								{/if}
							</div>
						</Command.LinkItem>
					{/each}
				</Command.Group>
			{/if}
			{#if visibleCreateCommands.length > 0}
				<Command.Group heading="Create">
					{#each visibleCreateCommands as cmd (cmd.action)}
						<Command.Item onSelect={() => selectCreateAction(cmd.action)}>
							<cmd.icon />
							{cmd.label}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}
		</Command.List>
	{/if}
</Command.Dialog>
