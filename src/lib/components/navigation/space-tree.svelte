<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { FolderOpen, Plus, Pencil, Trash2, Check, X } from '@lucide/svelte';
	import type { SpaceNode } from '$lib/server/db/utils';
	import SpaceTree from './space-tree.svelte';

	interface Props {
		spaces: SpaceNode[];
		depth?: number;
	}

	let { spaces, depth = 0 }: Props = $props();

	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let addingChildOf = $state<string | null>(null);
	let newChildName = $state('');

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

	function focusInput(node: HTMLInputElement) {
		node.focus();
	}
</script>

{#each spaces as space}
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
				<input
					name="name"
					bind:value={editingName}
					class="border-input h-6 flex-1 rounded border px-1 text-xs"
					use:focusInput
				/>
				<button type="submit" class="text-primary hover:text-primary/80"><Check class="size-3" /></button>
				<button type="button" onclick={cancelEdit} class="text-muted-foreground hover:text-foreground"><X class="size-3" /></button>
			</form>
		{:else}
			<Sidebar.MenuButton class="group/space">
				{#snippet child({ props })}
					<a href="/spaces/{space.id}" {...props}>
						<FolderOpen class="size-4 shrink-0" />
						<span class="flex-1 truncate">{space.name}</span>
						<span class="ml-auto flex items-center gap-0.5 opacity-0 group-hover/space:opacity-100">
							<button
								type="button"
								onclick={(e) => { e.preventDefault(); startAddChild(space.id); }}
								class="hover:text-foreground text-muted-foreground rounded p-0.5"
								title="Add subspace"
							>
								<Plus class="size-3" />
							</button>
							<button
								type="button"
								onclick={(e) => { e.preventDefault(); startEdit(space); }}
								class="hover:text-foreground text-muted-foreground rounded p-0.5"
								title="Rename"
							>
								<Pencil class="size-3" />
							</button>
							<form
								method="POST"
								action="/spaces?/delete"
								use:enhance={() => ({ update }) => update({ invalidateAll: true })}
								class="contents"
							>
								<input type="hidden" name="id" value={space.id} />
								<button
									type="submit"
									class="hover:text-destructive text-muted-foreground rounded p-0.5"
									title="Delete"
									onclick={(e) => { if (!confirm(`Delete "${space.name}" and all its contents?`)) e.preventDefault(); }}
								>
									<Trash2 class="size-3" />
								</button>
							</form>
						</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		{/if}

		{#if addingChildOf === space.id}
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
				<input
					name="name"
					bind:value={newChildName}
					placeholder="Space name"
					class="border-input h-6 flex-1 rounded border px-1 text-xs"
					use:focusInput
				/>
				<button type="submit" class="text-primary hover:text-primary/80"><Check class="size-3" /></button>
				<button type="button" onclick={cancelAddChild} class="text-muted-foreground hover:text-foreground"><X class="size-3" /></button>
			</form>
		{/if}

		{#if space.children.length > 0}
			<Sidebar.MenuSub>
				<SpaceTree spaces={space.children} depth={depth + 1} />
			</Sidebar.MenuSub>
		{/if}
	</Sidebar.MenuItem>
{/each}
