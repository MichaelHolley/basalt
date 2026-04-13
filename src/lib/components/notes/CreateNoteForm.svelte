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

<form
	bind:this={createFormEl}
	method="POST"
	action="/notes?/create"
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

<div class="flex items-center gap-2 border-b p-1 pb-1">
	<button
		type="button"
		class="flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground"
		onclick={onback}
		aria-label="Back to search"
	>
		<ArrowLeft class="size-4" />
	</button>
	<span class="text-xs font-medium text-muted-foreground">New Note</span>
	{#if activeSpaceName}
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
			if (e.key === 'Enter') {
				e.preventDefault();
				submitCreate();
			}
		}}
	/>
</div>

<div class="px-3 py-4 text-center text-xs text-muted-foreground">
	{#if appStore.activeSpaceId}
		Press <kbd class="rounded border px-1 py-0.5 font-mono text-xs">Enter</kbd> to create ·
		<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
	{:else}
		<span class="text-amber-500">No active space — navigate to a space first</span>
		·
		<kbd class="rounded border px-1 py-0.5 font-mono text-xs">Esc</kbd> to go back
	{/if}
</div>
