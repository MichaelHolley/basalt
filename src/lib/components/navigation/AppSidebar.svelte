<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { House, Settings, FolderPlus } from '@lucide/svelte';
	import SpaceTree from '$lib/components/navigation/SpaceTree.svelte';
	import SidebarSearch from '$lib/components/navigation/SidebarSearch.svelte';
	import CreateSpaceForm from '$lib/components/navigation/CreateSpaceForm.svelte';
	import { appStore } from '@/stores/app.svelte';

	let addingSpace = $state(false);
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
		<SidebarSearch />

		<Sidebar.Group>
			<Sidebar.GroupLabel class="flex items-center justify-between pr-1">
				Spaces
				<Button
					variant="ghost"
					size="icon"
					class="size-5"
					onclick={() => (addingSpace = true)}
					title="New space"
				>
					<FolderPlus class="size-3" />
				</Button>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#if addingSpace}
						<Sidebar.MenuItem>
							<CreateSpaceForm
								oncreated={() => (addingSpace = false)}
								oncancelled={() => (addingSpace = false)}
							/>
						</Sidebar.MenuItem>
					{/if}
					<SpaceTree spaces={appStore.spaces} />
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
