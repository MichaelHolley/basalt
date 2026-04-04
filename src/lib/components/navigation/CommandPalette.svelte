<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { FileText } from '@lucide/svelte';

	// ── State ──────────────────────────────────────────────────────────────────
	let open = $state(false);
	let query = $state('');
	let results = $state<{ note_id: string; title: string; snippet: string }[]>([]);

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
			return;
		}
		const timer = setTimeout(async () => {
			const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			const data = await res.json();
			results = data.results ?? [];
		}, 200);
		return () => clearTimeout(timer);
	});

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
						<FileText />
						<span class="truncate">{result.title}</span>
						{#if result.snippet}
							<span class="ml-auto truncate text-xs text-muted-foreground">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html result.snippet}
							</span>
						{/if}
					</Command.LinkItem>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
