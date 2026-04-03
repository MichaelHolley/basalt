<script lang="ts">
	import { enhance } from '$app/forms';
	import MilkdownEditor from '$lib/components/editor/milkdown-editor.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { FileText, Calendar, Pencil, Trash2, Plus, Check, X, Link, CheckSquare, Copy } from '@lucide/svelte';
	import TodoTree from '$lib/components/todos/TodoTree.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let titleInput = $state<HTMLInputElement | null>(null);
	let currentContent = $state('');
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let toggleForm = $state<HTMLFormElement | null>(null);
	let isDone = $state(false);
	let childToggleForms = $state<Record<string, HTMLFormElement | null>>({});
	let childDoneState = $state<Record<string, boolean>>({});
	let copied = $state(false);
	let addingRelation = $state(false);
	let relationTargetType = $state<'note' | 'todo'>('note');
	let relationTargetId = $state('');
	let addingChild = $state(false);
	let newChildTitle = $state('');
	let childInput = $state<HTMLInputElement | null>(null);
	let addingTodo = $state(false);
	let newTodoTitle = $state('');
	let newTodoInput = $state<HTMLInputElement | null>(null);

	$effect(() => { if (data.type === 'note') currentContent = data.content; });
	$effect(() => { if (data.type === 'todo') isDone = data.todo.status === 'done'; });
	$effect(() => {
		if (data.type === 'todo') {
			for (const child of data.children) childDoneState[child.id] = child.status === 'done';
		}
	});
	$effect(() => { if (editing) titleInput?.focus(); });
	$effect(() => { if (addingChild) childInput?.focus(); });
	$effect(() => { if (addingTodo) newTodoInput?.focus(); });

	function handleContentChange(content: string) {
		if (data.type !== 'note') return;
		currentContent = content;
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			fetch('/api/notes/autosave', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: data.note.id, content }),
			});
		}, 1000);
	}

	function copyMarkdown() {
		if (data.type !== 'note') return;
		navigator.clipboard.writeText(currentContent).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 1500);
		});
	}

	function startEdit() {
		editing = true;
		if (data.type === 'note') editTitle = data.note.title;
		if (data.type === 'todo') editTitle = data.todo.title;
	}

	function cancelEdit() { editing = false; }
</script>

{#if data.type === 'space'}
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
					<input type="hidden" name="spaceId" value={data.space.id} />
					<Input name="title" bind:value={newTodoTitle} bind:ref={newTodoInput} placeholder="Todo title" class="flex-1" />
					<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"><Check class="size-4" /></Button>
					<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={() => addingTodo = false}><X class="size-4" /></Button>
				</form>
			{/if}
			{#if data.todos.length === 0 && !addingTodo}
				<p class="text-muted-foreground text-sm italic">No todos yet.</p>
			{:else if data.todos.length > 0}
				<ul class="flex flex-col gap-0.5">
					<TodoTree todos={data.todos} />
				</ul>
			{/if}
		</div>
		<div>
			<h2 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">Notes</h2>
			{#if data.notes.length === 0}
				<p class="text-muted-foreground text-sm italic">No notes yet.</p>
			{:else}
				<ul class="flex flex-col gap-1">
					{#each data.notes as note}
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

{:else if data.type === 'note'}
	<div class="flex h-full flex-col gap-0">
		<div class="flex items-center gap-2 border-b px-4 py-2">
			{#if editing}
				<form
					method="POST"
					action="?/rename"
					use:enhance={() => ({ update }) => { editing = false; update({ invalidateAll: true }); }}
					class="flex flex-1 items-center gap-2"
				>
					<input type="hidden" name="id" value={data.note.id} />
					<Input name="title" bind:value={editTitle} bind:ref={titleInput} class="flex-1" />
					<Button type="submit" variant="ghost" size="icon" class="text-primary"><Check class="size-4" /></Button>
					<Button type="button" variant="ghost" size="icon" onclick={cancelEdit}><X class="size-4" /></Button>
				</form>
			{:else}
				<h1 class="flex-1 truncate text-sm font-semibold">{data.note.title}</h1>
				<Button variant="ghost" size="icon" class="size-7" onclick={copyMarkdown} title="Copy as markdown">
					{#if copied}
						<Check class="size-3.5 text-primary" />
					{:else}
						<Copy class="size-3.5" />
					{/if}
				</Button>
				<Button variant="ghost" size="icon" class="size-7" onclick={startEdit} title="Rename note">
					<Pencil class="size-3.5" />
				</Button>
				<form method="POST" action="?/deleteNote" use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="contents">
					<input type="hidden" name="id" value={data.note.id} />
					<Button type="submit" variant="ghost" size="icon" class="size-7 hover:text-destructive" title="Delete note"
						onclick={(e) => { if (!confirm(`Delete "${data.note.title}"?`)) e.preventDefault(); }}>
						<Trash2 class="size-3.5" />
					</Button>
				</form>
			{/if}
		</div>
		<div class="flex min-h-0 flex-1">
			<div class="min-h-0 flex-1">
				{#key data.note.id}
					<MilkdownEditor value={data.content} onchange={handleContentChange} />
				{/key}
			</div>
			<!-- Relations panel -->
			<div class="border-l w-56 shrink-0 overflow-y-auto px-3 py-3">
				<div class="mb-2 flex items-center justify-between">
					<h2 class="text-muted-foreground text-xs font-medium uppercase tracking-wider">Relations</h2>
					<Button variant="ghost" size="icon" class="size-5" onclick={() => { addingRelation = !addingRelation; relationTargetId = ''; }} title="Add relation">
						<Plus class="size-3" />
					</Button>
				</div>
				{#if addingRelation}
					<form method="POST" action="?/createRelation"
						use:enhance={() => ({ update }) => { addingRelation = false; relationTargetId = ''; update({ invalidateAll: true }); }}
						class="mb-2 flex flex-col gap-1.5">
						<input type="hidden" name="currentType" value="note" />
						<input type="hidden" name="currentId" value={data.note.id} />
						<select name="targetType" bind:value={relationTargetType}
							class="bg-background border-input w-full rounded-md border px-2 py-1 text-sm">
							<option value="note">Note</option>
							<option value="todo">Todo</option>
						</select>
						<select name="targetId" bind:value={relationTargetId}
							class="bg-background border-input w-full rounded-md border px-2 py-1 text-sm" required>
							<option value="">Select…</option>
							{#if relationTargetType === 'note'}
								{#each data.allNotes.filter(n => n.id !== data.note.id) as n}
									<option value={n.id}>{n.title}</option>
								{/each}
							{:else}
								{#each data.allTodos as t}
									<option value={t.id}>{t.title}</option>
								{/each}
							{/if}
						</select>
						<div class="flex gap-1">
							<Button type="submit" variant="ghost" size="icon" class="text-primary"><Check class="size-4" /></Button>
							<Button type="button" variant="ghost" size="icon" onclick={() => addingRelation = false}><X class="size-4" /></Button>
						</div>
					</form>
				{/if}
				{#if data.relatedItems.length === 0 && !addingRelation}
					<p class="text-muted-foreground text-xs italic">No relations.</p>
				{:else}
					<ul class="flex flex-col gap-0.5">
						{#each data.relatedItems as item}
							<li class="flex items-center gap-1.5">
								{#if item.type === 'note'}
									<FileText class="text-muted-foreground size-3.5 shrink-0" />
								{:else}
									<CheckSquare class="text-muted-foreground size-3.5 shrink-0" />
								{/if}
								<a href={item.href} class="hover:text-foreground text-muted-foreground min-w-0 flex-1 truncate text-xs">{item.title}</a>
								<form method="POST" action="?/deleteRelation" use:enhance={() => ({ update }) => update({ invalidateAll: true })}>
									<input type="hidden" name="id" value={item.relationId} />
									<Button type="submit" variant="ghost" size="icon" class="size-5 shrink-0 hover:text-destructive" title="Remove relation">
										<X class="size-3" />
									</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>

{:else if data.type === 'todo'}
	<div class="flex max-w-2xl flex-col gap-6">
		<!-- Title + actions -->
		<div class="flex items-start gap-3">
			<form bind:this={toggleForm} method="POST" action="?/toggle"
				use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="mt-1">
				<input type="hidden" name="id" value={data.todo.id} />
				<Checkbox checked={isDone} onCheckedChange={(v) => { isDone = !!v; toggleForm?.requestSubmit(); }} />
			</form>

			{#if editing}
				<form method="POST" action="?/renameTodo"
					use:enhance={() => ({ update }) => { editing = false; update({ invalidateAll: true }); }}
					class="flex flex-1 items-center gap-2">
					<input type="hidden" name="id" value={data.todo.id} />
					<Input name="title" bind:value={editTitle} bind:ref={titleInput} class="flex-1" />
					<Button type="submit" variant="ghost" size="icon" class="text-primary"><Check class="size-4" /></Button>
					<Button type="button" variant="ghost" size="icon" onclick={cancelEdit}><X class="size-4" /></Button>
				</form>
			{:else}
				<h1 class="flex-1 text-base font-semibold {isDone ? 'text-muted-foreground line-through' : ''}">
					{data.todo.title}
				</h1>
				<Button variant="ghost" size="icon" class="size-7 shrink-0" onclick={startEdit} title="Rename">
					<Pencil class="size-3.5" />
				</Button>
				<form method="POST" action="?/deleteTodo" use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="contents">
					<input type="hidden" name="id" value={data.todo.id} />
					<Button type="submit" variant="ghost" size="icon" class="size-7 shrink-0 hover:text-destructive" title="Delete todo"
						onclick={(e) => { if (!confirm(`Delete "${data.todo.title}"?`)) e.preventDefault(); }}>
						<Trash2 class="size-3.5" />
					</Button>
				</form>
			{/if}
		</div>

		<!-- Due date -->
		<form method="POST" action="?/setDueDate" use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="flex items-center gap-2">
			<input type="hidden" name="id" value={data.todo.id} />
			<Calendar class="text-muted-foreground size-4 shrink-0" />
			<input type="date" name="dueDate"
				value={data.todo.dueDate ? new Date(data.todo.dueDate).toISOString().split('T')[0] : ''}
				class="bg-background text-foreground border-input rounded-md border px-2 py-1 text-sm"
				onchange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()} />
			{#if data.todo.dueDate}
				<Button type="submit" variant="ghost" size="icon" class="size-6" title="Clear due date"
					onclick={(e) => {
						e.preventDefault();
						const form = (e.target as HTMLElement).closest('form') as HTMLFormElement;
						const input = form?.querySelector('input[name="dueDate"]') as HTMLInputElement;
						if (input) { input.value = ''; form.requestSubmit(); }
					}}>
					<X class="size-3" />
				</Button>
			{/if}
		</form>

		<!-- Subtasks -->
		<div class="flex flex-col gap-1">
			<div class="flex items-center justify-between">
				<h2 class="text-muted-foreground text-xs font-medium uppercase tracking-wider">Subtasks</h2>
				<Button variant="ghost" size="icon" class="size-6" onclick={() => addingChild = true} title="Add subtask">
					<Plus class="size-3.5" />
				</Button>
			</div>

			{#if addingChild}
				<form method="POST" action="?/createChild"
					use:enhance={() => ({ update }) => { addingChild = false; newChildTitle = ''; update({ invalidateAll: true }); }}
					class="flex items-center gap-2">
					<input type="hidden" name="parentId" value={data.todo.id} />
					<Input name="title" bind:value={newChildTitle} bind:ref={childInput} placeholder="Subtask title" class="flex-1" />
					<Button type="submit" variant="ghost" size="icon" class="text-primary"><Check class="size-4" /></Button>
					<Button type="button" variant="ghost" size="icon" onclick={() => addingChild = false}><X class="size-4" /></Button>
				</form>
			{/if}

			{#if data.children.length === 0 && !addingChild}
				<p class="text-muted-foreground text-sm italic">No subtasks.</p>
			{/if}

			{#each data.children as child}
				<div class="flex items-center gap-2 rounded-md px-1 py-1">
					<form bind:this={childToggleForms[child.id]} method="POST" action="?/toggle"
						use:enhance={() => ({ update }) => update({ invalidateAll: true })}>
						<input type="hidden" name="id" value={child.id} />
						<Checkbox
							checked={childDoneState[child.id] ?? child.status === 'done'}
							onCheckedChange={(v) => { childDoneState[child.id] = !!v; childToggleForms[child.id]?.requestSubmit(); }} />
					</form>
					<a href="/spaces/{child.spaceId}/{child.id}" class="flex flex-1 min-w-0 items-center gap-3 text-sm">
						<span class="truncate {childDoneState[child.id] ?? child.status === 'done' ? 'text-muted-foreground line-through' : ''}">
							{child.title}
						</span>
						{#if child.dueDate}
							<span class="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
								<Calendar class="size-3" />
								{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(child.dueDate))}
							</span>
						{/if}
					</a>
					<form method="POST" action="?/deleteTodo" use:enhance={() => ({ update }) => update({ invalidateAll: true })}>
						<input type="hidden" name="id" value={child.id} />
						<Button type="submit" variant="ghost" size="icon" class="size-5 hover:text-destructive"
							onclick={(e) => { if (!confirm(`Delete "${child.title}"?`)) e.preventDefault(); }}>
							<Trash2 class="size-3" />
						</Button>
					</form>
				</div>
			{/each}
		</div>

		<!-- Relations panel -->
		<div class="flex flex-col gap-1">
			<div class="flex items-center justify-between">
				<h2 class="text-muted-foreground text-xs font-medium uppercase tracking-wider">Relations</h2>
				<Button variant="ghost" size="icon" class="size-6" onclick={() => { addingRelation = !addingRelation; relationTargetId = ''; }} title="Add relation">
					<Plus class="size-3.5" />
				</Button>
			</div>
			{#if addingRelation}
				<form method="POST" action="?/createRelation"
					use:enhance={() => ({ update }) => { addingRelation = false; relationTargetId = ''; update({ invalidateAll: true }); }}
					class="flex items-center gap-2">
					<input type="hidden" name="currentType" value="todo" />
					<input type="hidden" name="currentId" value={data.todo.id} />
					<select name="targetType" bind:value={relationTargetType}
						class="bg-background border-input rounded-md border px-2 py-1 text-sm">
						<option value="note">Note</option>
						<option value="todo">Todo</option>
					</select>
					<select name="targetId" bind:value={relationTargetId}
						class="bg-background border-input min-w-0 flex-1 rounded-md border px-2 py-1 text-sm" required>
						<option value="">Select…</option>
						{#if relationTargetType === 'note'}
							{#each data.allNotes as n}
								<option value={n.id}>{n.title}</option>
							{/each}
						{:else}
							{#each data.allTodos.filter(t => t.id !== data.todo.id) as t}
								<option value={t.id}>{t.title}</option>
							{/each}
						{/if}
					</select>
					<Button type="submit" variant="ghost" size="icon" class="shrink-0 text-primary"><Check class="size-4" /></Button>
					<Button type="button" variant="ghost" size="icon" class="shrink-0" onclick={() => addingRelation = false}><X class="size-4" /></Button>
				</form>
			{/if}
			{#if data.relatedItems.length === 0 && !addingRelation}
				<p class="text-muted-foreground text-sm italic">No relations.</p>
			{:else}
				<ul class="flex flex-col gap-0.5">
					{#each data.relatedItems as item}
						<li class="flex items-center gap-2 rounded-md px-1 py-0.5">
							{#if item.type === 'note'}
								<FileText class="text-muted-foreground size-3.5 shrink-0" />
							{:else}
								<CheckSquare class="text-muted-foreground size-3.5 shrink-0" />
							{/if}
							<a href={item.href} class="hover:text-foreground text-muted-foreground flex-1 truncate text-sm">{item.title}</a>
							<form method="POST" action="?/deleteRelation" use:enhance={() => ({ update }) => update({ invalidateAll: true })}>
								<input type="hidden" name="id" value={item.relationId} />
								<Button type="submit" variant="ghost" size="icon" class="size-5 hover:text-destructive" title="Remove relation">
									<X class="size-3" />
								</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}
