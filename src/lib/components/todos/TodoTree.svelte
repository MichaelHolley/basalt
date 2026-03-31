<script lang="ts">
	import type { TodoNode } from '$lib/server/db/utils';
	import TodoItem from './TodoItem.svelte';
	import TodoTree from './TodoTree.svelte';

	interface Props {
		todos: TodoNode[];
		depth?: number;
	}

	let { todos, depth = 0 }: Props = $props();
</script>

{#each todos as todo}
	<li style="padding-left: {depth * 1.25}rem">
		<TodoItem {todo} />
		{#if todo.children.length > 0}
			<ul class="flex flex-col">
				<TodoTree todos={todo.children} depth={depth + 1} />
			</ul>
		{/if}
	</li>
{/each}
