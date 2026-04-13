<script lang="ts">
	import { enhance } from '$app/forms';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { Todo } from '$lib/server/db/types';
	import { cn } from '$lib/utils';
	import { Calendar } from '@lucide/svelte';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		todo: Todo;
	}

	let { todo }: Props = $props();

	let isDone = $state(false);
	let toggleForm = $state<HTMLFormElement | null>(null);

	$effect(() => {
		isDone = todo.status === 'done';
	});

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

	function formatDate(date: Date | null | undefined): string | null {
		if (!date) return null;
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
			new Date(date)
		);
	}
</script>

<div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
	<form
		bind:this={toggleForm}
		method="POST"
		action="/spaces/{todo.spaceId}/{todo.id}?/toggle"
		use:enhance={() =>
			({ update }) =>
				update({ invalidateAll: true })}
	>
		<input type="hidden" name="id" value={todo.id} />
		<Checkbox
			checked={isDone}
			onCheckedChange={(v) => {
				isDone = !!v;
				toggleForm?.requestSubmit();
			}}
			class="shrink-0"
		/>
	</form>
	<a href="/spaces/{todo.spaceId}/{todo.id}" class="flex min-w-0 flex-1 items-center gap-3">
		<span class="truncate {isDone ? 'text-muted-foreground line-through' : ''}">{todo.title}</span>
		{#if todo.dueDate}
			{@const badge = getDueBadge(todo.dueDate)}
			<span
				class={cn(
					'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs',
					badge === 'overdue' && 'bg-destructive/10 text-destructive',
					badge === 'today' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
					badge === 'upcoming' && 'text-muted-foreground'
				)}
			>
				<Calendar class="size-3" />
				{formatDate(todo.dueDate)}
			</span>
		{/if}
	</a>
</div>
