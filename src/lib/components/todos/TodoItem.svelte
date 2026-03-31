<script lang="ts">
	import { enhance } from '$app/forms';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Calendar } from '@lucide/svelte';
	import type { Todo } from '$lib/server/db/utils';

	interface Props {
		todo: Todo;
	}

	let { todo }: Props = $props();

	let isDone = $state(false);
	let toggleForm = $state<HTMLFormElement | null>(null);

	$effect(() => { isDone = todo.status === 'done'; });

	function formatDate(date: Date | null | undefined): string | null {
		if (!date) return null;
		return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
	}
</script>

<div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
	<form
		bind:this={toggleForm}
		method="POST"
		action="/todos/{todo.id}?/toggle"
		use:enhance={() => ({ update }) => update({ invalidateAll: true })}
	>
		<input type="hidden" name="id" value={todo.id} />
		<Checkbox
			checked={isDone}
			onCheckedChange={(v) => { isDone = !!v; toggleForm?.requestSubmit(); }}
			class="shrink-0"
		/>
	</form>
	<a href="/todos/{todo.id}" class="flex flex-1 items-center gap-3 min-w-0">
		<span class="truncate {isDone ? 'text-muted-foreground line-through' : ''}">{todo.title}</span>
		{#if todo.dueDate}
			<span class="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
				<Calendar class="size-3" />
				{formatDate(todo.dueDate)}
			</span>
		{/if}
	</a>
</div>
