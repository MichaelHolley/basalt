<script lang="ts">
	import { enhance } from '$app/forms';
	import MilkdownEditor from '$lib/components/editor/milkdown-editor.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { FileText, Pencil, Trash2, Check, X } from '@lucide/svelte';
	import TodoTree from '$lib/components/todos/TodoTree.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let titleInput = $state<HTMLInputElement | null>(null);

	// Autosave
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleContentChange(content: string) {
		if (data.type !== 'note') return;
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			fetch('/api/notes/autosave', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: data.note.id, content }),
			});
		}, 1000);
	}

	function startEdit() {
		editing = true;
		editTitle = data.type === 'note' ? data.note.title : '';
	}

	function cancelEdit() {
		editing = false;
	}

	$effect(() => {
		if (editing) titleInput?.focus();
	});
</script>

{#if data.type === 'space'}
	<div class="flex flex-col gap-6">
		<div>
			<h2 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">Todos</h2>
			{#if data.todos.length === 0}
				<p class="text-muted-foreground text-sm italic">No todos yet.</p>
			{:else}
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
							<a
								href="/spaces/{note.id.replace(/\.md$/, '')}"
								class="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
							>
								<FileText class="text-muted-foreground size-4 shrink-0" />
								{note.title}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{:else}
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
					<Button type="submit" variant="ghost" size="icon" class="text-primary">
						<Check class="size-4" />
					</Button>
					<Button type="button" variant="ghost" size="icon" onclick={cancelEdit}>
						<X class="size-4" />
					</Button>
				</form>
			{:else}
				<h1 class="flex-1 truncate text-sm font-semibold">{data.note.title}</h1>
				<Button variant="ghost" size="icon" class="size-7" onclick={startEdit} title="Rename note">
					<Pencil class="size-3.5" />
				</Button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => ({ update }) => update({ invalidateAll: true })}
					class="contents"
				>
					<input type="hidden" name="id" value={data.note.id} />
					<Button
						type="submit"
						variant="ghost"
						size="icon"
						class="size-7 hover:text-destructive"
						title="Delete note"
						onclick={(e) => { if (!confirm(`Delete "${data.note.title}"?`)) e.preventDefault(); }}
					>
						<Trash2 class="size-3.5" />
					</Button>
				</form>
			{/if}
		</div>
		<div class="min-h-0 flex-1">
			<MilkdownEditor value={data.content} onchange={handleContentChange} />
		</div>
	</div>
{/if}
