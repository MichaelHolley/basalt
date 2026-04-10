<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { FileText, ListTodo, FolderPlus, ArrowLeft } from '@lucide/svelte';
	import { Debounced, watch } from 'runed';

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
	let nameValue = $state('');
	let nameInputEl = $state<HTMLInputElement | null>(null);
	const debouncedQuery = new Debounced(() => query, 200);

	const createCommands: CreateCommand[] = [
		{ action: 'note', label: 'New Note', icon: FileText },
		{ action: 'todo', label: 'New Todo', icon: ListTodo },
		{ action: 'space', label: 'New Space', icon: FolderPlus }
	];

	// ── Derived ────────────────────────────────────────────────────────────────
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

	function createLabel(action: CreateAction): string {
		if (action === 'note') return 'New Note';
		if (action === 'todo') return 'New Todo';
		return 'New Space';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog bind:open shouldFilter={false}>
	{#if createMode}
		<div class="flex flex-col">
			<div class="flex items-center gap-2 border-b p-1 pb-0 pb-1">
				<button
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
				<input
					bind:this={nameInputEl}
					bind:value={nameValue}
					class="h-8 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
					placeholder="Enter name…"
				/>
			</div>
			<div class="px-3 py-4 text-center text-xs text-muted-foreground">
				Press <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Enter</kbd> to create ·
				<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
			</div>
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
