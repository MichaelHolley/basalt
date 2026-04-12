<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Folder, FolderOpen, FolderPlus, FileText, Trash2, Check, X } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { SpaceNode, Note } from '$lib/server/db/utils';
	import SpaceTree from '$lib/components/navigation/SpaceTree.svelte';

	interface Props {
		spaces: SpaceNode[];
		notesBySpace?: Record<string, Note[]>;
		depth?: number;
	}

	let { spaces, notesBySpace = {}, depth = 0 }: Props = $props();

	let collapsedSpaces = new SvelteSet<string>();
	let addingChildOf = $state<string | null>(null);
	let newChildName = $state('');
	let addChildInput = $state<HTMLInputElement | null>(null);

	function toggleCollapse(spaceId: string) {
		if (collapsedSpaces.has(spaceId)) collapsedSpaces.delete(spaceId);
		else collapsedSpaces.add(spaceId);
	}

	function startAddChild(spaceId: string) {
		addingChildOf = spaceId;
		newChildName = '';
	}

	function cancelAddChild() {
		addingChildOf = null;
		newChildName = '';
	}

	$effect(() => {
		if (addingChildOf) addChildInput?.focus();
	});
</script>

{#each spaces as space (space.id)}
	{@const spaceNotes = notesBySpace[space.id] ?? []}
	{@const hasChildren =
		space.children.length > 0 || spaceNotes.length > 0 || addingChildOf === space.id}
	<Sidebar.MenuItem>
		<div
			class="group/space relative flex h-8 w-full items-center gap-2 overflow-hidden rounded-md pl-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			data-sidebar="menu-button"
		>
			<button
				type="button"
				class="flex shrink-0 cursor-pointer items-center justify-center py-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
				onclick={() => toggleCollapse(space.id)}
				title={collapsedSpaces.has(space.id) ? 'Expand' : 'Collapse'}
			>
				{#if collapsedSpaces.has(space.id)}
					<Folder class="size-4 group-data-[collapsible=icon]:hidden" />
				{:else}
					<FolderOpen class="size-4 group-data-[collapsible=icon]:hidden" />
				{/if}
				<span
					class="hidden size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] leading-none font-semibold text-muted-foreground group-data-[collapsible=icon]:flex"
				>
					{space.name.slice(0, 2).toUpperCase()}
				</span>
			</button>
			<a
				href="/spaces/{space.id}"
				class="flex-1 truncate py-2 group-data-[collapsible=icon]:hidden"
			>
				{space.name}
			</a>
			<span
				class="ml-auto flex items-center gap-0.5 opacity-0 group-hover/space:opacity-100 group-data-[collapsible=icon]:hidden"
			>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="size-5"
					onclick={() => startAddChild(space.id)}
					title="Add subspace"
				>
					<FolderPlus class="size-3" />
				</Button>
				<form
					method="POST"
					action="/spaces?/delete"
					use:enhance={() =>
						({ update }) =>
							update({ invalidateAll: true })}
					class="contents"
				>
					<input type="hidden" name="id" value={space.id} />
					<Button
						type="submit"
						variant="ghost"
						size="icon"
						class="size-5 hover:text-destructive"
						title="Delete"
						onclick={(e) => {
							e.stopPropagation();
							if (!confirm(`Delete "${space.name}" and all its contents?`)) e.preventDefault();
						}}
					>
						<Trash2 class="size-3" />
					</Button>
				</form>
			</span>
		</div>

		{#if hasChildren && !collapsedSpaces.has(space.id)}
			<div transition:slide={{ duration: 150 }}>
				<Sidebar.MenuSub class="mr-0 ml-1.5 pr-0 pl-1.5">
					{#each spaceNotes as note (note.id)}
						<Sidebar.MenuSubItem>
							<Sidebar.MenuSubButton>
								{#snippet child({ props })}
									<a href="/spaces/{note.id.replace(/\.md$/, '')}" {...props}>
										<FileText class="size-3.5 shrink-0" />
										<span class="truncate">{note.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuSubButton>
						</Sidebar.MenuSubItem>
					{/each}

					{#if addingChildOf === space.id}
						<Sidebar.MenuSubItem>
							<form
								method="POST"
								action="/spaces?/create"
								use:enhance={() => {
									return ({ update }) => {
										cancelAddChild();
										update({ invalidateAll: true });
									};
								}}
								class="flex items-center gap-1 px-2 py-1"
								style="padding-left: {(depth + 1) * 12 + 8}px"
							>
								<input type="hidden" name="parentId" value={space.id} />
								<Input
									name="name"
									bind:value={newChildName}
									bind:ref={addChildInput}
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
									onclick={cancelAddChild}
								>
									<X class="size-3" />
								</Button>
							</form>
						</Sidebar.MenuSubItem>
					{/if}

					{#if space.children.length > 0}
						<SpaceTree spaces={space.children} {notesBySpace} depth={depth + 1} />
					{/if}
				</Sidebar.MenuSub>
			</div>
		{/if}
	</Sidebar.MenuItem>
{/each}
