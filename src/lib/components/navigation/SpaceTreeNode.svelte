<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { Folder, FolderOpen, FolderPlus, FileText, Trash2 } from '@lucide/svelte';
	import type { SpaceNode, Note } from '$lib/server/db/tree';
	import CreateChildSpaceForm from '$lib/components/navigation/CreateChildSpaceForm.svelte';
	import SpaceTree from '$lib/components/navigation/SpaceTree.svelte';

	interface Props {
		space: SpaceNode;
		notes: Note[];
		depth: number;
	}

	let { space, notes, depth }: Props = $props();

	let collapsed = $state(false);
	let addingChild = $state(false);

	let hasChildren = $derived(space.children.length > 0 || notes.length > 0 || addingChild);
</script>

<Sidebar.MenuItem>
	<div
		class="group/space relative flex h-8 w-full items-center gap-2 overflow-hidden rounded-md pl-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		data-sidebar="menu-button"
	>
		<button
			type="button"
			class="flex shrink-0 cursor-pointer items-center justify-center py-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
			onclick={() => (collapsed = !collapsed)}
			title={collapsed ? 'Expand' : 'Collapse'}
		>
			{#if collapsed}
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
		<a href="/spaces/{space.id}" class="flex-1 truncate py-2 group-data-[collapsible=icon]:hidden">
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
				onclick={() => (addingChild = true)}
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

	{#if hasChildren && !collapsed}
		<div transition:slide={{ duration: 150 }}>
			<Sidebar.MenuSub class="mr-0 ml-1.5 pr-0 pl-1.5">
				{#each notes as note (note.id)}
					<Sidebar.MenuSubItem>
						<Sidebar.MenuSubButton>
							{#snippet child({ props })}
								<a href="/spaces/{note.id}" {...props}>
									<FileText class="size-3.5 shrink-0" />
									<span class="truncate">{note.title}</span>
								</a>
							{/snippet}
						</Sidebar.MenuSubButton>
					</Sidebar.MenuSubItem>
				{/each}

				{#if addingChild}
					<CreateChildSpaceForm
						parentId={space.id}
						oncreated={() => (addingChild = false)}
						oncancelled={() => (addingChild = false)}
					/>
				{/if}

				{#if space.children.length > 0}
					<SpaceTree spaces={space.children} depth={depth + 1} />
				{/if}
			</Sidebar.MenuSub>
		</div>
	{/if}
</Sidebar.MenuItem>
