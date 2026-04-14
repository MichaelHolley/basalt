<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import type { Todo } from '$lib/server/db/types';
	import { Check, Pencil, Trash2, X } from '@lucide/svelte';

	interface Props {
		todo: Todo;
	}

	let { todo }: Props = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let titleInput = $state<HTMLInputElement | null>(null);
	let toggleForm = $state<HTMLFormElement | null>(null);
	let isDone = $state(false);

	$effect(() => {
		isDone = todo.status === 'done';
	});
	$effect(() => {
		if (editing) titleInput?.focus();
	});

	function startEdit() {
		editing = true;
		editTitle = todo.title;
	}

	function cancelEdit() {
		editing = false;
	}
</script>

<div class="flex items-start gap-3">
	<form
		bind:this={toggleForm}
		method="POST"
		action="?/toggle"
		use:enhance={() =>
			({ update }) =>
				update({ invalidateAll: true })}
		class="mt-1"
	>
		<input type="hidden" name="id" value={todo.id} />
		<Checkbox
			checked={isDone}
			onCheckedChange={(v) => {
				isDone = !!v;
				toggleForm?.requestSubmit();
			}}
		/>
	</form>

	{#if editing}
		<form
			method="POST"
			action="?/renameTodo"
			use:enhance={() =>
				({ update }) => {
					editing = false;
					update({ invalidateAll: true });
				}}
			class="flex flex-1 items-center gap-2"
		>
			<input type="hidden" name="id" value={todo.id} />
			<Input name="title" bind:value={editTitle} bind:ref={titleInput} class="flex-1" />
			<Button type="submit" variant="ghost" size="icon" class="text-primary"
				><Check class="size-4" /></Button
			>
			<Button type="button" variant="ghost" size="icon" onclick={cancelEdit}
				><X class="size-4" /></Button
			>
		</form>
	{:else}
		<h1 class="flex-1 text-base font-semibold {isDone ? 'text-muted-foreground line-through' : ''}">
			{todo.title}
		</h1>
		<Button variant="ghost" size="icon" class="size-7 shrink-0" onclick={startEdit} title="Rename">
			<Pencil class="size-3.5" />
		</Button>
		<form
			method="POST"
			action="?/deleteTodo"
			use:enhance={() =>
				({ update }) =>
					update({ invalidateAll: true })}
			class="contents"
		>
			<input type="hidden" name="id" value={todo.id} />
			<Button
				type="submit"
				variant="ghost"
				size="icon"
				class="size-7 shrink-0 hover:text-destructive"
				title="Delete todo"
				onclick={(e) => {
					if (!confirm(`Delete "${todo.title}"?`)) e.preventDefault();
				}}
			>
				<Trash2 class="size-3.5" />
			</Button>
		</form>
	{/if}
</div>
