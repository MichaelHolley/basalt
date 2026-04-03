<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { House, Settings, Plus, Check, X, Search, FileText } from '@lucide/svelte';
	import SpaceTree from '$lib/components/navigation/SpaceTree.svelte';
	import type { SpaceNode, Note } from '$lib/server/db/utils';

	interface Props {
		spaces?: SpaceNode[];
		notesBySpace?: Record<string, Note[]>;
	}

	let { spaces = [], notesBySpace = {} }: Props = $props();

	let addingSpace = $state(false);
	let newSpaceName = $state('');
	let newSpaceInput = $state<HTMLInputElement | null>(null);

	// Search
	let searchQuery = $state('');
	let searchResults = $state<{ note_id: string; title: string; snippet: string }[]>([]);
	let searchDebounce: ReturnType<typeof setTimeout> | null = null;

	function handleSearch() {
		if (searchDebounce) clearTimeout(searchDebounce);
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}
		searchDebounce = setTimeout(async () => {
			const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
			const data = await res.json();
			searchResults = data.results ?? [];
		}, 200);
	}

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
	}

	function startAdd() {
		addingSpace = true;
		newSpaceName = '';
	}

	function cancelAdd() {
		addingSpace = false;
		newSpaceName = '';
	}

	$effect(() => {
		if (addingSpace) newSpaceInput?.focus();
	});
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
							>
								<House class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">Basalt</span>
								<span class="text-xs text-muted-foreground">Notes & Todos</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<!-- Search — hidden in collapsed icon mode -->
		<div class="px-2 pt-2 group-data-[collapsible=icon]:hidden">
			<div class="relative">
				<Search class="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
				<input
					type="search"
					placeholder="Search notes…"
					bind:value={searchQuery}
					oninput={handleSearch}
					class="h-7 w-full rounded-md border border-input bg-background pr-2 pl-6 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1"
				/>
			</div>
			{#if searchResults.length > 0}
				<ul class="mt-1 flex flex-col rounded-md border border-border bg-popover py-1 shadow-md">
					{#each searchResults as result}
						<li>
							<a
								href="/spaces/{result.note_id.replace(/\.md$/, '')}"
								onclick={clearSearch}
								class="flex flex-col gap-0.5 px-2 py-1.5 hover:bg-accent"
							>
								<span class="flex items-center gap-1.5 text-xs font-medium">
									<FileText class="size-3 shrink-0 text-muted-foreground" />
									{result.title}
								</span>
								{#if result.snippet}
									<span class="line-clamp-1 pl-4.5 text-[10px] text-muted-foreground">
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

		<Sidebar.Group>
			<Sidebar.GroupLabel class="flex items-center justify-between pr-1">
				Spaces
				<Button variant="ghost" size="icon" class="size-5" onclick={startAdd} title="New space">
					<Plus class="size-3" />
				</Button>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#if addingSpace}
						<Sidebar.MenuItem>
							<form
								method="POST"
								action="/spaces?/create"
								use:enhance={() => {
									return ({ update }) => {
										cancelAdd();
										update({ invalidateAll: true });
									};
								}}
								class="flex items-center gap-1 px-2 py-1"
							>
								<Input
									name="name"
									bind:value={newSpaceName}
									bind:ref={newSpaceInput}
									placeholder="Space name"
									class="h-6 flex-1 text-xs"
								/>
								<Button type="submit" variant="ghost" size="icon" class="size-5 text-primary">
									<Check class="size-3" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-5"
									onclick={cancelAdd}
								>
									<X class="size-3" />
								</Button>
							</form>
						</Sidebar.MenuItem>
					{/if}
					<SpaceTree {spaces} {notesBySpace} />
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href="/settings" {...props}>
							<Settings />
							<span>Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
