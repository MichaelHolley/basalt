<script lang="ts">
	import { enhance } from '$app/forms';
	import { appStore } from '@/stores/app.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	interface Props {
		activeSpaceName: string | null;
		onback: () => void;
		ondone: () => void;
	}

	let { activeSpaceName, onback, ondone }: Props = $props();

	let nameValue = $state('');
	let linkToNote = $state(appStore.activeNoteId !== null);
	let nameInputEl = $state<HTMLInputElement | null>(null);
	let createFormEl = $state<HTMLFormElement | null>(null);

	$effect(() => {
		nameInputEl?.focus();
	});

	function submitCreate() {
		if (!nameValue.trim()) return;
		if (!appStore.activeSpaceId) return;
		createFormEl?.requestSubmit();
	}
</script>

{#if linkToNote && appStore.activeNoteId}
	<form
		bind:this={createFormEl}
		method="POST"
		action="/spaces/{appStore.activeNoteId}?/createLinkedTodo"
		use:enhance={() =>
			({ update }) => {
				ondone();
				nameValue = '';
				return update({ invalidateAll: true });
			}}
	>
		<input type="hidden" name="noteId" value={appStore.activeNoteId} />
		<input type="hidden" name="spaceId" value={appStore.activeSpaceId ?? ''} />
		<input type="hidden" name="title" value={nameValue} />
	</form>
{:else}
	<form
		bind:this={createFormEl}
		method="POST"
		action="/todos?/create"
		use:enhance={() =>
			({ update }) => {
				ondone();
				nameValue = '';
				return update({ invalidateAll: true });
			}}
	>
		<input type="hidden" name="spaceId" value={appStore.activeSpaceId ?? ''} />
		<input type="hidden" name="title" value={nameValue} />
	</form>
{/if}

<div class="flex items-center gap-2 border-b p-1 pb-1">
	<button
		type="button"
		class="flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground"
		onclick={onback}
		aria-label="Back to search"
	>
		<ArrowLeft class="size-4" />
	</button>
	<span class="text-xs font-medium text-muted-foreground">New Todo</span>
	{#if appStore.activeNoteId}
		<button
			type="button"
			class="rounded-sm px-1.5 py-0.5 text-xs transition-colors {linkToNote
				? 'bg-primary/15 text-primary ring-1 ring-primary/30'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			onclick={() => (linkToNote = !linkToNote)}
			title="Toggle note link (Tab)"
		>
			{linkToNote ? (appStore.activeNoteTitle ?? 'note') : (activeSpaceName ?? 'space')}
		</button>
	{:else if activeSpaceName}
		<span
			class="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
			title={appStore.activeSpaceId ?? ''}
		>
			{activeSpaceName}
		</span>
	{/if}
	<input
		bind:this={nameInputEl}
		bind:value={nameValue}
		class="h-8 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
		placeholder="Enter name…"
		onkeydown={(e) => {
			if (e.key === 'Tab' && appStore.activeNoteId) {
				e.preventDefault();
				linkToNote = !linkToNote;
			} else if (e.key === 'Enter') {
				e.preventDefault();
				submitCreate();
			}
		}}
	/>
</div>

<div class="px-3 py-4 text-center text-xs text-muted-foreground">
	{#if appStore.activeSpaceId}
		Press <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Enter</kbd> to create
		{#if appStore.activeNoteId}
			· <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Tab</kbd> to toggle link
		{/if}
		· <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
	{:else}
		<span class="text-amber-500">No active space — navigate to a space first</span>
		·
		<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
	{/if}
</div>
