<script lang="ts">
	import { SvelteMap, SvelteDate } from 'svelte/reactivity';
	import { FileText, SquareCheckBig } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import type { PageData } from './$types';
	import type { SpaceNode } from '$lib/server/db/types';

	// ── Props ──────────────────────────────────────────────────────────────────
	let { data }: { data: PageData } = $props();

	// ── Derived ────────────────────────────────────────────────────────────────
	let spaceNameMap = $derived(flattenSpaces(data.spaces ?? []));

	// ── Functions ──────────────────────────────────────────────────────────────
	function flattenSpaces(
		nodes: SpaceNode[],
		map: SvelteMap<string, string> = new SvelteMap()
	): SvelteMap<string, string> {
		for (const node of nodes) {
			map.set(node.id, node.name);
			flattenSpaces(node.children, map);
		}
		return map;
	}

	function formatRelativeTime(date: Date): string {
		const diffMs = Date.now() - new Date(date).getTime();
		const diffMins = Math.floor(diffMs / 60_000);
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 30) return `${diffDays}d ago`;
		return `${Math.floor(diffDays / 30)}mo ago`;
	}

	type BadgeKind = 'overdue' | 'today' | 'upcoming' | null;

	function getDueBadge(dueDate: Date | null | undefined): BadgeKind {
		if (!dueDate) return null;
		const due = new Date(dueDate);
		const todayStart = new SvelteDate();
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date(todayStart.getTime() + 86_400_000);
		if (due < todayStart) return 'overdue';
		if (due < todayEnd) return 'today';
		return 'upcoming';
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<!-- ── Recent Notes ──────────────────────────────────────────────────── -->
	<section>
		<div class="mb-3 flex items-center gap-2">
			<FileText class="size-4 text-muted-foreground" />
			<h2 class="text-sm font-semibold">Recent Notes</h2>
		</div>

		{#if data.recentNotes.length === 0}
			<p class="text-sm text-muted-foreground italic">No notes yet.</p>
		{:else}
			<ul class="flex flex-col gap-0.5">
				{#each data.recentNotes as note (note.id)}
					{@const spaceName = spaceNameMap.get(note.spaceId) ?? note.spaceId}
					{@const href = `/spaces/${note.id}`}
					<li>
						<a
							{href}
							class="flex items-start justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
						>
							<div class="min-w-0">
								<p class="truncate text-sm">{note.title}</p>
								<p class="truncate text-xs text-muted-foreground">{spaceName}</p>
							</div>
							<span class="ml-3 shrink-0 text-xs text-muted-foreground tabular-nums">
								{formatRelativeTime(note.updatedAt)}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- ── Open Todos ────────────────────────────────────────────────────── -->
	<section>
		<div class="mb-3 flex items-center gap-2">
			<SquareCheckBig class="size-4 text-muted-foreground" />
			<h2 class="text-sm font-semibold">Open Todos</h2>
		</div>

		{#if data.openTodos.length === 0}
			<p class="text-sm text-muted-foreground italic">Nothing open — great work!</p>
		{:else}
			<ul class="flex flex-col gap-0.5">
				{#each data.openTodos as todo (todo.id)}
					{@const spaceName = spaceNameMap.get(todo.spaceId) ?? todo.spaceId}
					{@const href = `/spaces/${todo.spaceId}/${todo.id}`}
					{@const badge = getDueBadge(todo.dueDate)}
					<li>
						<a
							{href}
							class="flex items-start justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
						>
							<div class="min-w-0">
								<p class="truncate text-sm">{todo.title}</p>
								<p class="truncate text-xs text-muted-foreground">{spaceName}</p>
							</div>
							{#if badge}
								<span
									class={cn(
										'ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
										badge === 'overdue' && 'bg-destructive/10 text-destructive',
										badge === 'today' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
										badge === 'upcoming' && 'text-muted-foreground'
									)}
								>
									{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
										new Date(todo.dueDate!)
									)}
								</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
