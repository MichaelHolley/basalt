<script lang="ts">
	import { enhance } from '$app/forms';
	import TodoItem from '$lib/components/todos/TodoItem.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { TodoWithDepth } from '$lib/server/db/tree';
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		children: TodoWithDepth[];
	}

	let { children }: Props = $props();
</script>

{#each children as child (child.id)}
	<div class="flex items-center" style="padding-left: {(child.depth - 1) * 1.25}rem">
		<TodoItem todo={child} />
		<form
			method="POST"
			action="?/deleteTodo"
			use:enhance={() =>
				({ update }) =>
					update({ invalidateAll: true })}
		>
			<input type="hidden" name="id" value={child.id} />
			<Button
				type="submit"
				variant="ghost"
				size="icon"
				class="size-5 hover:text-destructive"
				onclick={(e) => {
					if (!confirm(`Delete "${child.title}"?`)) e.preventDefault();
				}}
			>
				<Trash2 class="size-3" />
			</Button>
		</form>
	</div>
{/each}
