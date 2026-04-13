<script lang="ts">
	import { Search, FileText } from '@lucide/svelte';
	import { Debounced, watch } from 'runed';

	let searchQuery = $state('');
	let searchResults = $state<{ note_id: string; title: string; snippet: string }[]>([]);
	const debouncedQuery = new Debounced(() => searchQuery, 200);

	watch(
		() => debouncedQuery.current,
		() => {
			if (!debouncedQuery.current.trim()) {
				searchResults = [];
				return;
			}
			fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.current)}`)
				.then((res) => res.json())
				.then((data) => (searchResults = data.results ?? []));
		},
		{ lazy: true }
	);

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
	}
</script>

<div class="px-2 pt-2 group-data-[collapsible=icon]:hidden">
	<div class="relative">
		<Search class="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
		<input
			type="search"
			placeholder="Search notes…"
			bind:value={searchQuery}
			class="h-7 w-full rounded-md border border-input bg-background pr-2 pl-6 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1"
		/>
	</div>
	{#if searchResults.length > 0}
		<ul class="mt-1 flex flex-col rounded-md border border-border bg-popover py-1 shadow-md">
			{#each searchResults as result (result.note_id)}
				<li>
					<a
						href="/spaces/{result.note_id}"
						onclick={clearSearch}
						class="flex flex-col gap-0.5 px-2 py-1.5 hover:bg-accent"
					>
						<span class="flex items-center gap-1.5 text-xs font-medium">
							<FileText class="size-3 shrink-0 text-muted-foreground" />
							{result.title}
						</span>
						{#if result.snippet}
							<span class="line-clamp-1 pl-4.5 text-[10px] text-muted-foreground">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html result.snippet}
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else if searchQuery.trim() && searchResults.length === 0}
		<p class="mt-1 px-2 py-1.5 text-xs text-muted-foreground italic">No results.</p>
	{/if}
</div>
