<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { FileText, Plus, Pencil, Check, X } from '@lucide/svelte';
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

	let editingName = $state(false);
	let editedName = $state('');
	let nameInput = $state<HTMLInputElement | null>(null);

	let addingNote = $state(false);
	let newNoteTitle = $state('');
	let newNoteInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (addingTodo) newTodoInput?.focus();
	});

	$effect(() => {
		if (editingName) nameInput?.focus();
	});

	$effect(() => {
		if (addingNote) newNoteInput?.focus();
	});

	function startEditName() {
		editedName = space.name;
		editingName = true;
	}

	function cancelEditName() {
		editingName = false;
		editedName = '';
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		{#if editingName}
			<form
				method="POST"
				action="/spaces?/rename"
				use:enhance={() =>
					({ update }) => {
						editingName = false;
						editedName = '';
						update({ invalidateAll: true });
					}}
				class="flex items-center gap-2"
			>
				<input type="hidden" name="id" value={space.id} />
				<Input
					name="name"
					bind:value={editedName}
					bind:ref={nameInput}
					class="text-2xl font-semibold"
					onkeydown={(e) => {
						if (e.key === 'Escape') cancelEditName();
					}}
					onblur={(e) => {
						const rel = e.relatedTarget as HTMLElement | null;
						if (!rel?.closest('form[action="/spaces?/rename"]')) cancelEditName();
					}}
				/>
				<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary">
					<Check class="size-4" />
				</Button>
				<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={cancelEditName}>
					<X class="size-4" />
				</Button>
			</form>
		{:else}
			<div class="group flex items-center gap-2">
				<h1 class="text-2xl font-semibold">
					{space.name}
				</h1>
				<Button
					variant="ghost"
					size="icon"
					class="size-6 opacity-0 group-hover:opacity-100"
					onclick={startEditName}
					title="Rename space"
				>
					<Pencil class="size-3.5" />
				</Button>
			</div>
		{/if}
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
			<form
				method="POST"
				action="/todos?/create"
				use:enhance={() =>
					({ update }) => {
						addingTodo = false;
						newTodoTitle = '';
						update({ invalidateAll: true });
					}}
				class="mb-2 flex items-center gap-2"
			>
				<input type="hidden" name="spaceId" value={space.id} />
				<Input
					name="title"
					bind:value={newTodoTitle}
					bind:ref={newTodoInput}
					placeholder="Todo title"
					class="flex-1"
				/>
				<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"
					><Check class="size-4" /></Button
				>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="shrink-0"
					onclick={() => (addingTodo = false)}><X class="size-4" /></Button
				>
			</form>
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
					newNoteTitle = '';
				}}
				title="New note"
			>
				<Plus class="size-3" />
			</Button>
		</div>
		{#if addingNote}
			<form
				method="POST"
				action="/notes?/create"
				use:enhance={() =>
					({ update }) => {
						addingNote = false;
						newNoteTitle = '';
						update({ invalidateAll: true });
					}}
				class="mb-2 flex items-center gap-2"
			>
				<input type="hidden" name="spaceId" value={space.id} />
				<Input
					name="title"
					bind:value={newNoteTitle}
					bind:ref={newNoteInput}
					placeholder="Note title"
					class="flex-1"
				/>
				<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"
					><Check class="size-4" /></Button
				>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="shrink-0"
					onclick={() => (addingNote = false)}><X class="size-4" /></Button
				>
			</form>
		{/if}
		{#if notes.length === 0 && !addingNote}
			<p class="text-sm text-muted-foreground italic">No notes yet.</p>
		{:else if notes.length > 0}
			<ul class="flex flex-col gap-1">
				{#each notes as note (note.id)}
					<li>
						<a
							href="/spaces/{note.id.replace(/\.md$/, '')}"
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
