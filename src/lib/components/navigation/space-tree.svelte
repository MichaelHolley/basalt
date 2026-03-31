<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { FolderOpen, FileText, Plus, FilePlus, Pencil, Trash2, Check, X } from '@lucide/svelte';
	import type { SpaceNode, Note } from '$lib/server/db/utils';
	import SpaceTree from './space-tree.svelte';

	interface Props {
		spaces: SpaceNode[];
		notesBySpace?: Record<string, Note[]>;
		depth?: number;
	}

	let { spaces, notesBySpace = {}, depth = 0 }: Props = $props();

	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let addingChildOf = $state<string | null>(null);
	let newChildName = $state('');
	let addingNoteFor = $state<string | null>(null);
	let newNoteName = $state('');
	let renameInput = $state<HTMLInputElement | null>(null);
	let addChildInput = $state<HTMLInputElement | null>(null);
	let addNoteInput = $state<HTMLInputElement | null>(null);

	function startEdit(space: SpaceNode) {
		editingId = space.id;
		editingName = space.name;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}

	function startAddChild(spaceId: string) {
		addingChildOf = spaceId;
		newChildName = '';
	}

	function cancelAddChild() {
		addingChildOf = null;
		newChildName = '';
	}

	function startAddNote(spaceId: string) {
		addingNoteFor = spaceId;
		newNoteName = '';
	}

	function cancelAddNote() {
		addingNoteFor = null;
		newNoteName = '';
	}

	$effect(() => {
		if (editingId) renameInput?.focus();
	});

	$effect(() => {
		if (addingChildOf) addChildInput?.focus();
	});

	$effect(() => {
		if (addingNoteFor) addNoteInput?.focus();
	});
</script>

{#each spaces as space}
	{@const spaceNotes = notesBySpace[space.id] ?? []}
	{@const hasChildren = space.children.length > 0 || spaceNotes.length > 0 || addingNoteFor === space.id || addingChildOf === space.id}
	<Sidebar.MenuItem>
		{#if editingId === space.id}
			<form
				method="POST"
				action="/spaces?/rename"
				use:enhance={() => {
					return ({ update }) => {
						cancelEdit();
						update({ invalidateAll: true });
					};
				}}
				class="flex items-center gap-1 px-2 py-1"
			>
				<input type="hidden" name="id" value={space.id} />
				<Input
					name="name"
					bind:value={editingName}
					bind:ref={renameInput}
					class="h-6 flex-1 text-xs"
				/>
				<Button type="submit" variant="ghost" size="icon" class="size-5 text-primary">
					<Check class="size-3" />
				</Button>
				<Button type="button" variant="ghost" size="icon" class="size-5" onclick={cancelEdit}>
					<X class="size-3" />
				</Button>
			</form>
		{:else}
			<Sidebar.MenuButton class="group/space">
				{#snippet child({ props })}
					<a href="/spaces/{space.id}" {...props}>
						<FolderOpen class="size-4 shrink-0" />
						<span class="flex-1 truncate">{space.name}</span>
						<span class="ml-auto flex items-center gap-0.5 opacity-0 group-hover/space:opacity-100">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="size-5"
								onclick={(e) => { e.preventDefault(); startAddNote(space.id); }}
								title="New note"
							>
								<FilePlus class="size-3" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="size-5"
								onclick={(e) => { e.preventDefault(); startAddChild(space.id); }}
								title="Add subspace"
							>
								<Plus class="size-3" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="size-5"
								onclick={(e) => { e.preventDefault(); startEdit(space); }}
								title="Rename"
							>
								<Pencil class="size-3" />
							</Button>
							<form
								method="POST"
								action="/spaces?/delete"
								use:enhance={() => ({ update }) => update({ invalidateAll: true })}
								class="contents"
							>
								<input type="hidden" name="id" value={space.id} />
								<Button
									type="submit"
									variant="ghost"
									size="icon"
									class="size-5 hover:text-destructive"
									title="Delete"
									onclick={(e) => { if (!confirm(`Delete "${space.name}" and all its contents?`)) e.preventDefault(); }}
								>
									<Trash2 class="size-3" />
								</Button>
							</form>
						</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		{/if}

		{#if hasChildren}
			<Sidebar.MenuSub>
				{#if addingNoteFor === space.id}
					<Sidebar.MenuSubItem>
						<form
							method="POST"
							action="/notes?/create"
							use:enhance={() => {
								return ({ update }) => {
									cancelAddNote();
									update({ invalidateAll: true });
								};
							}}
							class="flex items-center gap-1 px-2 py-1"
						>
							<input type="hidden" name="spaceId" value={space.id} />
							<Input
								name="title"
								bind:value={newNoteName}
								bind:ref={addNoteInput}
								placeholder="Note title"
								class="h-6 flex-1 text-xs"
							/>
							<Button type="submit" variant="ghost" size="icon" class="size-5 text-primary">
								<Check class="size-3" />
							</Button>
							<Button type="button" variant="ghost" size="icon" class="size-5" onclick={cancelAddNote}>
								<X class="size-3" />
							</Button>
						</form>
					</Sidebar.MenuSubItem>
				{/if}

				{#each spaceNotes as note}
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
							<Button type="button" variant="ghost" size="icon" class="size-5" onclick={cancelAddChild}>
								<X class="size-3" />
							</Button>
						</form>
					</Sidebar.MenuSubItem>
				{/if}

				{#if space.children.length > 0}
					<SpaceTree spaces={space.children} {notesBySpace} depth={depth + 1} />
				{/if}
			</Sidebar.MenuSub>
		{/if}
	</Sidebar.MenuItem>
{/each}
