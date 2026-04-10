<script lang="ts">
	import type { PageData } from './$types';
	import SpaceView from '$lib/components/spaces/SpaceView.svelte';
	import NoteView from '$lib/components/notes/NoteView.svelte';
	import TodoView from '$lib/components/todos/TodoView.svelte';
	import RelationsPanel from '$lib/components/shared/RelationsPanel.svelte';

	let { data }: { data: PageData } = $props();
</script>

{#if data.type === 'space'}
	<SpaceView space={data.space} todos={data.todos} notes={data.notes} />
{:else if data.type === 'note'}
	<div class="flex h-full">
		<NoteView note={data.note} content={data.content} />
		<div class="w-56 shrink-0 overflow-y-auto border-l px-3 py-3">
			<RelationsPanel
				currentType="note"
				currentId={data.note.id}
				relatedItems={data.relatedItems}
				allNotes={data.allNotes}
				allTodos={data.allTodos}
			/>
		</div>
	</div>
{:else if data.type === 'todo'}
	{@const todoData = data as Extract<typeof data, { type: 'todo' }>}
	<div class="flex h-full">
		<TodoView
			todo={todoData.todo}
			children={todoData.children}
			depth={todoData.depth}
			maxDepth={todoData.maxDepth}
		/>
		<div class="w-56 shrink-0 overflow-y-auto border-l px-3 py-3">
			<RelationsPanel
				currentType="todo"
				currentId={todoData.todo.id}
				relatedItems={todoData.relatedItems}
				allNotes={todoData.allNotes}
				allTodos={todoData.allTodos}
			/>
		</div>
	</div>
{/if}
