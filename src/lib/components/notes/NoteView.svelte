<script lang="ts">
	import { enhance } from '$app/forms';
	import MilkdownEditor from '@/components/notes/MarkdownEditor.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, Check, X, Copy } from '@lucide/svelte';
	import type { Note } from '$lib/server/db/types';
	import { Debounced, watch } from 'runed';

	interface Props {
		note: Note;
		content: string;
	}

	let { note, content }: Props = $props();

	let editing = $state(false);
	let editTitle = $state('');
	let titleInput = $state<HTMLInputElement | null>(null);
	let pendingSave = $state<{ id: string; content: string } | null>(null);
	let copied = $state(false);
	const debouncedSave = new Debounced(() => pendingSave, 1000);

	let currentContent = $derived(content);

	$effect(() => {
		if (editing) titleInput?.focus();
	});

	watch(
		() => debouncedSave.current,
		() => {
			if (debouncedSave.current === null) return;
			save(debouncedSave.current);
		},
		{ lazy: true }
	);

	watch(
		() => note.id,
		() => {
			if (pendingSave && pendingSave.id !== note.id) {
				save(pendingSave);
				pendingSave = null;
			}
		},
		{ lazy: true }
	);

	function save(payload: { id: string; content: string }) {
		fetch('/api/notes/autosave', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	}

	// The editor reports the id it was mounted with, so an update emitted while
	// switching notes is saved to the note it came from, not the newly opened one.
	function handleContentChange(noteId: string | undefined, newContent: string) {
		if (!noteId) return;
		if (noteId === note.id) currentContent = newContent;
		pendingSave = { id: noteId, content: newContent };
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
			<MilkdownEditor value={content} noteId={note.id} onchange={handleContentChange} />
		{/key}
	</div>
</div>
