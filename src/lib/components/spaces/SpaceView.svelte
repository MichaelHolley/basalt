<script lang="ts">
	import SpaceCreateNoteForm from '$lib/components/spaces/SpaceCreateNoteForm.svelte';
	import SpaceCreateTodoForm from '$lib/components/spaces/SpaceCreateTodoForm.svelte';
	import SpaceNameForm from '$lib/components/spaces/SpaceNameForm.svelte';
	import TodoTree from '$lib/components/todos/TodoTree.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { TodoNode, Space, Note } from '$lib/server/db/types';
	import { FileText, Plus } from '@lucide/svelte';

	interface Props {
		space: Space;
		todos: TodoNode[];
		notes: Note[];
	}

	let { space, todos, notes }: Props = $props();

	let addingTodo = $state(false);
	let addingNote = $state(false);
</script>

<div class="flex flex-col gap-6">
	<div>
		<SpaceNameForm {space} />
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Todos</h2>
			<Button
				variant="ghost"
				size="icon"
				class="size-5"
				onclick={() => (addingTodo = true)}
				title="New todo"
			>
				<Plus class="size-3" />
			</Button>
		</div>
		{#if addingTodo}
			<SpaceCreateTodoForm spaceId={space.id} oncancel={() => (addingTodo = false)} />
		{/if}
		{#if todos.length === 0 && !addingTodo}
			<p class="text-sm text-muted-foreground italic">No todos yet.</p>
		{:else if todos.length > 0}
			<ul class="flex flex-col gap-0.5">
				<TodoTree {todos} />
			</ul>
		{/if}
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<h2 class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Notes</h2>
			<Button
				variant="ghost"
				size="icon"
				class="size-5"
				onclick={() => {
					addingNote = true;
				}}
				title="New note"
			>
				<Plus class="size-3" />
			</Button>
		</div>
		{#if addingNote}
			<SpaceCreateNoteForm spaceId={space.id} oncancel={() => (addingNote = false)} />
		{/if}
		{#if notes.length === 0 && !addingNote}
			<p class="text-sm text-muted-foreground italic">No notes yet.</p>
		{:else if notes.length > 0}
			<ul class="flex flex-col gap-1">
				{#each notes as note (note.id)}
					<li>
						<a
							href="/spaces/{note.id}"
							class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
						>
							<FileText class="size-4 shrink-0 text-muted-foreground" />
							{note.title}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
