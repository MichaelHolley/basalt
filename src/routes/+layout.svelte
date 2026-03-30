<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import AppSidebar from '$lib/components/navigation/AppSidebar.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	let segments = $derived(
		$page.url.pathname
			.split('/')
			.filter(Boolean)
			.map((seg, i, arr) => ({
				label: seg.charAt(0).toUpperCase() + seg.slice(1),
				href: '/' + arr.slice(0, i + 1).join('/'),
				isLast: i === arr.length - 1,
			}))
	);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ml-1" />
			<div class="mr-auto">
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						{#each segments as seg}
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
