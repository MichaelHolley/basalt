<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import CreateNoteForm from '@/components/notes/CreateNoteForm.svelte';
	import CreateSpaceForm from '@/components/spaces/CreateSpaceForm.svelte';
	import CreateTodoForm from '@/components/todos/CreateTodoForm.svelte';
	import type { SpaceNode } from '$lib/server/db/types';
	import { appStore } from '@/stores/app.svelte';
	import { FileText, FolderPlus, ListTodo } from '@lucide/svelte';
	import { Debounced, watch } from 'runed';
	import { SvelteMap } from 'svelte/reactivity';

	// ── Types ──────────────────────────────────────────────────────────────────
	type CreateAction = 'note' | 'todo' | 'space';

	interface CreateCommand {
		action: CreateAction;
		label: string;
		icon: typeof FileText;
	}

	// ── State ──────────────────────────────────────────────────────────────────
	let open = $state(false);
	let query = $state('');
	let results = $state<{ note_id: string; title: string; snippet: string }[]>([]);
	let createMode = $state<CreateAction | null>(null);
	const debouncedQuery = new Debounced(() => query, 200);

	const createCommands: CreateCommand[] = [
		{ action: 'note', label: 'New Note', icon: FileText },
		{ action: 'todo', label: 'New Todo', icon: ListTodo },
		{ action: 'space', label: 'New Space', icon: FolderPlus }
	];

	// ── Derived ────────────────────────────────────────────────────────────────
	let spaceNameMap = $derived.by(() => {
		const map = new SvelteMap<string, string>();
		function flatten(nodes: SpaceNode[]) {
			for (const n of nodes) {
				map.set(n.id, n.name);
				flatten(n.children);
			}
		}
		flatten(appStore.spaces);
		return map;
	});

	let activeSpaceName = $derived(
		appStore.activeSpaceId
			? (spaceNameMap.get(appStore.activeSpaceId) ?? appStore.activeSpaceId)
			: null
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
		}
	});

	$effect(() => {
		if (!query.trim()) {
			results = [];
			debouncedQuery.cancel();
		}
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
		if (e.key === 'Escape' && createMode !== null && open) {
			e.stopImmediatePropagation();
			e.preventDefault();
			createMode = null;
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = true;
		}
	}

	function selectCreateAction(action: CreateAction) {
		createMode = action;
		query = '';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog bind:open shouldFilter={false}>
	{#if createMode === 'space'}
		<CreateSpaceForm
			{activeSpaceName}
			onback={() => (createMode = null)}
			ondone={() => (open = false)}
		/>
	{:else if createMode === 'note'}
		<CreateNoteForm
			{activeSpaceName}
			onback={() => (createMode = null)}
			ondone={() => (open = false)}
		/>
	{:else if createMode === 'todo'}
		<CreateTodoForm
			{activeSpaceName}
			onback={() => (createMode = null)}
			ondone={() => (open = false)}
		/>
	{:else}
		<Command.Input placeholder="Search notes…" bind:value={query} />
		<Command.List>
			{#if query.trim() && results.length === 0 && visibleCreateCommands.length === 0}
				<Command.Empty>No results found.</Command.Empty>
			{/if}
			{#if results.length > 0}
				<Command.Group heading="Notes">
					{#each results as result (result.note_id)}
						<Command.LinkItem href="/spaces/{result.note_id}" onclick={() => (open = false)}>
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
