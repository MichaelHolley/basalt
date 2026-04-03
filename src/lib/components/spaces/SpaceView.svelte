<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { FileText, Plus, Check, X } from '@lucide/svelte';
	import TodoTree from '$lib/components/todos/TodoTree.svelte';
	import type { TodoNode } from '$lib/server/db/utils';
	import type { spaces, notes as NotesTable } from '$lib/server/db/schema';

	interface Props {
		space: typeof spaces.$inferSelect;
		todos: TodoNode[];
		notes: (typeof NotesTable.$inferSelect)[];
	}

	let { space, todos, notes }: Props = $props();

	let addingTodo = $state(false);
	let newTodoTitle = $state('');
	let newTodoInput = $state<HTMLInputElement | null>(null);

	$effect(() => { if (addingTodo) newTodoInput?.focus(); });
</script>

<div class="flex flex-col gap-6">
	<div>
		<div class="mb-2 flex items-center justify-between">
			<h2 class="text-muted-foreground text-xs font-medium uppercase tracking-wider">Todos</h2>
			<Button variant="ghost" size="icon" class="size-5" onclick={() => addingTodo = true} title="New todo">
				<Plus class="size-3" />
			</Button>
		</div>
		{#if addingTodo}
			<form
				method="POST"
				action="/todos?/create"
				use:enhance={() => ({ update }) => { addingTodo = false; newTodoTitle = ''; update({ invalidateAll: true }); }}
				class="mb-2 flex items-center gap-2"
			>
				<input type="hidden" name="spaceId" value={space.id} />
				<Input name="title" bind:value={newTodoTitle} bind:ref={newTodoInput} placeholder="Todo title" class="flex-1" />
				<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"><Check class="size-4" /></Button>
				<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={() => addingTodo = false}><X class="size-4" /></Button>
			</form>
		{/if}
		{#if todos.length === 0 && !addingTodo}
			<p class="text-muted-foreground text-sm italic">No todos yet.</p>
		{:else if todos.length > 0}
			<ul class="flex flex-col gap-0.5">
				<TodoTree {todos} />
			</ul>
		{/if}
	</div>
	<div>
		<h2 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">Notes</h2>
		{#if notes.length === 0}
			<p class="text-muted-foreground text-sm italic">No notes yet.</p>
		{:else}
			<ul class="flex flex-col gap-1">
				{#each notes as note}
					<li>
						<a href="/spaces/{note.id.replace(/\.md$/, '')}" class="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors">
							<FileText class="text-muted-foreground size-4 shrink-0" />
							{note.title}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
