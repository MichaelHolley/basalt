<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { SvelteMap } from 'svelte/reactivity';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import AppSidebar from '$lib/components/navigation/AppSidebar.svelte';
	import { page } from '$app/stores';

	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import type { SpaceNode } from '$lib/server/db/utils';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// Flatten the space tree into a id → name map for breadcrumb label resolution
	function flattenSpaces(nodes: SpaceNode[], map: SvelteMap<string, string> = new SvelteMap()) {
		for (const node of nodes) {
			map.set(node.id, node.name);
			flattenSpaces(node.children, map);
		}
		return map;
	}

	let spaceNameMap = $derived(flattenSpaces(data.spaces ?? []));

	let breadcrumbSegments = $derived(() => {
		const parts = $page.url.pathname.split('/').filter(Boolean);

		// Only apply smart breadcrumb for /spaces/... routes
		if (parts[0] !== 'spaces') {
			return parts.map((seg, i, arr) => ({
				label: seg.charAt(0).toUpperCase() + seg.slice(1),
				href: '/' + arr.slice(0, i + 1).join('/'),
				isLast: i === arr.length - 1
			}));
		}

		// Drop the 'spaces' prefix — breadcrumb starts from the space name
		const spaceParts = parts.slice(1);
		if (spaceParts.length === 0) return [];

		const pd = $page.data as Record<string, unknown>;

		return spaceParts.map((seg, i, arr) => {
			const isLast = i === arr.length - 1;
			const pathSoFar = arr.slice(0, i + 1).join('/');
			const href = '/spaces/' + pathSoFar;

			let label: string;
			if (isLast && pd.type === 'space') {
				label = (pd.space as { name?: string } | undefined)?.name ?? seg;
			} else if (isLast && pd.type === 'note') {
				label = (pd.note as { title?: string } | undefined)?.title ?? seg;
			} else if (isLast && pd.type === 'todo') {
				label = (pd.todo as { title?: string } | undefined)?.title ?? seg;
			} else {
				// Intermediate segment — always a space
				label = spaceNameMap.get(pathSoFar) ?? seg.charAt(0).toUpperCase() + seg.slice(1);
			}

			return { label, href, isLast };
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Sidebar.Provider>
	<AppSidebar spaces={data.spaces ?? []} notesBySpace={data.notesBySpace ?? {}} />
	<Sidebar.Inset>
		<header class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ml-1" />
			<div class="mr-auto">
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						{#each breadcrumbSegments() as seg (seg.href)}
							<Breadcrumb.Separator />
							<Breadcrumb.Item>
								{#if seg.isLast}
									<Breadcrumb.Page>{seg.label}</Breadcrumb.Page>
								{:else}
									<Breadcrumb.Link href={seg.href}>{seg.label}</Breadcrumb.Link>
								{/if}
							</Breadcrumb.Item>
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<main class="flex flex-1 flex-col gap-4 p-4">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
