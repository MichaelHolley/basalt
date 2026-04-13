<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import type { todos } from '$lib/server/db/schema';
	import { Calendar, X } from '@lucide/svelte';

	interface Props {
		todo: typeof todos.$inferSelect;
	}

	let { todo }: Props = $props();
</script>

<form
	method="POST"
	action="?/setDueDate"
	use:enhance={() =>
		({ update }) =>
			update({ invalidateAll: true })}
	class="flex items-center gap-2"
>
	<input type="hidden" name="id" value={todo.id} />
	<Calendar class="size-4 shrink-0 text-muted-foreground" />
	<input
		type="date"
		name="dueDate"
		value={todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''}
		class="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
		onchange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()}
	/>
	{#if todo.dueDate}
		<Button
			type="submit"
			variant="ghost"
			size="icon"
			class="size-6"
			title="Clear due date"
			onclick={(e) => {
				e.preventDefault();
				const form = (e.target as HTMLElement).closest('form') as HTMLFormElement;
				const input = form?.querySelector('input[name="dueDate"]') as HTMLInputElement;
				if (input) {
					input.value = '';
					form.requestSubmit();
				}
			}}
		>
			<X class="size-3" />
		</Button>
	{/if}
</form>
