<script lang="ts">
	import CreateChildTodoForm from '$lib/components/todos/CreateChildTodoForm.svelte';
	import TodoChildList from '$lib/components/todos/TodoChildList.svelte';
	import TodoDueDatePicker from '$lib/components/todos/TodoDueDatePicker.svelte';
	import TodoItem from '$lib/components/todos/TodoItem.svelte';
	import TodoTitleForm from '$lib/components/todos/TodoTitleForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { todos } from '$lib/server/db/schema';
	import type { Todo, TodoWithDepth } from '$lib/server/db/tree';
	import { Plus } from '@lucide/svelte';

	interface Props {
		todo: typeof todos.$inferSelect;
		parent: Todo | null;
		children: TodoWithDepth[];
		depth: number;
		maxDepth: number;
	}

	let { todo, parent, children, depth, maxDepth }: Props = $props();

	let addingChild = $state(false);

	let atMaxDepth = $derived(depth >= maxDepth);
</script>

<div class="flex max-w-2xl flex-1 flex-col gap-6 overflow-y-auto p-4">
	<TodoTitleForm {todo} />

	<TodoDueDatePicker {todo} />

	{#if parent}
		<div class="flex flex-col gap-1">
			<h2 class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Parent</h2>
			<ul class="flex flex-col">
				<li>
					<TodoItem todo={parent} />
				</li>
			</ul>
		</div>
	{/if}

	<div class="flex flex-col gap-1">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
				Subtasks{#if atMaxDepth}&nbsp;<span class="font-normal text-muted-foreground/60 normal-case"
						>(max depth reached)</span
					>{/if}
			</h2>
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				disabled={atMaxDepth}
				onclick={() => {
					if (!atMaxDepth) addingChild = true;
				}}
				title={atMaxDepth ? 'Subtasks can only be nested 3 levels deep' : 'Add subtask'}
			>
				<Plus class="size-3.5" />
			</Button>
		</div>

		{#if addingChild}
			<CreateChildTodoForm parentId={todo.id} oncancel={() => (addingChild = false)} />
		{/if}

		{#if children.length === 0 && !addingChild}
			<p class="text-sm text-muted-foreground italic">No subtasks.</p>
		{/if}

		<TodoChildList {children} />
	</div>
</div>
