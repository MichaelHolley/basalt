<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { House, Settings, Plus, Check, X } from '@lucide/svelte';
	import SpaceTree from './space-tree.svelte';
	import type { SpaceNode } from '$lib/server/db/utils';

	interface Props {
		spaces?: SpaceNode[];
	}

	let { spaces = [] }: Props = $props();

	let addingSpace = $state(false);
	let newSpaceName = $state('');

	function startAdd() {
		addingSpace = true;
		newSpaceName = '';
	}

	function cancelAdd() {
		addingSpace = false;
		newSpaceName = '';
	}

	function focusInput(node: HTMLInputElement) {
		node.focus();
	}
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<House class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">Basalt</span>
								<span class="text-muted-foreground text-xs">Notes & Todos</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel class="flex items-center justify-between pr-1">
				Spaces
				<button
					type="button"
					onclick={startAdd}
					class="hover:text-foreground text-muted-foreground rounded p-0.5 transition-colors"
					title="New space"
				>
					<Plus class="size-3" />
				</button>
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
								<input
									name="name"
									bind:value={newSpaceName}
									placeholder="Space name"
									class="border-input h-6 flex-1 rounded border px-1 text-xs"
									use:focusInput
								/>
								<button type="submit" class="text-primary hover:text-primary/80"
									><Check class="size-3" /></button
								>
								<button
									type="button"
									onclick={cancelAdd}
									class="text-muted-foreground hover:text-foreground"
									><X class="size-3" /></button
								>
							</form>
						</Sidebar.MenuItem>
					{/if}
					<SpaceTree {spaces} />
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
