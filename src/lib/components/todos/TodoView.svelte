<script lang="ts">
	import { enhance } from '$app/forms';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Pencil, Trash2, Plus, Check, X } from '@lucide/svelte';
	import type { todos } from '$lib/server/db/schema';
	import type { TodoWithDepth } from '$lib/server/db/utils';

	interface Props {
		todo: typeof todos.$inferSelect;
		children: TodoWithDepth[];
	}

	let { todo, children }: Props = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let titleInput = $state<HTMLInputElement | null>(null);
	let toggleForm = $state<HTMLFormElement | null>(null);
	let isDone = $state(false);
	let childToggleForms = $state<Record<string, HTMLFormElement | null>>({});
	let childDoneState = $state<Record<string, boolean>>({});
	let addingChild = $state(false);
	let newChildTitle = $state('');
	let childInput = $state<HTMLInputElement | null>(null);

	$effect(() => { isDone = todo.status === 'done'; });
	$effect(() => {
		for (const child of children) childDoneState[child.id] = child.status === 'done';
	});
	$effect(() => { if (editing) titleInput?.focus(); });
	$effect(() => { if (addingChild) childInput?.focus(); });

	function startEdit() {
		editing = true;
		editTitle = todo.title;
	}

	function cancelEdit() { editing = false; }
</script>

<div class="flex max-w-2xl flex-1 flex-col gap-6 overflow-y-auto p-4">
	<!-- Title + actions -->
	<div class="flex items-start gap-3">
		<form bind:this={toggleForm} method="POST" action="?/toggle"
			use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="mt-1">
			<input type="hidden" name="id" value={todo.id} />
			<Checkbox checked={isDone} onCheckedChange={(v) => { isDone = !!v; toggleForm?.requestSubmit(); }} />
		</form>

		{#if editing}
			<form method="POST" action="?/renameTodo"
				use:enhance={() => ({ update }) => { editing = false; update({ invalidateAll: true }); }}
				class="flex flex-1 items-center gap-2">
				<input type="hidden" name="id" value={todo.id} />
				<Input name="title" bind:value={editTitle} bind:ref={titleInput} class="flex-1" />
				<Button type="submit" variant="ghost" size="icon" class="text-primary"><Check class="size-4" /></Button>
				<Button type="button" variant="ghost" size="icon" onclick={cancelEdit}><X class="size-4" /></Button>
			</form>
		{:else}
			<h1 class="flex-1 text-base font-semibold {isDone ? 'text-muted-foreground line-through' : ''}">
				{todo.title}
			</h1>
			<Button variant="ghost" size="icon" class="size-7 shrink-0" onclick={startEdit} title="Rename">
				<Pencil class="size-3.5" />
			</Button>
			<form method="POST" action="?/deleteTodo" use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="contents">
				<input type="hidden" name="id" value={todo.id} />
				<Button
					type="submit"
					variant="ghost"
					size="icon"
					class="size-7 shrink-0 hover:text-destructive"
					title="Delete todo"
					onclick={(e) => { if (!confirm(`Delete "${todo.title}"?`)) e.preventDefault(); }}
				>
					<Trash2 class="size-3.5" />
				</Button>
			</form>
		{/if}
	</div>

	<!-- Due date -->
	<form method="POST" action="?/setDueDate" use:enhance={() => ({ update }) => update({ invalidateAll: true })} class="flex items-center gap-2">
		<input type="hidden" name="id" value={todo.id} />
		<Calendar class="text-muted-foreground size-4 shrink-0" />
		<input
			type="date"
			name="dueDate"
			value={todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''}
			class="bg-background text-foreground border-input rounded-md border px-2 py-1 text-sm"
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
					if (input) { input.value = ''; form.requestSubmit(); }
				}}
			>
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
				<input type="hidden" name="parentId" value={todo.id} />
				<Input name="title" bind:value={newChildTitle} bind:ref={childInput} placeholder="Subtask title" class="flex-1" />
				<Button type="submit" variant="ghost" size="icon" class="text-primary"><Check class="size-4" /></Button>
				<Button type="button" variant="ghost" size="icon" onclick={() => addingChild = false}><X class="size-4" /></Button>
			</form>
		{/if}

		{#if children.length === 0 && !addingChild}
			<p class="text-muted-foreground text-sm italic">No subtasks.</p>
		{/if}

		{#each children as child}
			<div class="flex items-center gap-2 rounded-md px-1 py-1" style="padding-left: {(child.depth - 1) * 1.25}rem">
				<form bind:this={childToggleForms[child.id]} method="POST" action="?/toggle"
					use:enhance={() => ({ update }) => update({ invalidateAll: true })}>
					<input type="hidden" name="id" value={child.id} />
					<Checkbox
						checked={childDoneState[child.id] ?? child.status === 'done'}
						onCheckedChange={(v) => { childDoneState[child.id] = !!v; childToggleForms[child.id]?.requestSubmit(); }}
					/>
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
					<Button
						type="submit"
						variant="ghost"
						size="icon"
						class="size-5 hover:text-destructive"
						onclick={(e) => { if (!confirm(`Delete "${child.title}"?`)) e.preventDefault(); }}
					>
						<Trash2 class="size-3" />
					</Button>
				</form>
			</div>
		{/each}
	</div>
</div>
