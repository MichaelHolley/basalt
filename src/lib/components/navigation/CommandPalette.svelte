<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { FileText } from '@lucide/svelte';
	import { Debounced, watch } from 'runed';

	// ── State ──────────────────────────────────────────────────────────────────
	let open = $state(false);
	let query = $state('');
	let results = $state<{ note_id: string; title: string; snippet: string }[]>([]);
	const debouncedQuery = new Debounced(() => query, 200);

	// ── Effects ────────────────────────────────────────────────────────────────
	$effect(() => {
		if (!open) {
			query = '';
			results = [];
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
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = true;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog bind:open shouldFilter={false}>
	<Command.Input placeholder="Search notes…" bind:value={query} />
	<Command.List>
		{#if query.trim() && results.length === 0}
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
	</Command.List>
</Command.Dialog>
