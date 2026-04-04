<script lang="ts">
	import { enhance } from '$app/forms';
	import MilkdownEditor from '@/components/notes/MarkdownEditor.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, Check, X, Copy } from '@lucide/svelte';
	import type { notes } from '$lib/server/db/schema';

	interface Props {
		note: typeof notes.$inferSelect;
		content: string;
	}

	let { note, content }: Props = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let titleInput = $state<HTMLInputElement | null>(null);
	let currentContent = $state('');
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let copied = $state(false);

	$effect(() => {
		currentContent = content;
	});
	$effect(() => {
		if (editing) titleInput?.focus();
	});

	function handleContentChange(newContent: string) {
		currentContent = newContent;
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			fetch('/api/notes/autosave', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: note.id, content: newContent })
			});
		}, 1000);
	}

	function copyMarkdown() {
		navigator.clipboard.writeText(currentContent).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 1500);
		});
	}

	function startEdit() {
		editing = true;
		editTitle = note.title;
	}

	function cancelEdit() {
		editing = false;
	}
</script>

<div class="flex h-full flex-1 flex-col">
	<div class="flex items-center gap-2 border-b px-4 py-2">
		{#if editing}
			<form
				method="POST"
				action="?/rename"
				use:enhance={() =>
					({ update }) => {
						editing = false;
						update({ invalidateAll: true });
					}}
				class="flex flex-1 items-center gap-2"
			>
				<input type="hidden" name="id" value={note.id} />
				<Input name="title" bind:value={editTitle} bind:ref={titleInput} class="flex-1" />
				<Button type="submit" variant="ghost" size="icon" class="text-primary"
					><Check class="size-4" /></Button
				>
				<Button type="button" variant="ghost" size="icon" onclick={cancelEdit}
					><X class="size-4" /></Button
				>
			</form>
		{:else}
			<h1 class="flex-1 truncate text-sm font-semibold">{note.title}</h1>
			<Button
				variant="ghost"
				size="icon"
				class="size-7"
				onclick={copyMarkdown}
				title="Copy as markdown"
			>
				{#if copied}
					<Check class="size-3.5 text-primary" />
				{:else}
					<Copy class="size-3.5" />
				{/if}
			</Button>
			<Button variant="ghost" size="icon" class="size-7" onclick={startEdit} title="Rename note">
				<Pencil class="size-3.5" />
			</Button>
			<form
				method="POST"
				action="?/deleteNote"
				use:enhance={() =>
					({ update }) =>
						update({ invalidateAll: true })}
				class="contents"
			>
				<input type="hidden" name="id" value={note.id} />
				<Button
					type="submit"
					variant="ghost"
					size="icon"
					class="size-7 hover:text-destructive"
					title="Delete note"
					onclick={(e) => {
						if (!confirm(`Delete "${note.title}"?`)) e.preventDefault();
					}}
				>
					<Trash2 class="size-3.5" />
				</Button>
			</form>
		{/if}
	</div>
	<div class="min-h-0 flex-1">
		{#key note.id}
			<MilkdownEditor value={content} onchange={handleContentChange} />
		{/key}
	</div>
</div>
